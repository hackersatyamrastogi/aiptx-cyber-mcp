#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { spawn } from "child_process";

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: mcp-uncover <path-to-uncover-binary>");
  console.error("Example: mcp-uncover uncover");
  console.error("Example: mcp-uncover /usr/local/bin/uncover");
  process.exit(1);
}

const uncoverBinary = args[0];

const server = new McpServer({
  name: "uncover",
  version: "1.0.0",
});

function runUncover(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(uncoverBinary, args);
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
      reject(new Error(`Failed to start uncover: ${error.message}`));
    });
  });
}

server.tool(
  "uncover-search",
  "Search across multiple security search engines (Shodan, Censys, Fofa, Hunter, etc.)",
  {
    query: z.string().describe("Search query (supports engine-specific syntax)"),
    engines: z.array(z.enum([
      "shodan", "censys", "fofa", "hunter", "quake", "zoomeye",
      "netlas", "criminalip", "publicwww", "hunterhow"
    ])).optional()
      .describe("Specific search engines to use (default: all configured)"),
    limit: z.number().optional().default(100)
      .describe("Maximum number of results per engine"),
    timeout: z.number().optional().default(30)
      .describe("Timeout in seconds"),
  },
  async ({ query, engines, limit, timeout }) => {
    const args = ["-q", query, "-silent", "-limit", limit.toString(), "-timeout", timeout.toString()];

    if (engines && engines.length > 0) {
      args.push("-e", engines.join(","));
    }

    try {
      const output = await runUncover(args);
      const results = output.trim().split("\n").filter(Boolean);

      return {
        content: [{
          type: "text",
          text: `Uncover Search Results (${results.length} hosts):\nQuery: ${query}\n\n${results.join("\n")}`,
        }],
      };
    } catch (error) {
      throw new Error(`uncover search failed: ${error}`);
    }
  }
);

server.tool(
  "uncover-search-json",
  "Search with detailed JSON output including metadata",
  {
    query: z.string().describe("Search query"),
    engines: z.array(z.enum([
      "shodan", "censys", "fofa", "hunter", "quake", "zoomeye",
      "netlas", "criminalip", "publicwww", "hunterhow"
    ])).optional()
      .describe("Specific search engines to use"),
    limit: z.number().optional().default(50)
      .describe("Maximum results per engine"),
  },
  async ({ query, engines, limit }) => {
    const args = ["-q", query, "-silent", "-json", "-limit", limit.toString()];

    if (engines && engines.length > 0) {
      args.push("-e", engines.join(","));
    }

    try {
      const output = await runUncover(args);
      const lines = output.trim().split("\n").filter(Boolean);
      const results = lines.map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return { raw: line };
        }
      });

      return {
        content: [{
          type: "text",
          text: JSON.stringify(results, null, 2),
        }],
      };
    } catch (error) {
      throw new Error(`uncover JSON search failed: ${error}`);
    }
  }
);

server.tool(
  "uncover-shodan",
  "Search specifically using Shodan with common dorks",
  {
    query: z.string().describe("Shodan search query (e.g., 'apache country:US')"),
    limit: z.number().optional().default(100)
      .describe("Maximum number of results"),
  },
  async ({ query, limit }) => {
    const args = ["-q", query, "-e", "shodan", "-silent", "-limit", limit.toString()];

    try {
      const output = await runUncover(args);
      const results = output.trim().split("\n").filter(Boolean);

      return {
        content: [{
          type: "text",
          text: `Shodan Results (${results.length} hosts):\n\n${results.join("\n")}`,
        }],
      };
    } catch (error) {
      throw new Error(`Shodan search failed: ${error}`);
    }
  }
);

server.tool(
  "uncover-censys",
  "Search specifically using Censys",
  {
    query: z.string().describe("Censys search query"),
    limit: z.number().optional().default(100)
      .describe("Maximum number of results"),
  },
  async ({ query, limit }) => {
    const args = ["-q", query, "-e", "censys", "-silent", "-limit", limit.toString()];

    try {
      const output = await runUncover(args);
      const results = output.trim().split("\n").filter(Boolean);

      return {
        content: [{
          type: "text",
          text: `Censys Results (${results.length} hosts):\n\n${results.join("\n")}`,
        }],
      };
    } catch (error) {
      throw new Error(`Censys search failed: ${error}`);
    }
  }
);

server.tool(
  "uncover-org",
  "Find assets belonging to an organization across all engines",
  {
    organization: z.string().describe("Organization name to search for"),
    limit: z.number().optional().default(200)
      .describe("Maximum results per engine"),
  },
  async ({ organization, limit }) => {
    // Different engines have different org search syntax
    const queries = [
      { engine: "shodan", query: `org:"${organization}"` },
      { engine: "censys", query: `autonomous_system.name:${organization}` },
    ];

    const allResults: string[] = [];

    for (const { engine, query } of queries) {
      try {
        const args = ["-q", query, "-e", engine, "-silent", "-limit", limit.toString()];
        const output = await runUncover(args);
        const results = output.trim().split("\n").filter(Boolean);
        allResults.push(`\n--- ${engine.toUpperCase()} ---\n${results.join("\n")}`);
      } catch {
        allResults.push(`\n--- ${engine.toUpperCase()} ---\nNo results or error`);
      }
    }

    return {
      content: [{
        type: "text",
        text: `Organization Search: ${organization}\n${allResults.join("\n")}`,
      }],
    };
  }
);

server.tool(
  "uncover-engines",
  "List available search engines and their configuration status",
  {},
  async () => {
    const engines = `Available Uncover Search Engines:

GENERAL SEARCH ENGINES:
  - shodan        - Shodan (shodan.io) - Internet device search
  - censys        - Censys (censys.io) - Internet-wide scanning
  - fofa          - FOFA (fofa.info) - Chinese cyberspace search
  - zoomeye       - ZoomEye (zoomeye.org) - Cyberspace search
  - quake         - Quake (quake.360.cn) - 360 security search
  - hunter        - Hunter (hunter.io) - Email/domain intelligence
  - netlas        - Netlas (netlas.io) - Internet intelligence
  - criminalip    - Criminal IP - Threat intelligence
  - publicwww     - PublicWWW - Source code search
  - hunterhow     - Hunter.how - Asset search

Configure API keys in ~/.config/uncover/provider-config.yaml

Example config:
  shodan:
    - SHODAN_API_KEY

  censys:
    - CENSYS_API_ID
    - CENSYS_API_SECRET

  fofa:
    - FOFA_EMAIL
    - FOFA_KEY

Common Shodan Dorks:
  - port:22 country:US        - SSH servers in US
  - "Server: Apache"          - Apache web servers
  - ssl.cert.subject.CN:*.gov - Government SSL certs
  - http.title:"Dashboard"    - Web dashboards`;

    return {
      content: [{ type: "text", text: engines }],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("uncover MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
