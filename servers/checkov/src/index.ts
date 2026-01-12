#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { spawn } from "child_process";

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: mcp-checkov <path-to-checkov>");
  console.error("Example: mcp-checkov checkov");
  console.error("Example: mcp-checkov /usr/local/bin/checkov");
  process.exit(1);
}

const checkovBinary = args[0];

const server = new McpServer({
  name: "checkov",
  version: "1.0.0",
});

function runCheckov(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(checkovBinary, args);
    let output = "";
    let errorOutput = "";

    proc.stdout.on("data", (data) => {
      output += data.toString();
    });

    proc.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    proc.on("close", (code) => {
      // Checkov returns non-zero when findings exist
      if (output) {
        resolve(output);
      } else {
        resolve(errorOutput || `Checkov completed with code ${code}`);
      }
    });

    proc.on("error", (error) => {
      reject(new Error(`Failed to start checkov: ${error.message}`));
    });
  });
}

server.tool(
  "checkov-scan",
  "Scan infrastructure as code files for security misconfigurations",
  {
    path: z.string().describe("Path to IaC files or directory"),
    framework: z.enum([
      "terraform", "cloudformation", "kubernetes", "dockerfile",
      "helm", "arm", "bicep", "serverless", "ansible", "all"
    ]).optional().default("all")
      .describe("IaC framework to scan"),
    check: z.array(z.string()).optional()
      .describe("Specific check IDs to run (e.g., CKV_AWS_1)"),
    skipCheck: z.array(z.string()).optional()
      .describe("Check IDs to skip"),
    severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL", "all"]).optional()
      .default("all").describe("Minimum severity to report"),
  },
  async ({ path, framework, check, skipCheck, severity }) => {
    const args = ["-d", path, "-o", "json"];

    if (framework !== "all") {
      args.push("--framework", framework);
    }

    if (check && check.length > 0) {
      args.push("--check", check.join(","));
    }

    if (skipCheck && skipCheck.length > 0) {
      args.push("--skip-check", skipCheck.join(","));
    }

    if (severity !== "all") {
      args.push("--severity", severity);
    }

    try {
      const output = await runCheckov(args);

      // Parse JSON output
      try {
        const result = JSON.parse(output);

        const summary = {
          passed: result.summary?.passed || 0,
          failed: result.summary?.failed || 0,
          skipped: result.summary?.skipped || 0,
          parsing_errors: result.summary?.parsing_errors || 0,
          failed_checks: result.results?.failed_checks?.slice(0, 20).map((c: any) => ({
            check_id: c.check_id,
            check_name: c.check?.name,
            severity: c.severity,
            file: c.file_path,
            resource: c.resource,
            guideline: c.guideline,
          })),
        };

        return {
          content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
        };
      } catch {
        return { content: [{ type: "text", text: output }] };
      }
    } catch (error) {
      throw new Error(`Checkov scan failed: ${error}`);
    }
  }
);

server.tool(
  "checkov-terraform",
  "Scan Terraform files specifically",
  {
    path: z.string().describe("Path to Terraform files"),
    varFile: z.string().optional().describe("Path to terraform.tfvars file"),
    externalModulesDownload: z.boolean().optional().default(false)
      .describe("Download external modules for scanning"),
  },
  async ({ path, varFile, externalModulesDownload }) => {
    const args = ["-d", path, "--framework", "terraform", "-o", "json"];

    if (varFile) {
      args.push("--var-file", varFile);
    }

    if (externalModulesDownload) {
      args.push("--download-external-modules", "true");
    }

    try {
      const output = await runCheckov(args);

      return {
        content: [{ type: "text", text: output }],
      };
    } catch (error) {
      throw new Error(`Terraform scan failed: ${error}`);
    }
  }
);

server.tool(
  "checkov-kubernetes",
  "Scan Kubernetes manifests",
  {
    path: z.string().describe("Path to Kubernetes YAML files"),
    namespace: z.string().optional().describe("Kubernetes namespace to scan"),
  },
  async ({ path, namespace }) => {
    const args = ["-d", path, "--framework", "kubernetes", "-o", "json"];

    try {
      const output = await runCheckov(args);

      return {
        content: [{ type: "text", text: output }],
      };
    } catch (error) {
      throw new Error(`Kubernetes scan failed: ${error}`);
    }
  }
);

server.tool(
  "checkov-dockerfile",
  "Scan Dockerfiles for security issues",
  {
    path: z.string().describe("Path to Dockerfile or directory containing Dockerfiles"),
  },
  async ({ path }) => {
    const args = ["-f", path, "--framework", "dockerfile", "-o", "json"];

    try {
      const output = await runCheckov(args);

      return {
        content: [{ type: "text", text: output }],
      };
    } catch (error) {
      throw new Error(`Dockerfile scan failed: ${error}`);
    }
  }
);

server.tool(
  "checkov-repo",
  "Scan a git repository for IaC security issues",
  {
    repo: z.string().describe("Git repository URL"),
    branch: z.string().optional().default("main").describe("Branch to scan"),
  },
  async ({ repo, branch }) => {
    const args = ["--repo-url", repo, "--branch", branch, "-o", "json"];

    try {
      const output = await runCheckov(args);

      return {
        content: [{ type: "text", text: output }],
      };
    } catch (error) {
      throw new Error(`Repository scan failed: ${error}`);
    }
  }
);

server.tool(
  "checkov-list-checks",
  "List available security checks",
  {
    framework: z.enum([
      "terraform", "cloudformation", "kubernetes", "dockerfile",
      "helm", "arm", "bicep", "all"
    ]).optional().default("all")
      .describe("Framework to list checks for"),
  },
  async ({ framework }) => {
    const args = ["--list"];

    if (framework !== "all") {
      args.push("--framework", framework);
    }

    try {
      const output = await runCheckov(args);

      return {
        content: [{ type: "text", text: output }],
      };
    } catch (error) {
      throw new Error(`Failed to list checks: ${error}`);
    }
  }
);

server.tool(
  "checkov-categories",
  "Show check categories and common issues",
  {},
  async () => {
    const categories = `Checkov Security Check Categories:

AWS (CKV_AWS_*):
  - IAM policies and roles
  - S3 bucket configurations
  - Security groups and NACLs
  - Encryption settings
  - Logging and monitoring
  - VPC configurations

AZURE (CKV_AZURE_*):
  - Storage account security
  - Network security groups
  - Key Vault configurations
  - App Service security
  - SQL database settings

GCP (CKV_GCP_*):
  - IAM bindings
  - Storage bucket ACLs
  - Compute engine security
  - Cloud SQL settings
  - GKE cluster configurations

KUBERNETES (CKV_K8S_*):
  - Pod security contexts
  - Resource limits
  - Network policies
  - RBAC configurations
  - Service account settings

DOCKER (CKV_DOCKER_*):
  - Base image security
  - USER instructions
  - HEALTHCHECK presence
  - Secret handling
  - Package manager updates

COMMON CHECKS:
  CKV_AWS_1   - S3 Bucket has versioning enabled
  CKV_AWS_18  - S3 Bucket logging enabled
  CKV_AWS_19  - S3 Bucket encryption enabled
  CKV_AWS_21  - S3 Bucket public access blocked
  CKV_AWS_23  - Security group has description
  CKV_AWS_24  - Security group allows all traffic
  CKV_K8S_1   - Container CPU limits set
  CKV_K8S_9   - Readiness probe configured
  CKV_K8S_21  - Default namespace not used
  CKV_K8S_28  - Pod runs as non-root

Use --list to see all available checks.`;

    return {
      content: [{ type: "text", text: categories }],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Checkov MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
