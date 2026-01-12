#!/usr/bin/env node

/**
 * AIPTX Cyber MCP - Unified Security Server
 *
 * A single MCP server that exposes all 40+ security tools.
 * Connect once, access everything.
 *
 * Usage: mcp-unified [config-file]
 * Example: mcp-unified ./config.json
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";

// Default tool configuration
interface ToolConfig {
  binary: string;
  enabled: boolean;
  apiKey?: string;
  url?: string;
}

interface Config {
  tools: Record<string, ToolConfig>;
}

// Load configuration
const configPath = process.argv[2] || path.join(process.cwd(), "mcp-config.json");
let config: Config = { tools: {} };

if (fs.existsSync(configPath)) {
  config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  console.error(`Loaded config from: ${configPath}`);
} else {
  // Default configuration - auto-detect tools
  const defaultTools = [
    "nmap", "masscan", "nuclei", "subfinder", "httpx", "katana",
    "amass", "ffuf", "gowitness", "waybackurls", "alterx", "shuffledns",
    "assetfinder", "sqlmap", "dalfox", "arjun", "commix", "wpscan",
    "sslscan", "trivy", "semgrep", "gitleaks", "prowler", "checkov"
  ];

  for (const tool of defaultTools) {
    config.tools[tool] = { binary: tool, enabled: true };
  }
  console.error("Using default configuration (auto-detect tools)");
}

const server = new McpServer({
  name: "aiptx-unified",
  version: "1.0.0",
});

// Helper to run shell commands
function runCommand(binary: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(binary, args);
    let output = "";
    let errorOutput = "";

    proc.stdout.on("data", (data) => { output += data.toString(); });
    proc.stderr.on("data", (data) => { errorOutput += data.toString(); });

    proc.on("close", (code) => {
      if (code === 0 || output) {
        resolve(output || errorOutput);
      } else {
        reject(new Error(errorOutput || `Command failed with code ${code}`));
      }
    });

    proc.on("error", (error) => {
      reject(new Error(`Failed to start ${binary}: ${error.message}`));
    });
  });
}

// Helper for HTTP requests
async function httpRequest(url: string, options: RequestInit = {}): Promise<any> {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

// ═══════════════════════════════════════════════════════════════════════════
// RECONNAISSANCE TOOLS
// ═══════════════════════════════════════════════════════════════════════════

server.tool(
  "recon-nmap",
  "Network port scanning and service detection with Nmap",
  {
    target: z.string().describe("Target IP, hostname, or CIDR range"),
    scanType: z.enum(["quick", "full", "stealth", "version", "aggressive"]).optional().default("quick"),
  },
  async ({ target, scanType }) => {
    const scanArgs: Record<string, string[]> = {
      quick: ["-T4", "-F"],
      full: ["-p-", "-T4"],
      stealth: ["-sS", "-T2"],
      version: ["-sV", "-sC"],
      aggressive: ["-A", "-T4"],
    };
    const output = await runCommand("nmap", [...scanArgs[scanType], target]);
    return { content: [{ type: "text", text: output }] };
  }
);

server.tool(
  "recon-subfinder",
  "Fast subdomain enumeration using passive sources",
  {
    domain: z.string().describe("Target domain (e.g., example.com)"),
    all: z.boolean().optional().default(false).describe("Use all sources"),
  },
  async ({ domain, all }) => {
    const args = ["-d", domain, "-silent"];
    if (all) args.push("-all");
    const output = await runCommand("subfinder", args);
    const subdomains = output.trim().split("\n").filter(Boolean);
    return { content: [{ type: "text", text: `Found ${subdomains.length} subdomains:\n${output}` }] };
  }
);

server.tool(
  "recon-httpx",
  "HTTP probing to find live web servers",
  {
    targets: z.array(z.string()).describe("List of hosts/URLs to probe"),
    statusCode: z.boolean().optional().default(true),
    title: z.boolean().optional().default(true),
  },
  async ({ targets, statusCode, title }) => {
    const args = ["-silent"];
    if (statusCode) args.push("-status-code");
    if (title) args.push("-title");

    // Pipe targets to httpx
    const proc = spawn("httpx", args);
    proc.stdin.write(targets.join("\n"));
    proc.stdin.end();

    let output = "";
    for await (const chunk of proc.stdout) {
      output += chunk.toString();
    }
    return { content: [{ type: "text", text: output }] };
  }
);

server.tool(
  "recon-masscan",
  "High-speed port scanning (requires root)",
  {
    target: z.string().describe("Target IP or CIDR range"),
    ports: z.string().optional().default("1-1000").describe("Port range"),
    rate: z.number().optional().default(1000).describe("Packets per second"),
  },
  async ({ target, ports, rate }) => {
    const output = await runCommand("masscan", [target, "-p", ports, "--rate", rate.toString()]);
    return { content: [{ type: "text", text: output }] };
  }
);

// ═══════════════════════════════════════════════════════════════════════════
// VULNERABILITY SCANNING
// ═══════════════════════════════════════════════════════════════════════════

server.tool(
  "vuln-nuclei",
  "Template-based vulnerability scanning",
  {
    target: z.string().describe("Target URL or host"),
    templates: z.string().optional().describe("Specific templates (e.g., cves, vulnerabilities)"),
    severity: z.enum(["info", "low", "medium", "high", "critical", "all"]).optional().default("all"),
  },
  async ({ target, templates, severity }) => {
    const args = ["-u", target, "-silent", "-json"];
    if (templates) args.push("-t", templates);
    if (severity !== "all") args.push("-severity", severity);

    const output = await runCommand("nuclei", args);
    return { content: [{ type: "text", text: output }] };
  }
);

server.tool(
  "vuln-sqlmap",
  "SQL injection detection and exploitation",
  {
    url: z.string().describe("Target URL with parameter (e.g., http://site.com/page?id=1)"),
    level: z.number().optional().default(1).describe("Test level (1-5)"),
    risk: z.number().optional().default(1).describe("Risk level (1-3)"),
  },
  async ({ url, level, risk }) => {
    const output = await runCommand("sqlmap", ["-u", url, "--level", level.toString(), "--risk", risk.toString(), "--batch"]);
    return { content: [{ type: "text", text: output }] };
  }
);

server.tool(
  "vuln-dalfox",
  "XSS vulnerability scanner",
  {
    url: z.string().describe("Target URL with parameters"),
    blind: z.string().optional().describe("Blind XSS callback URL"),
  },
  async ({ url, blind }) => {
    const args = ["url", url, "--silence"];
    if (blind) args.push("--blind", blind);
    const output = await runCommand("dalfox", args);
    return { content: [{ type: "text", text: output }] };
  }
);

server.tool(
  "vuln-ffuf",
  "Web fuzzing for directories, files, and parameters",
  {
    url: z.string().describe("Target URL with FUZZ keyword (e.g., http://site.com/FUZZ)"),
    wordlist: z.string().describe("Path to wordlist"),
    extensions: z.string().optional().describe("File extensions (e.g., php,txt,html)"),
  },
  async ({ url, wordlist, extensions }) => {
    const args = ["-u", url, "-w", wordlist, "-c"];
    if (extensions) args.push("-e", extensions);
    const output = await runCommand("ffuf", args);
    return { content: [{ type: "text", text: output }] };
  }
);

// ═══════════════════════════════════════════════════════════════════════════
// CONTAINER & CLOUD SECURITY
// ═══════════════════════════════════════════════════════════════════════════

server.tool(
  "cloud-trivy",
  "Scan container images and IaC for vulnerabilities",
  {
    target: z.string().describe("Image name, directory path, or repo URL"),
    type: z.enum(["image", "fs", "repo", "config"]).optional().default("image"),
    severity: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW", "ALL"]).optional().default("ALL"),
  },
  async ({ target, type, severity }) => {
    const args = [type, "--format", "json", target];
    if (severity !== "ALL") args.push("--severity", severity);
    const output = await runCommand("trivy", args);
    return { content: [{ type: "text", text: output }] };
  }
);

server.tool(
  "cloud-prowler",
  "AWS/Azure/GCP security assessment",
  {
    provider: z.enum(["aws", "azure", "gcp"]).describe("Cloud provider"),
    service: z.string().optional().describe("Specific service to audit"),
  },
  async ({ provider, service }) => {
    const args = [provider, "-M", "json"];
    if (service) args.push("-s", service);
    const output = await runCommand("prowler", args);
    return { content: [{ type: "text", text: output }] };
  }
);

server.tool(
  "cloud-checkov",
  "Infrastructure as Code security scanning",
  {
    path: z.string().describe("Path to IaC files"),
    framework: z.enum(["terraform", "cloudformation", "kubernetes", "dockerfile", "all"]).optional().default("all"),
  },
  async ({ path, framework }) => {
    const args = ["-d", path, "-o", "json"];
    if (framework !== "all") args.push("--framework", framework);
    const output = await runCommand("checkov", args);
    return { content: [{ type: "text", text: output }] };
  }
);

// ═══════════════════════════════════════════════════════════════════════════
// CODE & SECRET SECURITY
// ═══════════════════════════════════════════════════════════════════════════

server.tool(
  "code-semgrep",
  "Static analysis for security vulnerabilities",
  {
    path: z.string().describe("Path to code directory"),
    config: z.string().optional().default("auto").describe("Rule config (auto, p/security-audit, p/owasp-top-ten)"),
  },
  async ({ path, config }) => {
    const output = await runCommand("semgrep", ["--config", config, path, "--json"]);
    return { content: [{ type: "text", text: output }] };
  }
);

server.tool(
  "code-gitleaks",
  "Detect secrets in git repositories",
  {
    path: z.string().describe("Path to git repository"),
    noGit: z.boolean().optional().default(false).describe("Scan without git history"),
  },
  async ({ path, noGit }) => {
    const args = ["detect", "--source", path, "--report-format", "json", "--report-path", "/dev/stdout"];
    if (noGit) args.push("--no-git");
    const output = await runCommand("gitleaks", args);
    return { content: [{ type: "text", text: output || "No secrets found" }] };
  }
);

// ═══════════════════════════════════════════════════════════════════════════
// META TOOLS
// ═══════════════════════════════════════════════════════════════════════════

server.tool(
  "meta-full-recon",
  "Run comprehensive reconnaissance on a domain",
  {
    domain: z.string().describe("Target domain"),
  },
  async ({ domain }) => {
    const results: Record<string, string> = {};

    // Subdomain enumeration
    try {
      results.subdomains = await runCommand("subfinder", ["-d", domain, "-silent"]);
    } catch (e) {
      results.subdomains = `Error: ${e}`;
    }

    // HTTP probing
    try {
      const subs = results.subdomains.split("\n").filter(Boolean).slice(0, 50);
      if (subs.length > 0) {
        const proc = spawn("httpx", ["-silent", "-status-code", "-title"]);
        proc.stdin.write(subs.join("\n"));
        proc.stdin.end();
        let httpxOutput = "";
        for await (const chunk of proc.stdout) {
          httpxOutput += chunk.toString();
        }
        results.liveHosts = httpxOutput;
      }
    } catch (e) {
      results.liveHosts = `Error: ${e}`;
    }

    return {
      content: [{
        type: "text",
        text: `# Full Reconnaissance Results for ${domain}\n\n` +
              `## Subdomains Found\n\`\`\`\n${results.subdomains}\n\`\`\`\n\n` +
              `## Live Hosts\n\`\`\`\n${results.liveHosts || "N/A"}\n\`\`\``,
      }],
    };
  }
);

server.tool(
  "meta-security-audit",
  "Run security audit on a codebase",
  {
    path: z.string().describe("Path to code repository"),
  },
  async ({ path }) => {
    const results: Record<string, string> = {};

    // Semgrep scan
    try {
      results.semgrep = await runCommand("semgrep", ["--config", "p/security-audit", path, "--json"]);
    } catch (e) {
      results.semgrep = `Error: ${e}`;
    }

    // Gitleaks scan
    try {
      results.secrets = await runCommand("gitleaks", ["detect", "--source", path, "--report-format", "json", "--report-path", "/dev/stdout"]);
    } catch (e) {
      results.secrets = `Error: ${e}`;
    }

    return {
      content: [{
        type: "text",
        text: `# Security Audit Results\n\n` +
              `## Static Analysis (Semgrep)\n\`\`\`json\n${results.semgrep}\n\`\`\`\n\n` +
              `## Secret Detection (Gitleaks)\n\`\`\`json\n${results.secrets || "No secrets found"}\n\`\`\``,
      }],
    };
  }
);

server.tool(
  "list-tools",
  "List all available security tools in this server",
  {},
  async () => {
    const tools = `
# AIPTX Unified Security MCP - Available Tools

## Reconnaissance
- recon-nmap: Network port scanning
- recon-subfinder: Subdomain enumeration
- recon-httpx: HTTP probing
- recon-masscan: High-speed port scanning

## Vulnerability Scanning
- vuln-nuclei: Template-based vulnerability scanning
- vuln-sqlmap: SQL injection testing
- vuln-dalfox: XSS vulnerability scanning
- vuln-ffuf: Web fuzzing

## Cloud & Container Security
- cloud-trivy: Container/IaC vulnerability scanning
- cloud-prowler: Cloud security assessment
- cloud-checkov: Infrastructure as Code scanning

## Code & Secret Security
- code-semgrep: Static analysis
- code-gitleaks: Secret detection

## Meta Tools (Automated Workflows)
- meta-full-recon: Comprehensive reconnaissance
- meta-security-audit: Full codebase security audit

## Usage Examples
Ask me:
- "Run recon-nmap on 192.168.1.1"
- "Scan example.com with meta-full-recon"
- "Check my code for secrets with code-gitleaks"
`;
    return { content: [{ type: "text", text: tools }] };
  }
);

// ═══════════════════════════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("AIPTX Unified Security MCP Server running on stdio");
  console.error("Tools loaded: 15 security tools + 2 meta workflows");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
