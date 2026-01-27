#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { spawn } from "child_process";

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: mcp-kube-bench <path-to-kube-bench>");
  console.error("Example: mcp-kube-bench kube-bench");
  console.error("Example: mcp-kube-bench /usr/local/bin/kube-bench");
  process.exit(1);
}

const kubeBenchBinary = args[0];

const server = new McpServer({
  name: "kube-bench",
  version: "1.0.0",
});

function runKubeBench(cmdArgs: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(kubeBenchBinary, cmdArgs);

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
      reject(new Error(`Failed to start kube-bench: ${error.message}`));
    });
  });
}

server.tool(
  "kubebench-run",
  "Run CIS Kubernetes Benchmark checks",
  {
    target: z.enum(["master", "node", "etcd", "policies", "controlplane", "managedservices"])
      .optional()
      .describe("Specific target to check (default: auto-detect)"),
    benchmark: z.string().optional()
      .describe("Specific benchmark version (e.g., 'cis-1.6', 'gke-1.0')"),
    checkId: z.string().optional()
      .describe("Run specific check by ID (e.g., '1.1.1')"),
    format: z.enum(["json", "junit", "asff"]).optional()
      .describe("Output format (default: plain text)"),
  },
  async ({ target, benchmark, checkId, format }) => {
    const args: string[] = [];

    if (target) {
      args.push("run", "--targets", target);
    } else {
      args.push("run");
    }

    if (benchmark) {
      args.push("--benchmark", benchmark);
    }

    if (checkId) {
      args.push("--check", checkId);
    }

    if (format) {
      args.push("--json") // kube-bench uses --json not --format
    }

    try {
      const output = await runKubeBench(args);

      return {
        content: [{
          type: "text",
          text: `Kube-Bench CIS Benchmark Results:\nTarget: ${target || "auto-detect"}\n\n${output}`,
        }],
      };
    } catch (error) {
      throw new Error(`kube-bench run failed: ${error}`);
    }
  }
);

server.tool(
  "kubebench-master",
  "Run CIS benchmark checks for master/control plane node",
  {
    benchmark: z.string().optional()
      .describe("Specific benchmark version"),
  },
  async ({ benchmark }) => {
    const args = ["run", "--targets", "master"];

    if (benchmark) {
      args.push("--benchmark", benchmark);
    }

    try {
      const output = await runKubeBench(args);

      return {
        content: [{
          type: "text",
          text: `Master Node CIS Benchmark:\n\n${output}`,
        }],
      };
    } catch (error) {
      throw new Error(`kube-bench master check failed: ${error}`);
    }
  }
);

server.tool(
  "kubebench-node",
  "Run CIS benchmark checks for worker node",
  {
    benchmark: z.string().optional()
      .describe("Specific benchmark version"),
  },
  async ({ benchmark }) => {
    const args = ["run", "--targets", "node"];

    if (benchmark) {
      args.push("--benchmark", benchmark);
    }

    try {
      const output = await runKubeBench(args);

      return {
        content: [{
          type: "text",
          text: `Worker Node CIS Benchmark:\n\n${output}`,
        }],
      };
    } catch (error) {
      throw new Error(`kube-bench node check failed: ${error}`);
    }
  }
);

server.tool(
  "kubebench-etcd",
  "Run CIS benchmark checks for etcd",
  {},
  async () => {
    const args = ["run", "--targets", "etcd"];

    try {
      const output = await runKubeBench(args);

      return {
        content: [{
          type: "text",
          text: `etcd CIS Benchmark:\n\n${output}`,
        }],
      };
    } catch (error) {
      throw new Error(`kube-bench etcd check failed: ${error}`);
    }
  }
);

server.tool(
  "kubebench-policies",
  "Run CIS benchmark policy checks",
  {},
  async () => {
    const args = ["run", "--targets", "policies"];

    try {
      const output = await runKubeBench(args);

      return {
        content: [{
          type: "text",
          text: `Kubernetes Policies CIS Benchmark:\n\n${output}`,
        }],
      };
    } catch (error) {
      throw new Error(`kube-bench policies check failed: ${error}`);
    }
  }
);

