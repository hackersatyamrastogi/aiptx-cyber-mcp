#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { spawn } from "child_process";

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: mcp-kubeaudit <path-to-kubeaudit>");
  console.error("Example: mcp-kubeaudit kubeaudit");
  console.error("Example: mcp-kubeaudit /usr/local/bin/kubeaudit");
  process.exit(1);
}

const kubeauditBinary = args[0];

const server = new McpServer({
  name: "kubeaudit",
  version: "1.0.0",
});

function runKubeaudit(cmdArgs: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(kubeauditBinary, cmdArgs);

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
      reject(new Error(`Failed to start kubeaudit: ${error.message}`));
    });
  });
}

server.tool(
  "kubeaudit-all",
  "Run all kubeaudit security checks on a cluster",
  {
    namespace: z.string().optional()
      .describe("Specific namespace to audit (default: all namespaces)"),
    format: z.enum(["pretty", "json", "logrus"]).optional().default("pretty")
      .describe("Output format"),
    kubeconfig: z.string().optional()
      .describe("Path to kubeconfig file"),
  },
  async ({ namespace, format, kubeconfig }) => {
    const args = ["all", "-f", format];

    if (namespace) {
      args.push("-n", namespace);
    } else {
      args.push("-A"); // All namespaces
    }

    if (kubeconfig) {
      args.push("--kubeconfig", kubeconfig);
    }

    try {
      const output = await runKubeaudit(args);

      return {
        content: [{
          type: "text",
          text: `Kubeaudit Full Security Scan:\nNamespace: ${namespace || "all"}\n\n${output}`,
        }],
      };
    } catch (error) {
      throw new Error(`kubeaudit all failed: ${error}`);
    }
  }
);

server.tool(
  "kubeaudit-privileged",
  "Check for privileged containers",
  {
    namespace: z.string().optional()
      .describe("Namespace to audit"),
    format: z.enum(["pretty", "json"]).optional().default("pretty")
      .describe("Output format"),
  },
  async ({ namespace, format }) => {
    const args = ["privileged", "-f", format];

    if (namespace) {
      args.push("-n", namespace);
    } else {
      args.push("-A");
    }

    try {
      const output = await runKubeaudit(args);

      return {
        content: [{
          type: "text",
          text: `Privileged Container Check:\n\n${output}`,
        }],
      };
    } catch (error) {
      throw new Error(`kubeaudit privileged check failed: ${error}`);
    }
  }
);

server.tool(
  "kubeaudit-rootfs",
  "Check for containers without read-only root filesystem",
  {
    namespace: z.string().optional()
      .describe("Namespace to audit"),
  },
  async ({ namespace }) => {
    const args = ["rootfs", "-f", "pretty"];

    if (namespace) {
      args.push("-n", namespace);
    } else {
      args.push("-A");
    }

    try {
      const output = await runKubeaudit(args);

      return {
        content: [{
          type: "text",
          text: `Read-Only Root Filesystem Check:\n\n${output}`,
        }],
      };
    } catch (error) {
      throw new Error(`kubeaudit rootfs check failed: ${error}`);
    }
  }
);

server.tool(
  "kubeaudit-capabilities",
  "Check for containers with dangerous capabilities",
  {
    namespace: z.string().optional()
      .describe("Namespace to audit"),
  },
  async ({ namespace }) => {
    const args = ["capabilities", "-f", "pretty"];

    if (namespace) {
      args.push("-n", namespace);
    } else {
      args.push("-A");
    }

    try {
      const output = await runKubeaudit(args);

      return {
        content: [{
          type: "text",
          text: `Capabilities Check:\n\n${output}`,
        }],
      };
    } catch (error) {
      throw new Error(`kubeaudit capabilities check failed: ${error}`);
    }
  }
);

server.tool(
  "kubeaudit-limits",
  "Check for containers without resource limits",
  {
    namespace: z.string().optional()
      .describe("Namespace to audit"),
  },
  async ({ namespace }) => {
    const args = ["limits", "-f", "pretty"];

    if (namespace) {
      args.push("-n", namespace);
    } else {
      args.push("-A");
    }

    try {
      const output = await runKubeaudit(args);

      return {
        content: [{
          type: "text",
          text: `Resource Limits Check:\n\n${output}`,
        }],
      };
    } catch (error) {
      throw new Error(`kubeaudit limits check failed: ${error}`);
    }
  }
);

