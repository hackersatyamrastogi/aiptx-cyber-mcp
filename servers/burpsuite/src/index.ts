#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: mcp-burpsuite <burp-api-url>");
  console.error("Example: mcp-burpsuite http://localhost:1337");
  process.exit(1);
}

const burpApiUrl = args[0];

const server = new McpServer({
  name: "burpsuite",
  version: "1.0.0",
});

async function burpRequest(endpoint: string, method: string = "GET", body?: object): Promise<any> {
  const response = await fetch(`${burpApiUrl}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new Error(`Burp API error: ${response.status} ${response.statusText}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

server.tool(
  "burp-scan",
  "Start an active scan on the specified URL using Burp Suite Professional",
  {
    url: z.string().url().describe("Target URL to scan"),
    scope: z.enum(["url", "host", "domain"]).optional().default("url")
      .describe("Scope of the scan: url (single URL), host (entire host), domain (entire domain)"),
  },
  async ({ url, scope }) => {
    try {
      const result = await burpRequest("/v0.1/scan", "POST", {
        urls: [url],
        scope: { type: scope },
      });

      return {
        content: [
          {
            type: "text",
            text: `Scan started successfully.\nTask ID: ${result.task_id || "N/A"}\nTarget: ${url}\nScope: ${scope}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to start scan: ${error}`);
    }
  }
);

server.tool(
  "burp-scan-status",
  "Get the status of a Burp Suite scan",
  {
    taskId: z.string().describe("The task ID of the scan to check"),
  },
  async ({ taskId }) => {
    try {
      const result = await burpRequest(`/v0.1/scan/${taskId}`);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get scan status: ${error}`);
    }
  }
);

server.tool(
  "burp-get-issues",
  "Get all issues found by Burp Suite",
  {
    severity: z.enum(["high", "medium", "low", "info", "all"]).optional().default("all")
      .describe("Filter issues by severity"),
  },
  async ({ severity }) => {
    try {
      const result = await burpRequest("/v0.1/knowledge_base/issue_definitions");

      let issues = result;
      if (severity !== "all") {
        issues = result.filter((issue: any) =>
          issue.severity?.toLowerCase() === severity
        );
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(issues, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get issues: ${error}`);
    }
  }
);

server.tool(
  "burp-sitemap",
  "Get the site map from Burp Suite",
  {
    urlPrefix: z.string().optional().describe("Filter sitemap by URL prefix"),
  },
  async ({ urlPrefix }) => {
    try {
      const endpoint = urlPrefix
        ? `/v0.1/sitemap?url_prefix=${encodeURIComponent(urlPrefix)}`
        : "/v0.1/sitemap";
      const result = await burpRequest(endpoint);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get sitemap: ${error}`);
    }
  }
);

server.tool(
  "burp-spider",
  "Start spidering/crawling a target URL",
  {
    url: z.string().url().describe("Base URL to spider"),
  },
  async ({ url }) => {
    try {
      const result = await burpRequest("/v0.1/spider", "POST", {
        base_url: url,
      });

      return {
        content: [
          {
            type: "text",
            text: `Spider started on ${url}\n${JSON.stringify(result, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to start spider: ${error}`);
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Burp Suite MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
