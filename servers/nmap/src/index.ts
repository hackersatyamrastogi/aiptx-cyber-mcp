#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { spawn } from "child_process";

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: mcp-nmap <path-to-nmap-binary>");
  console.error("Example: mcp-nmap /usr/bin/nmap");
  console.error("Example: mcp-nmap nmap");
  process.exit(1);
}

const nmapBinary = args[0];

const server = new McpServer({
  name: "nmap",
  version: "1.0.0",
});

server.tool(
  "nmap-scan",
  "Run Nmap network scan on the specified target. Nmap is a powerful network discovery and security auditing tool.",
  {
    target: z.string().describe("Target IP address, hostname, or CIDR range to scan"),
    args: z
      .array(z.string())
      .optional()
      .default(["-T4", "-F"])
      .describe(`Nmap arguments. Defaults to quick scan (-T4 -F).

Common options:
  -sS: TCP SYN scan (stealth)
  -sT: TCP connect scan
  -sU: UDP scan
  -sV: Version detection
  -sC: Script scan (default scripts)
  -O: OS detection
  -A: Aggressive scan (OS, version, script, traceroute)
  -p <ports>: Specify ports (e.g., -p 22,80,443 or -p 1-1000)
  -F: Fast scan (100 most common ports)
  -T<0-5>: Timing template (0=paranoid, 5=insane)
  --top-ports <n>: Scan top n ports
  -Pn: Skip host discovery
  -n: No DNS resolution
  -v: Verbose output
  -oX -: XML output to stdout`),
  },
  async ({ target, args: nmapArgs = ["-T4", "-F"] }) => {
    return new Promise((resolve, reject) => {
      const nmap = spawn(nmapBinary, [...nmapArgs, target]);
      let output = "";
      let errorOutput = "";

      nmap.stdout.on("data", (data) => {
        output += data.toString();
      });

      nmap.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });

      nmap.on("close", (code) => {
        if (code === 0) {
          resolve({
            content: [
              {
                type: "text",
                text: output || "Scan completed with no output",
              },
            ],
          });
        } else {
          reject(
            new Error(
              `Nmap exited with code ${code}${errorOutput ? `: ${errorOutput}` : ""}`
            )
          );
        }
      });

      nmap.on("error", (error) => {
        reject(new Error(`Failed to start nmap: ${error.message}`));
      });
    });
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Nmap MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
