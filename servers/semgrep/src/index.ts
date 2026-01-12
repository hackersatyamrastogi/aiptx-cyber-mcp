#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { spawn } from "child_process";

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: mcp-semgrep <path-to-semgrep-binary>");
  console.error("Example: mcp-semgrep semgrep");
  console.error("Example: mcp-semgrep /usr/local/bin/semgrep");
  process.exit(1);
}

const semgrepBinary = args[0];

const server = new McpServer({
  name: "semgrep",
  version: "1.0.0",
});

function runSemgrep(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(semgrepBinary, args);
    let output = "";
    let errorOutput = "";

    proc.stdout.on("data", (data) => {
      output += data.toString();
    });

    proc.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    proc.on("close", (code) => {
      // Semgrep returns non-zero for findings, so we check both
      if (output) {
        resolve(output);
      } else if (code !== 0 && errorOutput) {
        reject(new Error(errorOutput));
      } else {
        resolve(output || "No findings");
      }
    });

    proc.on("error", (error) => {
      reject(new Error(`Failed to start semgrep: ${error.message}`));
    });
  });
}

server.tool(
  "semgrep-scan",
  "Run Semgrep static analysis scan on code",
  {
    target: z.string().describe("Path to file or directory to scan"),
    config: z.string().optional().default("auto")
      .describe(`Semgrep configuration. Options:
  - auto: Auto-detect rules based on project
  - p/security-audit: Security-focused rules
  - p/owasp-top-ten: OWASP Top 10 rules
  - p/r2c-security-audit: Comprehensive security
  - p/secrets: Secret detection
  - p/javascript: JavaScript rules
  - p/python: Python rules
  - p/typescript: TypeScript rules
  - p/react: React-specific rules
  - p/nodejs: Node.js rules
  - <path>: Custom rule file or directory`),
    severity: z.enum(["INFO", "WARNING", "ERROR", "all"]).optional().default("all")
      .describe("Minimum severity to report"),
    json: z.boolean().optional().default(true)
      .describe("Output results in JSON format"),
  },
  async ({ target, config, severity, json }) => {
    const args = ["--config", config, target];

    if (json) {
      args.push("--json");
    }

    if (severity !== "all") {
      args.push("--severity", severity);
    }

    args.push("--no-git-ignore"); // Scan all files

    try {
      const output = await runSemgrep(args);

      if (json) {
        try {
          const parsed = JSON.parse(output);
          const summary = {
            findings: parsed.results?.length || 0,
            errors: parsed.errors?.length || 0,
            results: parsed.results?.map((r: any) => ({
              rule: r.check_id,
              severity: r.extra?.severity,
              message: r.extra?.message,
              file: r.path,
              line: r.start?.line,
              code: r.extra?.lines,
            })),
          };
          return {
            content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
          };
        } catch {
          return { content: [{ type: "text", text: output }] };
        }
      }

      return { content: [{ type: "text", text: output }] };
    } catch (error) {
      throw new Error(`Semgrep scan failed: ${error}`);
    }
  }
);

server.tool(
  "semgrep-ci",
  "Run Semgrep in CI mode for pull request scanning",
  {
    target: z.string().describe("Path to repository to scan"),
    baseline: z.string().optional()
      .describe("Git ref to compare against (e.g., main, HEAD~1)"),
  },
  async ({ target, baseline }) => {
    const args = ["ci", "--json"];

    if (baseline) {
      args.push("--baseline-commit", baseline);
    }

    args.push(target);

    try {
      const output = await runSemgrep(args);
      return { content: [{ type: "text", text: output }] };
    } catch (error) {
      throw new Error(`Semgrep CI failed: ${error}`);
    }
  }
);

server.tool(
  "semgrep-rules",
  "List available Semgrep rule packs",
  {},
  async () => {
    const rulePacks = `Available Semgrep Rule Packs:

SECURITY:
  p/security-audit     - Comprehensive security audit
  p/owasp-top-ten      - OWASP Top 10 vulnerabilities
  p/r2c-security-audit - R2C security rules
  p/secrets            - Secret/credential detection
  p/supply-chain       - Supply chain security
  p/cwe-top-25         - CWE Top 25 weaknesses

LANGUAGE-SPECIFIC:
  p/javascript         - JavaScript best practices
  p/typescript         - TypeScript rules
  p/python             - Python security & quality
  p/java               - Java security rules
  p/go                 - Go security rules
  p/ruby               - Ruby security rules
  p/php                - PHP security rules
  p/c                  - C/C++ security rules
  p/rust               - Rust rules

FRAMEWORKS:
  p/react              - React security rules
  p/nextjs             - Next.js rules
  p/nodejs             - Node.js security
  p/django             - Django security
  p/flask              - Flask security
  p/express            - Express.js rules
  p/rails              - Ruby on Rails

SPECIALIZED:
  p/jwt                - JWT security issues
  p/sql-injection      - SQL injection detection
  p/xss                - XSS vulnerabilities
  p/command-injection  - Command injection
  p/path-traversal     - Path traversal attacks
  p/ssrf               - SSRF vulnerabilities
  p/insecure-transport - Insecure communications

Usage: semgrep --config <pack-name> <target>`;

    return { content: [{ type: "text", text: rulePacks }] };
  }
);

server.tool(
  "semgrep-supply-chain",
  "Scan dependencies for known vulnerabilities",
  {
    target: z.string().describe("Path to project directory"),
  },
  async ({ target }) => {
    const args = ["--config", "p/supply-chain", "--json", target];

    try {
      const output = await runSemgrep(args);
      return { content: [{ type: "text", text: output }] };
    } catch (error) {
      throw new Error(`Supply chain scan failed: ${error}`);
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Semgrep MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