server.tool(
  "kubeaudit-nonroot",
  "Check for containers running as root",
  {
    namespace: z.string().optional()
      .describe("Namespace to audit"),
  },
  async ({ namespace }) => {
    const args = ["nonroot", "-f", "pretty"];

    if (namespace) {
      args.push("-n", namespace);
    } else {
      args.push("-A");
    }

    try {
      const output = await runKubeaudit(args);

      return {
        content: [{
          type: "text",
          text: `Non-Root User Check:\n\n${output}`,
        }],
      };
    } catch (error) {
      throw new Error(`kubeaudit nonroot check failed: ${error}`);
    }
  }
);

server.tool(
  "kubeaudit-hostns",
  "Check for containers with host namespace access",
  {
    namespace: z.string().optional()
      .describe("Namespace to audit"),
  },
  async ({ namespace }) => {
    const args = ["hostns", "-f", "pretty"];

    if (namespace) {
      args.push("-n", namespace);
    } else {
      args.push("-A");
    }

    try {
      const output = await runKubeaudit(args);

      return {
        content: [{
          type: "text",
          text: `Host Namespace Check:\n\n${output}`,
        }],
      };
    } catch (error) {
      throw new Error(`kubeaudit hostns check failed: ${error}`);
    }
  }
);

server.tool(
  "kubeaudit-image",
  "Check for image security issues (tags, registry)",
  {
    namespace: z.string().optional()
      .describe("Namespace to audit"),
  },
  async ({ namespace }) => {
    const args = ["image", "-f", "pretty"];

    if (namespace) {
      args.push("-n", namespace);
    } else {
      args.push("-A");
    }

    try {
      const output = await runKubeaudit(args);

      return {
        content: [{
          type: "text",
          text: `Image Security Check:\n\n${output}`,
        }],
      };
    } catch (error) {
      throw new Error(`kubeaudit image check failed: ${error}`);
    }
  }
);

server.tool(
  "kubeaudit-manifest",
  "Audit Kubernetes manifest files before deployment",
  {
    manifestPath: z.string().describe("Path to YAML manifest file or directory"),
    format: z.enum(["pretty", "json"]).optional().default("pretty")
      .describe("Output format"),
  },
  async ({ manifestPath, format }) => {
    const args = ["all", "-f", format, "--manifest", manifestPath];

    try {
      const output = await runKubeaudit(args);

      return {
        content: [{
          type: "text",
          text: `Manifest Audit:\nFile: ${manifestPath}\n\n${output}`,
        }],
      };
    } catch (error) {
      throw new Error(`kubeaudit manifest check failed: ${error}`);
    }
  }
);

server.tool(
  "kubeaudit-checks",
  "List all available kubeaudit security checks",
  {},
  async () => {
    const checks = `Kubeaudit Security Checks:

CONTAINER SECURITY:
  privileged      - Containers running in privileged mode
  rootfs          - Containers without read-only root filesystem
  nonroot         - Containers running as root user
  runAsNonRoot    - Missing runAsNonRoot security context

CAPABILITIES:
  capabilities    - Containers with dangerous capabilities
  allowPrivilegeEscalation - Privilege escalation allowed

RESOURCE LIMITS:
  limits          - Containers without CPU/memory limits

HOST ISOLATION:
  hostns          - Containers with hostPID, hostIPC, or hostNetwork
  hostpath        - Containers with host path mounts

IMAGE SECURITY:
  image           - Missing image tags (using :latest)
  imagePullPolicy - Not using Always pull policy

SERVICE ACCOUNTS:
  asat            - Auto-mounted service account tokens

NETWORK:
  netpols         - Missing network policies

MISCELLANEOUS:
  seccomp         - Missing Seccomp profiles
  apparmor        - Missing AppArmor profiles

SEVERITY LEVELS:
  error   - High severity, immediate action required
  warning - Medium severity, should be addressed
  info    - Low severity, best practice recommendations

Usage Examples:
  kubeaudit all -n production              # Audit production namespace
  kubeaudit privileged -A                  # Check all privileged pods
  kubeaudit all --manifest ./deployment.yaml  # Audit manifest file`;

    return {
      content: [{ type: "text", text: checks }],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("kubeaudit MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
