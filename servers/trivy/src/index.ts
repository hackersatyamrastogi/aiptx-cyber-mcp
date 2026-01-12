#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { spawn } from "child_process";

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: mcp-trivy <path-to-trivy-binary>");
  console.error("Example: mcp-trivy trivy");
  console.error("Example: mcp-trivy /usr/local/bin/trivy");
  process.exit(1);
}

const trivyBinary = args[0];

const server = new McpServer({
  name: "trivy",
  version: "1.0.0",
});

function runTrivy(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(trivyBinary, args);
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
        reject(new Error(errorOutput || `Trivy exited with code ${code}`));
      }
    });

    proc.on("error", (error) => {
      reject(new Error(`Failed to start trivy: ${error.message}`));
    });
  });
}

server.tool(
  "trivy-image",
  "Scan a container image for vulnerabilities",
  {
    image: z.string().describe("Container image to scan (e.g., nginx:latest, alpine:3.14)"),
    severity: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW", "UNKNOWN", "ALL"]).optional().default("ALL")
      .describe("Minimum severity to report"),
    ignoreUnfixed: z.boolean().optional().default(false)
      .describe("Ignore vulnerabilities without fixes"),
  },
  async ({ image, severity, ignoreUnfixed }) => {
    const args = ["image", "--format", "json", image];

    if (severity !== "ALL") {
      args.push("--severity", severity);
    }

    if (ignoreUnfixed) {
      args.push("--ignore-unfixed");
    }

    try {
      const output = await runTrivy(args);
      const result = JSON.parse(output);

      const summary = {
        image: image,
        results: result.Results?.map((r: any) => ({
          target: r.Target,
          type: r.Type,
          vulnerabilities: r.Vulnerabilities?.length || 0,
          critical: r.Vulnerabilities?.filter((v: any) => v.Severity === "CRITICAL").length || 0,
          high: r.Vulnerabilities?.filter((v: any) => v.Severity === "HIGH").length || 0,
          medium: r.Vulnerabilities?.filter((v: any) => v.Severity === "MEDIUM").length || 0,
          low: r.Vulnerabilities?.filter((v: any) => v.Severity === "LOW").length || 0,
          top_vulns: r.Vulnerabilities?.slice(0, 10).map((v: any) => ({
            id: v.VulnerabilityID,
            pkg: v.PkgName,
            severity: v.Severity,
            title: v.Title,
            fixed_version: v.FixedVersion,
          })),
        })),
      };

      return {
        content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
      };
    } catch (error) {
      throw new Error(`Image scan failed: ${error}`);
    }
  }
);

server.tool(
  "trivy-fs",
  "Scan a filesystem/directory for vulnerabilities and misconfigurations",
  {
    path: z.string().describe("Path to directory to scan"),
    scanners: z.array(z.enum(["vuln", "misconfig", "secret", "license"])).optional()
      .default(["vuln", "misconfig", "secret"])
      .describe("Types of issues to scan for"),
    severity: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW", "UNKNOWN", "ALL"]).optional().default("ALL")
      .describe("Minimum severity to report"),
  },
  async ({ path, scanners, severity }) => {
    const args = ["fs", "--format", "json", "--scanners", scanners.join(","), path];

    if (severity !== "ALL") {
      args.push("--severity", severity);
    }

    try {
      const output = await runTrivy(args);
      const result = JSON.parse(output);

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      throw new Error(`Filesystem scan failed: ${error}`);
    }
  }
);

server.tool(
  "trivy-repo",
  "Scan a git repository for vulnerabilities",
  {
    repo: z.string().describe("Git repository URL to scan"),
    branch: z.string().optional().default("main")
      .describe("Branch to scan"),
  },
  async ({ repo, branch }) => {
    const args = ["repo", "--format", "json", "--branch", branch, repo];

    try {
      const output = await runTrivy(args);
      const result = JSON.parse(output);

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      throw new Error(`Repository scan failed: ${error}`);
    }
  }
);

server.tool(
  "trivy-config",
  "Scan IaC files for misconfigurations (Terraform, CloudFormation, Kubernetes, etc.)",
  {
    path: z.string().describe("Path to IaC files"),
    severity: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW", "UNKNOWN", "ALL"]).optional().default("ALL")
      .describe("Minimum severity to report"),
  },
  async ({ path, severity }) => {
    const args = ["config", "--format", "json", path];

    if (severity !== "ALL") {
      args.push("--severity", severity);
    }

    try {
      const output = await runTrivy(args);
      const result = JSON.parse(output);

      const summary = {
        path: path,
        results: result.Results?.map((r: any) => ({
          target: r.Target,
          type: r.Type,
          misconfigurations: r.Misconfigurations?.length || 0,
          issues: r.Misconfigurations?.map((m: any) => ({
            id: m.ID,
            title: m.Title,
            severity: m.Severity,
            description: m.Description?.substring(0, 200),
            resolution: m.Resolution,
          })),
        })),
      };

      return {
        content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
      };
    } catch (error) {
      throw new Error(`Config scan failed: ${error}`);
    }
  }
);

server.tool(
  "trivy-sbom",
  "Generate a Software Bill of Materials (SBOM)",
  {
    target: z.string().describe("Image or directory to generate SBOM for"),
    format: z.enum(["cyclonedx", "spdx", "spdx-json"]).optional().default("cyclonedx")
      .describe("SBOM format"),
  },
  async ({ target, format }) => {
    const args = ["image", "--format", format, target];

    try {
      const output = await runTrivy(args);

      return {
        content: [{ type: "text", text: output }],
      };
    } catch (error) {
      throw new Error(`SBOM generation failed: ${error}`);
    }
  }
);

server.tool(
  "trivy-k8s",
  "Scan Kubernetes cluster for vulnerabilities and misconfigurations",
  {
    context: z.string().optional().describe("Kubernetes context to use"),
    namespace: z.string().optional().describe("Namespace to scan (default: all)"),
    scanners: z.array(z.enum(["vuln", "misconfig", "secret"])).optional()
      .default(["vuln", "misconfig"])
      .describe("Types of issues to scan for"),
  },
  async ({ context, namespace, scanners }) => {
    const args = ["k8s", "--format", "json", "--scanners", scanners.join(",")];

    if (context) {
      args.push("--context", context);
    }

    if (namespace) {
      args.push("--namespace", namespace);
    } else {
      args.push("--all-namespaces");
    }

    args.push("cluster");

    try {
      const output = await runTrivy(args);
      const result = JSON.parse(output);

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      throw new Error(`Kubernetes scan failed: ${error}`);
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Trivy MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
