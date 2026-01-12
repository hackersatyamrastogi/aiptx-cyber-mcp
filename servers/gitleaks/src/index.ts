#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { spawn } from "child_process";

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: mcp-gitleaks <path-to-gitleaks-binary>");
  console.error("Example: mcp-gitleaks gitleaks");
  console.error("Example: mcp-gitleaks /usr/local/bin/gitleaks");
  process.exit(1);
}

const gitleaksBinary = args[0];

const server = new McpServer({
  name: "gitleaks",
  version: "1.0.0",
});

function runGitleaks(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(gitleaksBinary, args);
    let output = "";
    let errorOutput = "";

    proc.stdout.on("data", (data) => {
      output += data.toString();
    });

    proc.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    proc.on("close", (code) => {
      // Gitleaks returns 1 when leaks are found, which is not an error
      if (code === 0 || code === 1) {
        resolve(output || errorOutput);
      } else {
        reject(new Error(errorOutput || `Gitleaks exited with code ${code}`));
      }
    });

    proc.on("error", (error) => {
      reject(new Error(`Failed to start gitleaks: ${error.message}`));
    });
  });
}

server.tool(
  "gitleaks-detect",
  "Scan a directory or git repository for secrets and credentials",
  {
    path: z.string().describe("Path to directory or git repository to scan"),
    noGit: z.boolean().optional().default(false)
      .describe("Scan directory without git history (faster for non-git directories)"),
    verbose: z.boolean().optional().default(false)
      .describe("Enable verbose output"),
  },
  async ({ path, noGit, verbose }) => {
    const args = ["detect", "--source", path, "--report-format", "json", "--report-path", "/dev/stdout"];

    if (noGit) {
      args.push("--no-git");
    }

    if (verbose) {
      args.push("--verbose");
    }

    try {
      const output = await runGitleaks(args);

      if (!output.trim() || output.trim() === "[]") {
        return {
          content: [{ type: "text", text: "No secrets detected." }],
        };
      }

      try {
        const findings = JSON.parse(output);
        const summary = {
          total_secrets: findings.length,
          by_rule: findings.reduce((acc: any, f: any) => {
            acc[f.RuleID] = (acc[f.RuleID] || 0) + 1;
            return acc;
          }, {}),
          findings: findings.map((f: any) => ({
            rule: f.RuleID,
            description: f.Description,
            file: f.File,
            line: f.StartLine,
            commit: f.Commit?.substring(0, 8),
            author: f.Author,
            date: f.Date,
            secret: f.Secret ? `${f.Secret.substring(0, 10)}...` : "redacted",
          })),
        };

        return {
          content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
        };
      } catch {
        return { content: [{ type: "text", text: output }] };
      }
    } catch (error) {
      throw new Error(`Gitleaks scan failed: ${error}`);
    }
  }
);

server.tool(
  "gitleaks-protect",
  "Scan staged changes in a git repository (pre-commit hook style)",
  {
    path: z.string().describe("Path to git repository"),
  },
  async ({ path }) => {
    const args = ["protect", "--source", path, "--report-format", "json", "--report-path", "/dev/stdout", "--staged"];

    try {
      const output = await runGitleaks(args);

      if (!output.trim() || output.trim() === "[]") {
        return {
          content: [{ type: "text", text: "No secrets detected in staged changes. Safe to commit." }],
        };
      }

      const findings = JSON.parse(output);

      return {
        content: [
          {
            type: "text",
            text: `WARNING: ${findings.length} secret(s) found in staged changes!\n\n${JSON.stringify(findings, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Gitleaks protect failed: ${error}`);
    }
  }
);

server.tool(
  "gitleaks-git-log",
  "Scan git history for secrets (specific commits or range)",
  {
    path: z.string().describe("Path to git repository"),
    commitRange: z.string().optional()
      .describe("Git commit range (e.g., 'HEAD~10..HEAD', 'abc123..def456')"),
    since: z.string().optional()
      .describe("Scan commits since date (e.g., '2024-01-01')"),
  },
  async ({ path, commitRange, since }) => {
    const args = ["detect", "--source", path, "--report-format", "json", "--report-path", "/dev/stdout"];

    if (commitRange) {
      args.push("--log-opts", commitRange);
    }

    if (since) {
      args.push("--log-opts", `--since=${since}`);
    }

    try {
      const output = await runGitleaks(args);

      if (!output.trim() || output.trim() === "[]") {
        return {
          content: [{ type: "text", text: "No secrets detected in git history." }],
        };
      }

      const findings = JSON.parse(output);

      const byCommit = findings.reduce((acc: any, f: any) => {
        const commit = f.Commit?.substring(0, 8) || "unknown";
        if (!acc[commit]) {
          acc[commit] = { author: f.Author, date: f.Date, secrets: [] };
        }
        acc[commit].secrets.push({
          rule: f.RuleID,
          file: f.File,
          line: f.StartLine,
        });
        return acc;
      }, {});

      return {
        content: [
          {
            type: "text",
            text: `Found ${findings.length} secrets across ${Object.keys(byCommit).length} commits:\n\n${JSON.stringify(byCommit, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Git log scan failed: ${error}`);
    }
  }
);

server.tool(
  "gitleaks-rules",
  "List all detection rules supported by Gitleaks",
  {},
  async () => {
    const rules = `Gitleaks Detection Rules (Common):

API KEYS & TOKENS:
  - aws-access-key         - AWS Access Key ID
  - aws-secret-key         - AWS Secret Access Key
  - gcp-api-key            - Google Cloud API Key
  - azure-storage-key      - Azure Storage Account Key
  - github-pat             - GitHub Personal Access Token
  - gitlab-pat             - GitLab Personal Access Token
  - slack-token            - Slack API Token
  - stripe-api-key         - Stripe API Key
  - twilio-api-key         - Twilio API Key
  - sendgrid-api-key       - SendGrid API Key
  - mailchimp-api-key      - Mailchimp API Key

CLOUD PROVIDERS:
  - aws-*                  - Various AWS credentials
  - gcp-*                  - Various GCP credentials
  - azure-*                - Various Azure credentials
  - digitalocean-*         - DigitalOcean tokens
  - heroku-api-key         - Heroku API Key

DATABASE & INFRASTRUCTURE:
  - postgres-password      - PostgreSQL connection strings
  - mysql-password         - MySQL connection strings
  - mongodb-connection     - MongoDB connection strings
  - redis-password         - Redis passwords

PRIVATE KEYS:
  - private-key            - Generic private keys
  - rsa-private-key        - RSA private keys
  - ssh-private-key        - SSH private keys
  - pgp-private-key        - PGP private keys

OTHER:
  - jwt                    - JSON Web Tokens
  - generic-api-key        - Generic API keys
  - password-in-url        - Passwords in URLs
  - bearer-token           - Bearer tokens

Use custom config with --config flag for additional rules.`;

    return {
      content: [{ type: "text", text: rules }],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Gitleaks MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
