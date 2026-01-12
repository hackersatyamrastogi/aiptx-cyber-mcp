#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as crypto from "crypto";
import * as fs from "fs";

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: mcp-virustotal <api-key>");
  console.error("Example: mcp-virustotal YOUR_VT_API_KEY");
  process.exit(1);
}

const apiKey = args[0];
const baseUrl = "https://www.virustotal.com/api/v3";

const server = new McpServer({
  name: "virustotal",
  version: "1.0.0",
});

async function vtRequest(
  endpoint: string,
  method: string = "GET",
  body?: any
): Promise<any> {
  const options: RequestInit = {
    method,
    headers: {
      "x-apikey": apiKey,
      "Content-Type": "application/json",
    },
  };

  if (body) {
    options.body = typeof body === "string" ? body : JSON.stringify(body);
  }

  const response = await fetch(`${baseUrl}${endpoint}`, options);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`VirusTotal API error: ${response.status} - ${error}`);
  }

  return response.json();
}

server.tool(
  "vt-scan-url",
  "Submit a URL for scanning by VirusTotal",
  {
    url: z.string().url().describe("URL to scan"),
  },
  async ({ url }) => {
    try {
      const response = await fetch(`${baseUrl}/urls`, {
        method: "POST",
        headers: {
          "x-apikey": apiKey,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `url=${encodeURIComponent(url)}`,
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json() as { data?: { id?: string } };

      return {
        content: [
          {
            type: "text",
            text: `URL submitted for scanning.\nAnalysis ID: ${result.data?.id || "N/A"}\n\nUse vt-url-report to get results.`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to scan URL: ${error}`);
    }
  }
);

server.tool(
  "vt-url-report",
  "Get the analysis report for a URL",
  {
    url: z.string().describe("URL to look up (will be converted to ID)"),
  },
  async ({ url }) => {
    try {
      // Convert URL to base64 ID (VirusTotal's format)
      const urlId = Buffer.from(url).toString("base64").replace(/=/g, "");
      const result = await vtRequest(`/urls/${urlId}`);

      const stats = result.data?.attributes?.last_analysis_stats;
      const summary = {
        url: result.data?.attributes?.url,
        final_url: result.data?.attributes?.last_final_url,
        scan_date: result.data?.attributes?.last_analysis_date,
        stats: stats,
        reputation: result.data?.attributes?.reputation,
        categories: result.data?.attributes?.categories,
      };

      return {
        content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
      };
    } catch (error) {
      throw new Error(`Failed to get URL report: ${error}`);
    }
  }
);

server.tool(
  "vt-hash-report",
  "Get the analysis report for a file hash",
  {
    hash: z.string().describe("File hash (MD5, SHA1, or SHA256)"),
  },
  async ({ hash }) => {
    try {
      const result = await vtRequest(`/files/${hash}`);

      const attrs = result.data?.attributes;
      const summary = {
        sha256: attrs?.sha256,
        sha1: attrs?.sha1,
        md5: attrs?.md5,
        file_type: attrs?.type_description,
        file_size: attrs?.size,
        names: attrs?.names?.slice(0, 5),
        scan_date: attrs?.last_analysis_date,
        stats: attrs?.last_analysis_stats,
        reputation: attrs?.reputation,
        popular_threat_classification: attrs?.popular_threat_classification,
        tags: attrs?.tags,
      };

      return {
        content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
      };
    } catch (error) {
      throw new Error(`Failed to get hash report: ${error}`);
    }
  }
);

server.tool(
  "vt-ip-report",
  "Get information about an IP address",
  {
    ip: z.string().describe("IP address to look up"),
  },
  async ({ ip }) => {
    try {
      const result = await vtRequest(`/ip_addresses/${ip}`);

      const attrs = result.data?.attributes;
      const summary = {
        ip: ip,
        country: attrs?.country,
        as_owner: attrs?.as_owner,
        asn: attrs?.asn,
        reputation: attrs?.reputation,
        stats: attrs?.last_analysis_stats,
        whois: attrs?.whois?.substring(0, 500),
      };

      return {
        content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
      };
    } catch (error) {
      throw new Error(`Failed to get IP report: ${error}`);
    }
  }
);

server.tool(
  "vt-domain-report",
  "Get information about a domain",
  {
    domain: z.string().describe("Domain to look up"),
  },
  async ({ domain }) => {
    try {
      const result = await vtRequest(`/domains/${domain}`);

      const attrs = result.data?.attributes;
      const summary = {
        domain: domain,
        registrar: attrs?.registrar,
        creation_date: attrs?.creation_date,
        reputation: attrs?.reputation,
        stats: attrs?.last_analysis_stats,
        categories: attrs?.categories,
        popularity_ranks: attrs?.popularity_ranks,
        dns_records: attrs?.last_dns_records?.slice(0, 10),
      };

      return {
        content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
      };
    } catch (error) {
      throw new Error(`Failed to get domain report: ${error}`);
    }
  }
);

server.tool(
  "vt-scan-file",
  "Scan a local file by uploading its hash (or full file for unknown files)",
  {
    filePath: z.string().describe("Path to the file to scan"),
  },
  async ({ filePath }) => {
    try {
      // First, compute SHA256 and check if it exists
      const fileBuffer = fs.readFileSync(filePath);
      const hash = crypto.createHash("sha256").update(fileBuffer).digest("hex");

      // Try to get existing report
      try {
        const existing = await vtRequest(`/files/${hash}`);
        if (existing.data) {
          const attrs = existing.data.attributes;
          return {
            content: [
              {
                type: "text",
                text: `File already analyzed:\nSHA256: ${hash}\nStats: ${JSON.stringify(attrs?.last_analysis_stats, null, 2)}`,
              },
            ],
          };
        }
      } catch {
        // File not found, need to upload
      }

      // File not in VT, would need to upload
      return {
        content: [
          {
            type: "text",
            text: `File not found in VirusTotal database.\nSHA256: ${hash}\n\nNote: File upload requires additional implementation and larger API quota.`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to scan file: ${error}`);
    }
  }
);

server.tool(
  "vt-search",
  "Search VirusTotal using their query language",
  {
    query: z.string().describe(`VT search query. Examples:
  - engines:kaspersky positives:5+
  - type:peexe size:100kb-
  - tag:ransomware
  - name:emotet
  - submitter:US
  - fs:2024-01-01+`),
    limit: z.number().optional().default(10).describe("Number of results"),
  },
  async ({ query, limit }) => {
    try {
      const result = await vtRequest(
        `/intelligence/search?query=${encodeURIComponent(query)}&limit=${limit}`
      );

      const items = result.data?.map((item: any) => ({
        id: item.id,
        type: item.type,
        sha256: item.attributes?.sha256,
        names: item.attributes?.names?.slice(0, 3),
        stats: item.attributes?.last_analysis_stats,
      }));

      return {
        content: [{ type: "text", text: JSON.stringify(items, null, 2) }],
      };
    } catch (error) {
      throw new Error(`Search failed: ${error}`);
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("VirusTotal MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
