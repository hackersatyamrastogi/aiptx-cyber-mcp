#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { spawn } from "child_process";

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: mcp-prowler <path-to-prowler>");
  console.error("Example: mcp-prowler prowler");
  console.error("Example: mcp-prowler /usr/local/bin/prowler");
  process.exit(1);
}

const prowlerBinary = args[0];

const server = new McpServer({
  name: "prowler",
  version: "1.0.0",
});

function runProwler(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(prowlerBinary, args);
    let output = "";
    let errorOutput = "";

    proc.stdout.on("data", (data) => {
      output += data.toString();
    });

    proc.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    proc.on("close", (code) => {
      if (code === 0 || output) {
        resolve(output || errorOutput);
      } else {
        reject(new Error(errorOutput || `Prowler exited with code ${code}`));
      }
    });

    proc.on("error", (error) => {
      reject(new Error(`Failed to start prowler: ${error.message}`));
    });
  });
}

server.tool(
  "prowler-aws",
  "Run AWS security assessment with Prowler",
  {
    profile: z.string().optional().describe("AWS profile to use"),
    region: z.string().optional().describe("AWS region (default: all regions)"),
    services: z.array(z.string()).optional()
      .describe("Specific AWS services to audit (e.g., ec2, s3, iam)"),
    severity: z.enum(["critical", "high", "medium", "low", "informational", "all"]).optional()
      .default("all").describe("Minimum severity to report"),
    compliance: z.enum(["cis_1.4", "cis_1.5", "cis_2.0", "aws_foundational", "pci_dss", "hipaa", "gdpr", "soc2"]).optional()
      .describe("Compliance framework to use"),
  },
  async ({ profile, region, services, severity, compliance }) => {
    const args = ["aws", "-M", "json"];

    if (profile) {
      args.push("-p", profile);
    }

    if (region) {
      args.push("-f", region);
    }

    if (services && services.length > 0) {
      args.push("-s", services.join(","));
    }

    if (severity !== "all") {
      args.push("--severity", severity);
    }

    if (compliance) {
      args.push("-c", compliance);
    }

    try {
      const output = await runProwler(args);

      // Try to parse JSON output
      try {
        const results = output.trim().split("\n")
          .filter(line => line.startsWith("{"))
          .map(line => JSON.parse(line));

        const summary = {
          total: results.length,
          by_severity: results.reduce((acc: any, r: any) => {
            acc[r.Severity] = (acc[r.Severity] || 0) + 1;
            return acc;
          }, {}),
          by_status: results.reduce((acc: any, r: any) => {
            acc[r.Status] = (acc[r.Status] || 0) + 1;
            return acc;
          }, {}),
          critical_findings: results.filter((r: any) =>
            r.Severity === "critical" && r.Status === "FAIL"
          ).slice(0, 10).map((r: any) => ({
            check: r.CheckID,
            service: r.ServiceName,
            resource: r.ResourceId,
            description: r.StatusExtended,
          })),
        };

        return {
          content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
        };
      } catch {
        return { content: [{ type: "text", text: output }] };
      }
    } catch (error) {
      throw new Error(`AWS assessment failed: ${error}`);
    }
  }
);

server.tool(
  "prowler-azure",
  "Run Azure security assessment with Prowler",
  {
    subscriptionId: z.string().optional().describe("Azure subscription ID"),
    services: z.array(z.string()).optional()
      .describe("Specific Azure services to audit"),
    severity: z.enum(["critical", "high", "medium", "low", "informational", "all"]).optional()
      .default("all").describe("Minimum severity to report"),
  },
  async ({ subscriptionId, services, severity }) => {
    const args = ["azure", "-M", "json"];

    if (subscriptionId) {
      args.push("--subscription-ids", subscriptionId);
    }

    if (services && services.length > 0) {
      args.push("-s", services.join(","));
    }

    if (severity !== "all") {
      args.push("--severity", severity);
    }

    try {
      const output = await runProwler(args);

      return {
        content: [{ type: "text", text: output }],
      };
    } catch (error) {
      throw new Error(`Azure assessment failed: ${error}`);
    }
  }
);

server.tool(
  "prowler-gcp",
  "Run GCP security assessment with Prowler",
  {
    projectId: z.string().optional().describe("GCP project ID"),
    services: z.array(z.string()).optional()
      .describe("Specific GCP services to audit"),
    severity: z.enum(["critical", "high", "medium", "low", "informational", "all"]).optional()
      .default("all").describe("Minimum severity to report"),
  },
  async ({ projectId, services, severity }) => {
    const args = ["gcp", "-M", "json"];

    if (projectId) {
      args.push("--project-ids", projectId);
    }

    if (services && services.length > 0) {
      args.push("-s", services.join(","));
    }

    if (severity !== "all") {
      args.push("--severity", severity);
    }

    try {
      const output = await runProwler(args);

      return {
        content: [{ type: "text", text: output }],
      };
    } catch (error) {
      throw new Error(`GCP assessment failed: ${error}`);
    }
  }
);

server.tool(
  "prowler-list-checks",
  "List available security checks",
  {
    provider: z.enum(["aws", "azure", "gcp"]).describe("Cloud provider"),
    service: z.string().optional().describe("Filter by service name"),
  },
  async ({ provider, service }) => {
    const args = [provider, "--list-checks"];

    if (service) {
      args.push("-s", service);
    }

    try {
      const output = await runProwler(args);

      return {
        content: [{ type: "text", text: output }],
      };
    } catch (error) {
      throw new Error(`Failed to list checks: ${error}`);
    }
  }
);

server.tool(
  "prowler-compliance",
  "List available compliance frameworks",
  {
    provider: z.enum(["aws", "azure", "gcp"]).describe("Cloud provider"),
  },
  async ({ provider }) => {
    const args = [provider, "--list-compliance"];

    try {
      const output = await runProwler(args);

      return {
        content: [{ type: "text", text: output }],
      };
    } catch (error) {
      throw new Error(`Failed to list compliance frameworks: ${error}`);
    }
  }
);

server.tool(
  "prowler-services",
  "List available services for auditing",
  {
    provider: z.enum(["aws", "azure", "gcp"]).describe("Cloud provider"),
  },
  async ({ provider }) => {
    const args = [provider, "--list-services"];

    try {
      const output = await runProwler(args);

      return {
        content: [{ type: "text", text: output }],
      };
    } catch (error) {
      throw new Error(`Failed to list services: ${error}`);
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Prowler MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
