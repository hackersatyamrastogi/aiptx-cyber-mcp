#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: mcp-zap <zap-api-url> [api-key]");
  console.error("Example: mcp-zap http://localhost:8080 your-api-key");
  process.exit(1);
}

const zapUrl = args[0];
const apiKey = args[1] || "";

const server = new McpServer({
  name: "owasp-zap",
  version: "1.0.0",
});

async function zapRequest(endpoint: string, params: Record<string, string> = {}): Promise<any> {
  const url = new URL(`${zapUrl}/JSON${endpoint}`);
  if (apiKey) {
    url.searchParams.set("apikey", apiKey);
  }
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`ZAP API error: ${response.status}`);
  }

  return response.json();
}

server.tool(
  "zap-spider",
  "Spider a target URL to discover all pages",
  {
    url: z.string().url().describe("Target URL to spider"),
    maxChildren: z.number().optional().default(0)
      .describe("Maximum number of child URLs to crawl (0 for unlimited)"),
    recurse: z.boolean().optional().default(true)
      .describe("Whether to recurse into found links"),
  },
  async ({ url, maxChildren, recurse }) => {
    try {
      const result = await zapRequest("/spider/action/scan/", {
        url,
        maxChildren: maxChildren.toString(),
        recurse: recurse.toString(),
      });

      return {
        content: [
          {
            type: "text",
            text: `Spider started.\nScan ID: ${result.scan}\n\nUse zap-spider-status to check progress.`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to start spider: ${error}`);
    }
  }
);

server.tool(
  "zap-spider-status",
  "Get the status of a spider scan",
  {
    scanId: z.string().describe("Spider scan ID"),
  },
  async ({ scanId }) => {
    try {
      const status = await zapRequest("/spider/view/status/", { scanId });
      const results = await zapRequest("/spider/view/results/", { scanId });

      return {
        content: [
          {
            type: "text",
            text: `Spider Progress: ${status.status}%\nURLs Found: ${results.results?.length || 0}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get spider status: ${error}`);
    }
  }
);

server.tool(
  "zap-active-scan",
  "Run an active vulnerability scan on a target",
  {
    url: z.string().url().describe("Target URL to scan"),
    recurse: z.boolean().optional().default(true)
      .describe("Whether to scan recursively"),
    policy: z.string().optional()
      .describe("Scan policy name to use"),
  },
  async ({ url, recurse, policy }) => {
    try {
      const params: Record<string, string> = {
        url,
        recurse: recurse.toString(),
      };
      if (policy) {
        params.scanPolicyName = policy;
      }

      const result = await zapRequest("/ascan/action/scan/", params);

      return {
        content: [
          {
            type: "text",
            text: `Active scan started.\nScan ID: ${result.scan}\n\nUse zap-scan-status to check progress.`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to start active scan: ${error}`);
    }
  }
);

server.tool(
  "zap-scan-status",
  "Get the status of an active scan",
  {
    scanId: z.string().describe("Active scan ID"),
  },
  async ({ scanId }) => {
    try {
      const status = await zapRequest("/ascan/view/status/", { scanId });

      return {
        content: [
          {
            type: "text",
            text: `Active Scan Progress: ${status.status}%`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get scan status: ${error}`);
    }
  }
);

server.tool(
  "zap-get-alerts",
  "Get all security alerts found by ZAP",
  {
    baseUrl: z.string().optional().describe("Filter alerts by base URL"),
    riskLevel: z.enum(["Informational", "Low", "Medium", "High", "all"]).optional().default("all")
      .describe("Filter by risk level"),
  },
  async ({ baseUrl, riskLevel }) => {
    try {
      const params: Record<string, string> = {};
      if (baseUrl) {
        params.baseurl = baseUrl;
      }
      if (riskLevel !== "all") {
        params.riskId = riskLevel === "High" ? "3" :
                       riskLevel === "Medium" ? "2" :
                       riskLevel === "Low" ? "1" : "0";
      }

      const result = await zapRequest("/core/view/alerts/", params);

      const alerts = result.alerts?.map((alert: any) => ({
        name: alert.name,
        risk: alert.risk,
        confidence: alert.confidence,
        url: alert.url,
        description: alert.description?.substring(0, 200),
        solution: alert.solution?.substring(0, 200),
      }));

      return {
        content: [
          {
            type: "text",
            text: `Found ${alerts?.length || 0} alerts:\n\n${JSON.stringify(alerts, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get alerts: ${error}`);
    }
  }
);

server.tool(
  "zap-ajax-spider",
  "Run AJAX spider for JavaScript-heavy applications",
  {
    url: z.string().url().describe("Target URL to spider"),
    inScope: z.boolean().optional().default(true)
      .describe("Only spider URLs in scope"),
  },
  async ({ url, inScope }) => {
    try {
      const result = await zapRequest("/ajaxSpider/action/scan/", {
        url,
        inScope: inScope.toString(),
      });

      return {
        content: [
          {
            type: "text",
            text: `AJAX Spider started on ${url}\n${JSON.stringify(result, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to start AJAX spider: ${error}`);
    }
  }
);

server.tool(
  "zap-ajax-spider-status",
  "Get AJAX spider status",
  {},
  async () => {
    try {
      const status = await zapRequest("/ajaxSpider/view/status/");
      const results = await zapRequest("/ajaxSpider/view/numberOfResults/");

      return {
        content: [
          {
            type: "text",
            text: `AJAX Spider Status: ${status.status}\nResults Found: ${results.numberOfResults}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get AJAX spider status: ${error}`);
    }
  }
);

server.tool(
  "zap-generate-report",
  "Generate a security report",
  {
    format: z.enum(["html", "xml", "json", "md"]).optional().default("json")
      .describe("Report format"),
  },
  async ({ format }) => {
    try {
      let endpoint = "/core/view/alerts/";

      if (format === "html") {
        endpoint = "/core/other/htmlreport/";
      } else if (format === "xml") {
        endpoint = "/core/other/xmlreport/";
      } else if (format === "md") {
        endpoint = "/core/other/mdreport/";
      }

      const result = await zapRequest(endpoint);

      return {
        content: [
          {
            type: "text",
            text: typeof result === "string" ? result : JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to generate report: ${error}`);
    }
  }
);

server.tool(
  "zap-set-mode",
  "Set ZAP operation mode",
  {
    mode: z.enum(["safe", "protect", "standard", "attack"])
      .describe("Operation mode: safe (no attacks), protect (attacks on scope only), standard (normal), attack (aggressive)"),
  },
  async ({ mode }) => {
    try {
      const result = await zapRequest("/core/action/setMode/", { mode });

      return {
        content: [
          {
            type: "text",
            text: `ZAP mode set to: ${mode}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to set mode: ${error}`);
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("OWASP ZAP MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
