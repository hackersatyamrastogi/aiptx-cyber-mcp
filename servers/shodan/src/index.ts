#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: mcp-shodan <shodan-api-key>");
  console.error("Example: mcp-shodan YOUR_API_KEY");
  process.exit(1);
}

const apiKey = args[0];
const baseUrl = "https://api.shodan.io";

const server = new McpServer({
  name: "shodan",
  version: "1.0.0",
});

async function shodanRequest(endpoint: string): Promise<any> {
  const separator = endpoint.includes("?") ? "&" : "?";
  const response = await fetch(`${baseUrl}${endpoint}${separator}key=${apiKey}`);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Shodan API error: ${response.status} - ${error}`);
  }

  return response.json();
}

server.tool(
  "shodan-host",
  "Get all available information on an IP address including open ports, services, and vulnerabilities",
  {
    ip: z.string().describe("IP address to look up"),
    history: z.boolean().optional().default(false)
      .describe("Include historical data"),
    minify: z.boolean().optional().default(false)
      .describe("Return only essential information"),
  },
  async ({ ip, history, minify }) => {
    try {
      let endpoint = `/shodan/host/${ip}`;
      const params = [];
      if (history) params.push("history=true");
      if (minify) params.push("minify=true");
      if (params.length > 0) endpoint += `?${params.join("&")}`;

      const result = await shodanRequest(endpoint);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to lookup host: ${error}`);
    }
  }
);

server.tool(
  "shodan-search",
  "Search Shodan for devices matching the query",
  {
    query: z.string().describe(`Shodan search query. Examples:
  - apache country:US
  - port:22 org:"Google"
  - product:nginx city:"San Francisco"
  - vuln:CVE-2021-44228
  - ssl.cert.subject.cn:example.com
  - http.title:"Dashboard"`),
    page: z.number().optional().default(1)
      .describe("Page number for results"),
  },
  async ({ query, page }) => {
    try {
      const result = await shodanRequest(
        `/shodan/host/search?query=${encodeURIComponent(query)}&page=${page}`
      );

      const summary = {
        total: result.total,
        matches: result.matches?.length || 0,
        results: result.matches?.map((match: any) => ({
          ip: match.ip_str,
          port: match.port,
          org: match.org,
          hostnames: match.hostnames,
          product: match.product,
          version: match.version,
          location: `${match.location?.city || "Unknown"}, ${match.location?.country_name || "Unknown"}`,
        })),
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(summary, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Search failed: ${error}`);
    }
  }
);

server.tool(
  "shodan-dns-lookup",
  "Look up DNS information for a domain",
  {
    hostnames: z.array(z.string()).describe("List of hostnames to resolve"),
  },
  async ({ hostnames }) => {
    try {
      const result = await shodanRequest(
        `/dns/resolve?hostnames=${hostnames.join(",")}`
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`DNS lookup failed: ${error}`);
    }
  }
);

server.tool(
  "shodan-reverse-dns",
  "Look up hostnames for IP addresses",
  {
    ips: z.array(z.string()).describe("List of IP addresses to look up"),
  },
  async ({ ips }) => {
    try {
      const result = await shodanRequest(
        `/dns/reverse?ips=${ips.join(",")}`
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Reverse DNS failed: ${error}`);
    }
  }
);

server.tool(
  "shodan-exploits",
  "Search for known exploits",
  {
    query: z.string().describe("Search query for exploits (e.g., CVE number, product name)"),
  },
  async ({ query }) => {
    try {
      const response = await fetch(
        `https://exploits.shodan.io/api/search?query=${encodeURIComponent(query)}&key=${apiKey}`
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Exploit search failed: ${error}`);
    }
  }
);

server.tool(
  "shodan-scan",
  "Request Shodan to scan an IP or network",
  {
    ips: z.array(z.string()).describe("List of IPs or networks (CIDR) to scan"),
  },
  async ({ ips }) => {
    try {
      const response = await fetch(`${baseUrl}/shodan/scan?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `ips=${ips.join(",")}`,
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();

      return {
        content: [
          {
            type: "text",
            text: `Scan requested.\nScan ID: ${result.id}\nCredits remaining: ${result.credits_left}\n\nNote: Results will be available in Shodan once the scan completes.`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Scan request failed: ${error}`);
    }
  }
);

server.tool(
  "shodan-account",
  "Get information about your Shodan account",
  {},
  async () => {
    try {
      const result = await shodanRequest("/account/profile");

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get account info: ${error}`);
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Shodan MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
