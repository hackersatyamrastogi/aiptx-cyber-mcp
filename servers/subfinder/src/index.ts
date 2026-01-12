#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { spawn } from "child_process";

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: mcp-subfinder <path-to-subfinder-binary>");
  console.error("Example: mcp-subfinder subfinder");
  console.error("Example: mcp-subfinder /usr/local/bin/subfinder");
  process.exit(1);
}

const subfinderBinary = args[0];

const server = new McpServer({
  name: "subfinder",
  version: "1.0.0",
});

function runSubfinder(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(subfinderBinary, args);
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
      reject(new Error(`Failed to start subfinder: ${error.message}`));
    });
  });
}

server.tool(
  "subfinder-enumerate",
  "Enumerate subdomains for a domain using passive sources",
  {
    domain: z.string().describe("Target domain to enumerate (e.g., example.com)"),
    sources: z.array(z.string()).optional()
      .describe(`Specific sources to use. Available:
  alienvault, anubis, bevigil, binaryedge, bufferover, c99, censys, certspotter,
  chaos, chinaz, commoncrawl, crtsh, digitorus, dnsdb, dnsdumpster, dnsrepo,
  fofa, fullhunt, github, hackertarget, hunter, intelx, leakix, netlas,
  passivetotal, quake, rapiddns, redhuntlabs, robtex, securitytrails, shodan,
  sitedossier, threatbook, threatcrowd, threatminer, urlscan, virustotal,
  waybackarchive, whoisxmlapi, zoomeye, zoomeyeapi`),
    recursive: z.boolean().optional().default(false)
      .describe("Use recursion to find more subdomains"),
    all: z.boolean().optional().default(false)
      .describe("Use all sources (slower but more comprehensive)"),
    timeout: z.number().optional().default(30)
      .describe("Timeout in seconds for each source"),
  },
  async ({ domain, sources, recursive, all, timeout }) => {
    const args = ["-d", domain, "-silent"];

    if (sources && sources.length > 0) {
      args.push("-sources", sources.join(","));
    }

    if (recursive) {
      args.push("-recursive");
    }

    if (all) {
      args.push("-all");
    }

    args.push("-timeout", timeout.toString());

    try {
      const output = await runSubfinder(args);
      const subdomains = output.trim().split("\n").filter(Boolean);

      return {
        content: [
          {
            type: "text",
            text: `Found ${subdomains.length} subdomains for ${domain}:\n\n${subdomains.join("\n")}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Subfinder failed: ${error}`);
    }
  }
);

server.tool(
  "subfinder-enumerate-json",
  "Enumerate subdomains with detailed JSON output",
  {
    domain: z.string().describe("Target domain to enumerate"),
    all: z.boolean().optional().default(false)
      .describe("Use all sources"),
  },
  async ({ domain, all }) => {
    const args = ["-d", domain, "-silent", "-json"];

    if (all) {
      args.push("-all");
    }

    try {
      const output = await runSubfinder(args);
      const lines = output.trim().split("\n").filter(Boolean);
      const results = lines.map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return { host: line };
        }
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(results, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Subfinder failed: ${error}`);
    }
  }
);

server.tool(
  "subfinder-multi-domain",
  "Enumerate subdomains for multiple domains",
  {
    domains: z.array(z.string()).describe("List of domains to enumerate"),
    all: z.boolean().optional().default(false)
      .describe("Use all sources"),
  },
  async ({ domains, all }) => {
    const results: Record<string, string[]> = {};

    for (const domain of domains) {
      const args = ["-d", domain, "-silent"];
      if (all) args.push("-all");

      try {
        const output = await runSubfinder(args);
        results[domain] = output.trim().split("\n").filter(Boolean);
      } catch {
        results[domain] = [];
      }
    }

    const summary = Object.entries(results)
      .map(([domain, subs]) => `${domain}: ${subs.length} subdomains`)
      .join("\n");

    return {
      content: [
        {
          type: "text",
          text: `${summary}\n\n${JSON.stringify(results, null, 2)}`,
        },
      ],
    };
  }
);

server.tool(
  "subfinder-sources",
  "List all available data sources for subfinder",
  {},
  async () => {
    const sources = `Available Subfinder Sources:

FREE (No API Key):
  - alienvault      - AlienVault OTX
  - anubis          - AnubisDB
  - crtsh           - Certificate Transparency
  - hackertarget    - HackerTarget
  - rapiddns        - RapidDNS
  - threatcrowd     - ThreatCrowd
  - waybackarchive  - Wayback Machine
  - dnsdumpster     - DNSDumpster
  - urlscan         - URLScan.io

REQUIRES API KEY:
  - binaryedge      - BinaryEdge
  - bufferover      - BufferOver
  - censys          - Censys
  - chaos           - ProjectDiscovery Chaos
  - fofa            - FOFA
  - fullhunt        - FullHunt
  - github          - GitHub Code Search
  - hunter          - Hunter.io
  - intelx          - IntelligenceX
  - passivetotal    - RiskIQ PassiveTotal
  - securitytrails  - SecurityTrails
  - shodan          - Shodan
  - virustotal      - VirusTotal
  - zoomeye         - ZoomEye

Configure API keys in ~/.config/subfinder/provider-config.yaml`;

    return {
      content: [{ type: "text", text: sources }],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Subfinder MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