server.tool(
  "kubebench-json",
  "Run benchmark and return JSON results",
  {
    target: z.enum(["master", "node", "etcd", "policies", "controlplane"])
      .optional()
      .describe("Specific target to check"),
  },
  async ({ target }) => {
    const args = ["run", "--json"];

    if (target) {
      args.push("--targets", target);
    }

    try {
      const output = await runKubeBench(args);

      // Parse and pretty-print JSON
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
      throw new Error(`kube-bench JSON output failed: ${error}`);
    }
  }
);

server.tool(
  "kubebench-managed",
  "Run benchmarks for managed Kubernetes services (EKS, GKE, AKS)",
  {
    provider: z.enum(["eks", "gke", "aks", "ack"])
      .describe("Cloud provider"),
  },
  async ({ provider }) => {
    const benchmarkMap: Record<string, string> = {
      eks: "eks-1.0",
      gke: "gke-1.0",
      aks: "aks-1.0",
      ack: "ack-1.0",
    };

    const args = ["run", "--benchmark", benchmarkMap[provider]];

    try {
      const output = await runKubeBench(args);

      return {
        content: [{
          type: "text",
          text: `${provider.toUpperCase()} Managed Kubernetes Benchmark:\n\n${output}`,
        }],
      };
    } catch (error) {
      throw new Error(`kube-bench ${provider} check failed: ${error}`);
    }
  }
);

server.tool(
  "kubebench-summary",
  "Get summary of CIS benchmark compliance",
  {},
  async () => {
    const args = ["run", "--json"];

    try {
      const output = await runKubeBench(args);

      try {
        const results = JSON.parse(output);

        // Calculate summary
        let pass = 0;
        let fail = 0;
        let warn = 0;
        let info = 0;

        for (const control of results.Controls || []) {
          for (const test of control.tests || []) {
            for (const result of test.results || []) {
              switch (result.status) {
                case "PASS": pass++; break;
                case "FAIL": fail++; break;
                case "WARN": warn++; break;
                case "INFO": info++; break;
              }
            }
          }
        }

        const total = pass + fail + warn + info;
        const passRate = total > 0 ? ((pass / total) * 100).toFixed(1) : 0;

        return {
          content: [{
            type: "text",
            text: `CIS Benchmark Summary:

Total Checks: ${total}
✅ PASS: ${pass} (${passRate}%)
❌ FAIL: ${fail}
⚠️  WARN: ${warn}
ℹ️  INFO: ${info}

Compliance Rate: ${passRate}%`,
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
      throw new Error(`kube-bench summary failed: ${error}`);
    }
  }
);

server.tool(
  "kubebench-checks",
  "List CIS benchmark check categories",
  {},
  async () => {
    const checks = `CIS Kubernetes Benchmark Check Categories:

1. CONTROL PLANE COMPONENTS
  1.1 Master Node Configuration Files
  1.2 API Server
  1.3 Controller Manager
  1.4 Scheduler

2. ETCD NODE CONFIGURATION
  2.1 etcd Configuration Files
  2.2 etcd Server
  2.3 etcd Client

3. CONTROL PLANE CONFIGURATION
  3.1 Authentication and Authorization
  3.2 Logging

4. WORKER NODE SECURITY
  4.1 Worker Node Configuration Files
  4.2 Kubelet

5. POLICIES
  5.1 RBAC and Service Accounts
  5.2 Pod Security Policies/Standards
  5.3 Network Policies
  5.4 Secrets Management
  5.5 Extensible Admission Control
  5.6 General Policies

BENCHMARK VERSIONS:
  cis-1.6      - CIS Kubernetes Benchmark v1.6.0
  cis-1.7      - CIS Kubernetes Benchmark v1.7.0
  cis-1.8      - CIS Kubernetes Benchmark v1.8.0
  eks-1.0      - CIS Amazon EKS Benchmark
  gke-1.0      - CIS Google GKE Benchmark
  aks-1.0      - CIS Azure AKS Benchmark
  rh-0.7       - Red Hat OpenShift

RESULT STATES:
  [PASS] - Check passed
  [FAIL] - Check failed (action required)
  [WARN] - Manual verification needed
  [INFO] - Informational only`;

    return {
      content: [{ type: "text", text: checks }],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("kube-bench MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
