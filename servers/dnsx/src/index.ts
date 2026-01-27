#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { spawn } from "child_process";

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: mcp-dnsx <path-to-dnsx-binary>");
  console.error("Example: mcp-dnsx dnsx");
  console.error("Example: mcp-dnsx /usr/local/bin/dnsx");
  process.exit(1);
}

const dnsxBinary = args[0];

const server = new McpServer({
  name: "dnsx",
  version: "1.0.0",
});

function runDnsx(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(dnsxBinary, args);
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
        resolve(output);
      } else {
        reject(new Error(errorOutput || `Process exited with code ${code}`));
      }
    });

    proc.on("error", (error) => {
      reject(new Error(`Failed to start dnsx: ${error.message}`));
    });
  });
}

server.tool(
  "dnsx-resolve",
  "Resolve DNS records for domains/subdomains with multiple DNS queries",
  {
    hosts: z.array(z.string()).describe("List of hosts/domains to resolve"),
    recordTypes: z.array(z.enum(["a", "aaaa", "cname", "mx", "ns", "txt", "soa", "ptr", "axfr"]))
      .optional()
      .describe("DNS record types to query (default: A)"),
    resolver: z.string().optional()
      .describe("Custom DNS resolver (e.g., 8.8.8.8)"),
    wordlist: z.string().optional()
      .describe("Path to wordlist for subdomain bruteforce"),
    threads: z.number().optional().default(100)
      .describe("Number of concurrent threads"),
    retries: z.number().optional().default(2)
      .describe("Number of retries for failed queries"),
  },
  async ({ hosts, recordTypes, resolver, wordlist, threads, retries }) => {
    const args = ["-silent"];

    // Add hosts via stdin approach - we'll use -l with temp or direct list
    args.push("-l", "-"); // Read from stdin

    if (recordTypes && recordTypes.length > 0) {
      recordTypes.forEach((rt) => args.push(`-${rt}`));
    } else {
      args.push("-a"); // Default to A records
    }

    if (resolver) {
      args.push("-r", resolver);
    }

    if (wordlist) {
      args.push("-w", wordlist);
    }

    args.push("-t", threads.toString());
    args.push("-retry", retries.toString());

    try {
      const proc = spawn(dnsxBinary, args);
      let output = "";
      let errorOutput = "";

      proc.stdin.write(hosts.join("\n"));
      proc.stdin.end();

      proc.stdout.on("data", (data) => {
        output += data.toString();
      });

      proc.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });

      return new Promise((resolve, reject) => {
        proc.on("close", (code) => {
          if (code === 0 || output) {
            const results = output.trim().split("\n").filter(Boolean);
            resolve({
              content: [{
                type: "text",
                text: `DNS Resolution Results (${results.length} records):\n\n${results.join("\n")}`,
              }],
            });
          } else {
            reject(new Error(errorOutput || `dnsx exited with code ${code}`));
          }
        });

        proc.on("error", (error) => {
          reject(new Error(`Failed to start dnsx: ${error.message}`));
        });
      });
    } catch (error) {
      throw new Error(`dnsx failed: ${error}`);
    }
  }
);

server.tool(
  "dnsx-bruteforce",
  "DNS bruteforce subdomains using wordlist",
  {
    domain: z.string().describe("Target domain for subdomain bruteforce"),
    wordlist: z.string().describe("Path to subdomain wordlist"),
    resolver: z.string().optional()
      .describe("Custom DNS resolver"),
    threads: z.number().optional().default(100)
      .describe("Number of concurrent threads"),
    wildcard: z.boolean().optional().default(true)
      .describe("Enable wildcard filtering"),
  },
  async ({ domain, wordlist, resolver, threads, wildcard }) => {
    const args = ["-d", domain, "-w", wordlist, "-silent", "-a"];

    if (resolver) {
      args.push("-r", resolver);
    }

    args.push("-t", threads.toString());

    if (wildcard) {
      args.push("-wd"); // Wildcard detection
    }

    try {
      const output = await runDnsx(args);
      const subdomains = output.trim().split("\n").filter(Boolean);

      return {
        content: [{
          type: "text",
          text: `Found ${subdomains.length} subdomains for ${domain}:\n\n${subdomains.join("\n")}`,
        }],
      };
    } catch (error) {
      throw new Error(`dnsx bruteforce failed: ${error}`);
    }
  }
);

server.tool(
  "dnsx-reverse",
  "Perform reverse DNS lookups on IP addresses",
  {
    ips: z.array(z.string()).describe("List of IP addresses for reverse DNS lookup"),
    threads: z.number().optional().default(100)
      .describe("Number of concurrent threads"),
  },
  async ({ ips, threads }) => {
    const args = ["-silent", "-ptr", "-resp", "-t", threads.toString()];

    try {
      const proc = spawn(dnsxBinary, args);
      let output = "";
      let errorOutput = "";

      proc.stdin.write(ips.join("\n"));
      proc.stdin.end();

      proc.stdout.on("data", (data) => {
        output += data.toString();
      });

      proc.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });

      return new Promise((resolve, reject) => {
        proc.on("close", (code) => {
          if (code === 0 || output) {
            const results = output.trim().split("\n").filter(Boolean);
            resolve({
              content: [{
                type: "text",
                text: `Reverse DNS Results (${results.length} records):\n\n${results.join("\n")}`,
              }],
            });
          } else {
            reject(new Error(errorOutput || `dnsx exited with code ${code}`));
          }
        });

        proc.on("error", (error) => {
          reject(new Error(`Failed to start dnsx: ${error.message}`));
        });
      });
    } catch (error) {
      throw new Error(`dnsx reverse lookup failed: ${error}`);
    }
  }
);

server.tool(
  "dnsx-json",
  "Resolve DNS with detailed JSON output",
  {
    hosts: z.array(z.string()).describe("List of hosts to resolve"),
    recordTypes: z.array(z.enum(["a", "aaaa", "cname", "mx", "ns", "txt", "soa"]))
      .optional()
      .describe("DNS record types to query"),
  },
  async ({ hosts, recordTypes }) => {
    const args = ["-silent", "-json", "-resp"];

    if (recordTypes && recordTypes.length > 0) {
      recordTypes.forEach((rt) => args.push(`-${rt}`));
    } else {
      args.push("-a");
    }

    try {
      const proc = spawn(dnsxBinary, args);
      let output = "";

      proc.stdin.write(hosts.join("\n"));
      proc.stdin.end();

      proc.stdout.on("data", (data) => {
        output += data.toString();
      });

      return new Promise((resolve, reject) => {
        proc.on("close", (code) => {
          if (code === 0 || output) {
            const lines = output.trim().split("\n").filter(Boolean);
            const results = lines.map((line) => {
              try {
                return JSON.parse(line);
              } catch {
                return { raw: line };
              }
            });

            resolve({
              content: [{
                type: "text",
                text: JSON.stringify(results, null, 2),
              }],
            });
          } else {
            reject(new Error(`dnsx exited with code ${code}`));
          }
        });

        proc.on("error", (error) => {
          reject(new Error(`Failed to start dnsx: ${error.message}`));
        });
      });
    } catch (error) {
      throw new Error(`dnsx JSON resolve failed: ${error}`);
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("dnsx MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
