#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { spawn } from "child_process";

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: mcp-kube-hunter <path-to-kube-hunter>");
  console.error("Example: mcp-kube-hunter kube-hunter");
  console.error("Example: mcp-kube-hunter /usr/local/bin/kube-hunter");
  console.error("Example: mcp-kube-hunter 'python -m kube_hunter'");
  process.exit(1);
}

const kubeHunterBinary = args[0];

const server = new McpServer({
  name: "kube-hunter",
  version: "1.0.0",
});

function runKubeHunter(cmdArgs: string[], timeout: number = 600000): Promise<string> {
  return new Promise((resolve, reject) => {
    // Handle both direct binary and python module invocation
    let cmd: string;
    let spawnArgs: string[];

    if (kubeHunterBinary.includes("python")) {
      const parts = kubeHunterBinary.split(" ");
      cmd = parts[0];
      spawnArgs = [...parts.slice(1), ...cmdArgs];
    } else {
      cmd = kubeHunterBinary;
      spawnArgs = cmdArgs;
    }

    const proc = spawn(cmd, spawnArgs, { timeout });

    let output = "";
    let errorOutput = "";

    proc.stdout.on("data", (data) => {
      output += data.toString();
    });

    proc.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    proc.on("close", (code) => {
      resolve(output + errorOutput);
    });

    proc.on("error", (error) => {
      reject(new Error(`Failed to start kube-hunter: ${error.message}`));
    });
  });
}

server.tool(
  "kubehunter-remote",
  "Hunt for security weaknesses in remote Kubernetes clusters",
  {
    target: z.string().describe("Remote target IP, hostname, or CIDR range"),
    interface: z.boolean().optional().default(false)
      .describe("Enable network interface scanning"),
    quick: z.boolean().optional().default(false)
      .describe("Quick scan (skip some checks)"),
    cidr: z.string().optional()
      .describe("CIDR range to scan (e.g., '10.0.0.0/24')"),
    active: z.boolean().optional().default(false)
      .describe("Enable active hunting (may affect cluster)"),
  },
  async ({ target, interface: iface, quick, cidr, active }) => {
    const args = ["--remote", target];

    if (iface) args.push("--interface");
    if (quick) args.push("--quick");
    if (active) args.push("--active");
    if (cidr) args.push("--cidr", cidr);

    args.push("--report", "plain");

    try {
      const output = await runKubeHunter(args);

      return {
        content: [{
          type: "text",
          text: `Kube-Hunter Remote Scan Results:\nTarget: ${target}\nActive Mode: ${active}\n\n${output}`,
        }],
      };
    } catch (error) {
      throw new Error(`kube-hunter remote scan failed: ${error}`);
    }
  }
);

server.tool(
  "kubehunter-pod",
  "Run kube-hunter from within a pod (internal scan)",
  {
    active: z.boolean().optional().default(false)
      .describe("Enable active hunting"),
    quick: z.boolean().optional().default(false)
      .describe("Quick scan mode"),
  },
  async ({ active, quick }) => {
    const args = ["--pod"];

    if (active) args.push("--active");
    if (quick) args.push("--quick");
    args.push("--report", "plain");

    try {
      const output = await runKubeHunter(args);

      return {
        content: [{
          type: "text",
          text: `Kube-Hunter Internal Pod Scan:\n\n${output}`,
        }],
      };
    } catch (error) {
      throw new Error(`kube-hunter pod scan failed: ${error}`);
    }
  }
);

server.tool(
  "kubehunter-json",
  "Run scan and return results in JSON format",
  {
    target: z.string().optional().describe("Remote target (omit for internal scan)"),
    active: z.boolean().optional().default(false)
      .describe("Enable active hunting"),
  },
  async ({ target, active }) => {
    const args: string[] = [];

    if (target) {
      args.push("--remote", target);
    } else {
      args.push("--pod");
    }

    if (active) args.push("--active");
    args.push("--report", "json");

    try {
      const output = await runKubeHunter(args);

      // Try to parse and pretty-print JSON
      try {
        const json = JSON.parse(output);
        return {
          content: [{
            type: "text",
            text: JSON.stringify(json, null, 2),
          }],
        };
      } catch {
        return {
          content: [{
            type: "text",
            text: output,
          }],
        };
      }
    } catch (error) {
      throw new Error(`kube-hunter JSON scan failed: ${error}`);
    }
  }
);

server.tool(
  "kubehunter-network",
  "Scan internal network for Kubernetes API servers",
  {
    cidr: z.string().describe("CIDR range to scan (e.g., '192.168.1.0/24')"),
    active: z.boolean().optional().default(false)
      .describe("Enable active hunting"),
  },
  async ({ cidr, active }) => {
    const args = ["--cidr", cidr];

    if (active) args.push("--active");
    args.push("--report", "plain");

    try {
      const output = await runKubeHunter(args, 900000); // 15 min for network scans

      return {
        content: [{
          type: "text",
          text: `Kube-Hunter Network Scan:\nCIDR: ${cidr}\n\n${output}`,
        }],
      };
    } catch (error) {
      throw new Error(`kube-hunter network scan failed: ${error}`);
    }
  }
);

server.tool(
  "kubehunter-vulnerabilities",
  "List known Kubernetes vulnerabilities that kube-hunter checks",
  {},
  async () => {
    const vulns = `Kube-Hunter Vulnerability Checks:

DISCOVERY:
  - API Server Detection
  - Kubelet API Detection
  - etcd Detection
  - Dashboard Detection
  - Proxy Detection

INFORMATION DISCLOSURE:
  - Anonymous API Access
  - Exposed Sensitive Endpoints
  - Instance Metadata Access
  - Server Version Disclosure
  - Exposed Pods Information
  - Service Account Token Exposure

REMOTE CODE EXECUTION:
  - Kubelet RCE via /exec endpoint
  - Privileged Container Escape
  - Host Path Mount Exploitation
  - CVE-2018-1002105 (API Server)
  - CVE-2019-11247 (API Server)
  - CVE-2019-11249 (kubectl cp)

ACCESS CONTROL:
  - Anonymous Authentication Enabled
  - Insecure Port Enabled
  - No Network Policies
  - Default Service Account Used
  - Privileged Pods Allowed
  - hostPID/hostNetwork Allowed

CREDENTIAL EXPOSURE:
  - Exposed Kubeconfig
  - Service Account Tokens
  - Secrets in Environment Variables
  - Cloud Provider Credentials

DENIAL OF SERVICE:
  - Resource Exhaustion
  - etcd DoS

SCAN MODES:
  - Passive: Safe information gathering (default)
  - Active: Attempts exploitation (--active flag)

Best Practices:
  - Run from inside a pod for internal threats
  - Run remotely for external attack surface
  - Use --active only in test environments`;

    return {
      content: [{ type: "text", text: vulns }],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("kube-hunter MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
