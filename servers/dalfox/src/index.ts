#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { spawn } from "child_process";

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: mcp-dalfox <path-to-dalfox-binary>");
  console.error("Example: mcp-dalfox dalfox");
  console.error("Example: mcp-dalfox /usr/local/bin/dalfox");
  process.exit(1);
}

const dalfoxBinary = args[0];

const server = new McpServer({
  name: "dalfox",
  version: "1.0.0",
});

function runDalfox(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(dalfoxBinary, args);
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
        reject(new Error(errorOutput || `Dalfox exited with code ${code}`));
      }
    });

    proc.on("error", (error) => {
      reject(new Error(`Failed to start dalfox: ${error.message}`));
    });
  });
}

server.tool(
  "dalfox-url",
  "Scan a single URL for XSS vulnerabilities",
  {
    url: z.string().describe("Target URL with parameters (e.g., https://example.com/search?q=test)"),
    blind: z.string().optional()
      .describe("Blind XSS callback URL (e.g., your-burp-collaborator.net)"),
    waf: z.boolean().optional().default(false)
      .describe("Enable WAF evasion techniques"),
    deep: z.boolean().optional().default(false)
      .describe("Enable deep parameter analysis"),
    timeout: z.number().optional().default(10)
      .describe("Request timeout in seconds"),
  },
  async ({ url, blind, waf, deep, timeout }) => {
    const args = ["url", url, "--format", "json", "--timeout", timeout.toString()];

    if (blind) {
      args.push("--blind", blind);
    }

    if (waf) {
      args.push("--waf-evasion");
    }

    if (deep) {
      args.push("--deep-domxss");
    }

    try {
      const output = await runDalfox(args);

      if (!output.trim()) {
        return {
          content: [{ type: "text", text: "No XSS vulnerabilities found." }],
        };
      }

      try {
        const results = output.trim().split("\n").map(line => {
          try {
            return JSON.parse(line);
          } catch {
            return { raw: line };
          }
        });

        const vulnerabilities = results.filter((r: any) => r.type === "vuln" || r.poc);

        const summary = {
          url: url,
          total_findings: vulnerabilities.length,
          findings: vulnerabilities.map((v: any) => ({
            type: v.type,
            parameter: v.param,
            payload: v.payload,
            poc: v.poc || v.evidence,
            severity: v.severity || "Medium",
          })),
        };

        return {
          content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
        };
      } catch {
        return { content: [{ type: "text", text: output }] };
      }
    } catch (error) {
      throw new Error(`Dalfox scan failed: ${error}`);
    }
  }
);

server.tool(
  "dalfox-file",
  "Scan multiple URLs from a file for XSS vulnerabilities",
  {
    filePath: z.string().describe("Path to file containing URLs (one per line)"),
    workers: z.number().optional().default(10)
      .describe("Number of concurrent workers"),
    blind: z.string().optional()
      .describe("Blind XSS callback URL"),
  },
  async ({ filePath, workers, blind }) => {
    const args = ["file", filePath, "--format", "json", "--worker", workers.toString()];

    if (blind) {
      args.push("--blind", blind);
    }

    try {
      const output = await runDalfox(args);

      if (!output.trim()) {
        return {
          content: [{ type: "text", text: "No XSS vulnerabilities found." }],
        };
      }

      return {
        content: [{ type: "text", text: output }],
      };
    } catch (error) {
      throw new Error(`Dalfox file scan failed: ${error}`);
    }
  }
);

server.tool(
  "dalfox-pipe",
  "Scan URLs provided as a list for XSS vulnerabilities",
  {
    urls: z.array(z.string()).describe("List of URLs to scan"),
    workers: z.number().optional().default(5)
      .describe("Number of concurrent workers"),
  },
  async ({ urls, workers }) => {
    const results: any[] = [];

    for (const url of urls) {
      const args = ["url", url, "--format", "json", "--silence"];

      try {
        const output = await runDalfox(args);
        if (output.trim()) {
          const lines = output.trim().split("\n");
          for (const line of lines) {
            try {
              const parsed = JSON.parse(line);
              if (parsed.type === "vuln" || parsed.poc) {
                results.push({
                  url: url,
                  ...parsed,
                });
              }
            } catch {
              // Skip non-JSON lines
            }
          }
        }
      } catch {
        // Continue with next URL
      }
    }

    return {
      content: [
        {
          type: "text",
          text: results.length > 0
            ? `Found ${results.length} XSS vulnerabilities:\n\n${JSON.stringify(results, null, 2)}`
            : "No XSS vulnerabilities found in any of the provided URLs.",
        },
      ],
    };
  }
);

server.tool(
  "dalfox-sxss",
  "Scan for Stored XSS by testing form submissions",
  {
    url: z.string().describe("Target URL with form"),
    data: z.string().describe("POST data to submit (e.g., 'name=test&comment=test')"),
    trigger: z.string().describe("URL where the stored XSS would trigger"),
  },
  async ({ url, data, trigger }) => {
    const args = ["sxss", url, "--data", data, "--trigger", trigger, "--format", "json"];

    try {
      const output = await runDalfox(args);

      return {
        content: [
          {
            type: "text",
            text: output || "Stored XSS scan completed. Check trigger URL for results.",
          },
        ],
      };
    } catch (error) {
      throw new Error(`Stored XSS scan failed: ${error}`);
    }
  }
);

server.tool(
  "dalfox-payloads",
  "List XSS payload categories and examples",
  {},
  async () => {
    const payloads = `Dalfox XSS Payload Categories:

REFLECTED XSS:
  - Basic: <script>alert(1)</script>
  - Event handlers: <img src=x onerror=alert(1)>
  - SVG: <svg onload=alert(1)>
  - Body: <body onload=alert(1)>

DOM-BASED XSS:
  - document.write payloads
  - innerHTML manipulation
  - eval() exploitation
  - URL fragment (#) based

BLIND XSS:
  - External script loading
  - Image beacons
  - Fetch/XHR callbacks
  - WebSocket exfiltration

FILTER BYPASS:
  - Case variation: <ScRiPt>
  - Encoding: &#x3c;script&#x3e;
  - Null bytes: <scr%00ipt>
  - Double encoding
  - Unicode normalization

WAF EVASION:
  - Comment insertion: <scr<!--test-->ipt>
  - Attribute breaking
  - Protocol handlers: javascript:
  - Data URIs

Dalfox automatically tests multiple payloads and bypass techniques.

Usage Tips:
  - Use --blind for callback-based detection
  - Use --waf-evasion for protected targets
  - Use --deep-domxss for JavaScript analysis`;

    return {
      content: [{ type: "text", text: payloads }],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Dalfox MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
