#!/usr/bin/env node

/**
 * Next.js CVE-2025-66478 / CVE-2025-55182 Scanner MCP Server
 *
 * A comprehensive vulnerability scanner for Next.js React Server Components RCE
 * Combines techniques from:
 * - assetnote/react2shell-scanner
 * - pyroxenites/Nextjs_RCE_Exploit_Tool
 * - Malayke/Next.js-RSC-RCE-Scanner-CVE-2025-66478
 * - abtonc/next-cve-2025-66478
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { scanUrl, batchScan, generateReport, type ScanOptions } from './scanner.js';
import { isVulnerable, getVulnerabilitySummary, parseVersion } from './version-check.js';

const server = new McpServer({
  name: "nextjs-scanner",
  version: "1.0.0",
});

// Tool 1: Scan a single URL for the vulnerability
server.tool(
  "nextjs-scan",
  `Scan a single URL for Next.js CVE-2025-66478 / CVE-2025-55182 vulnerability.

This vulnerability affects React Server Components (RSC) and allows Remote Code Execution (RCE)
through crafted multipart POST requests that exploit prototype pollution.

The scanner sends a proof-of-concept payload that performs a math operation (41*271=11111).
If vulnerable, the result appears in the X-Action-Redirect header.`,
  {
    url: z.string().describe("Target URL to scan (e.g., https://example.com)"),
    safe_check: z.boolean().optional().default(false).describe(
      "Use safe check mode - detects vulnerability via error patterns without executing code"
    ),
    waf_bypass: z.boolean().optional().default(false).describe(
      "Enable WAF bypass - prepends junk data to evade content inspection"
    ),
    waf_bypass_size: z.number().optional().default(128).describe(
      "Size of WAF bypass junk data in KB (default: 128)"
    ),
    unicode_encode: z.boolean().optional().default(false).describe(
      "Encode payload in Unicode for additional WAF evasion"
    ),
    timeout: z.number().optional().default(10000).describe(
      "Request timeout in milliseconds (default: 10000)"
    ),
    follow_redirects: z.boolean().optional().default(true).describe(
      "Follow same-origin redirects (default: true)"
    )
  },
  async (args) => {
    const options: ScanOptions = {
      safeCheck: args.safe_check,
      wafBypass: args.waf_bypass,
      wafBypassSize: args.waf_bypass_size,
      useUnicode: args.unicode_encode,
      timeout: args.timeout,
      followRedirects: args.follow_redirects
    };

    const result = await scanUrl(args.url, options);

    let output = `
🔍 Next.js CVE-2025-66478 Scan Result
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Target:     ${result.url}
Status:     ${result.vulnerable ? '🚨 VULNERABLE' : '✅ Not Vulnerable'}
Confidence: ${result.confidence.toUpperCase()}
Method:     ${result.method}
Details:    ${result.details}
`;

    if (result.version) {
      output += `\nVersion:    ${result.version}`;
      output += `\nVuln Check: ${result.versionVulnerable ? '⚠️ Version is vulnerable' : '✅ Version not affected'}`;
      if (result.versionReason) {
        output += `\n            ${result.versionReason}`;
      }
    }

    if (result.statusCode) {
      output += `\n\nHTTP Status: ${result.statusCode}`;
    }

    if (result.redirectChain && result.redirectChain.length > 0) {
      output += `\nRedirects:   ${result.redirectChain.join(' → ')} → ${result.url}`;
    }

    if (result.error) {
      output += `\n\n⚠️ Error: ${result.error}`;
    }

    output += `\n\nTimestamp: ${result.timestamp}`;

    return {
      content: [{
        type: "text",
        text: output
      }]
    };
  }
);

// Tool 2: Batch scan multiple URLs
server.tool(
  "nextjs-batch-scan",
  `Batch scan multiple URLs for Next.js CVE-2025-66478 vulnerability.

Efficiently scans multiple targets with configurable concurrency.
Returns a comprehensive report with all vulnerable and failed targets.`,
  {
    urls: z.array(z.string()).describe("List of URLs to scan"),
    concurrency: z.number().optional().default(10).describe(
      "Number of concurrent scans (default: 10)"
    ),
    safe_check: z.boolean().optional().default(false).describe(
      "Use safe check mode for all scans"
    ),
    waf_bypass: z.boolean().optional().default(false).describe(
      "Enable WAF bypass for all scans"
    ),
    timeout: z.number().optional().default(10000).describe(
      "Request timeout in milliseconds per URL"
    )
  },
  async (args) => {
    const options: ScanOptions & { concurrency: number } = {
      concurrency: args.concurrency,
      safeCheck: args.safe_check,
      wafBypass: args.waf_bypass,
      timeout: args.timeout
    };

    const results = await batchScan(args.urls, options);
    const report = generateReport(results);

    // Also return structured JSON for programmatic use
    const jsonResults = {
      summary: {
        total: results.length,
        vulnerable: results.filter(r => r.vulnerable).length,
        errors: results.filter(r => r.error).length
      },
      results: results.map(r => ({
        url: r.url,
        vulnerable: r.vulnerable,
        confidence: r.confidence,
        details: r.details,
        version: r.version,
        error: r.error
      }))
    };

    return {
      content: [
        {
          type: "text",
          text: report
        },
        {
          type: "text",
          text: `\n📊 JSON Results:\n${JSON.stringify(jsonResults, null, 2)}`
        }
      ]
    };
  }
);

// Tool 3: Check if a specific Next.js version is vulnerable
server.tool(
  "nextjs-version-check",
  `Check if a specific Next.js version is vulnerable to CVE-2025-66478 / CVE-2025-55182.

Supports version formats like:
- 15.0.1
- 16.0.6
- 14.3.0-canary.77`,
  {
    version: z.string().describe("Next.js version to check (e.g., 15.0.1, 16.0.6)")
  },
  async (args) => {
    const result = isVulnerable(args.version);
    const parsed = parseVersion(args.version);

    let output = `
🔍 Next.js Version Check: ${args.version}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Status:  ${result.vulnerable ? '🚨 VULNERABLE' : '✅ Not Vulnerable'}
Reason:  ${result.reason}
`;

    if (parsed) {
      output += `
Parsed Version:
  Major:      ${parsed.major}
  Minor:      ${parsed.minor}
  Patch:      ${parsed.patch}`;
      if (parsed.prerelease) {
        output += `
  Prerelease: ${parsed.prerelease}${parsed.prereleaseNum ? `.${parsed.prereleaseNum}` : ''}`;
      }
    }

    return {
      content: [{
        type: "text",
        text: output
      }]
    };
  }
);

// Tool 4: Get vulnerability information
server.tool(
  "nextjs-vuln-info",
  "Get detailed information about CVE-2025-66478 and CVE-2025-55182 vulnerabilities.",
  {},
  async () => {
    const summary = getVulnerabilitySummary();

    const output = `
🛡️ Next.js React Server Components RCE Vulnerabilities
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 CVE IDs:
  • CVE-2025-66478
  • CVE-2025-55182

📝 Description:
These vulnerabilities affect Next.js applications using React Server Components (RSC).
Attackers can achieve Remote Code Execution (RCE) through crafted multipart POST
requests that exploit prototype pollution in server action handling.

🎯 Attack Vector:
1. Attacker sends a specially crafted multipart/form-data POST request
2. The payload contains prototype pollution via __proto__ manipulation
3. Server-side JavaScript execution is triggered during request parsing
4. Arbitrary code execution is achieved on the target server

${summary}

🔧 Remediation:
1. Upgrade to a patched Next.js version immediately
2. If upgrade is not possible, implement WAF rules to block multipart requests
   with suspicious patterns ($$ACTION, __proto__, constructor.prototype)
3. Review application for any custom server action handlers

📚 References:
  • https://nextjs.org/blog/CVE-2025-66478
  • https://github.com/assetnote/react2shell-scanner
`;

    return {
      content: [{
        type: "text",
        text: output
      }]
    };
  }
);

// Tool 5: Generate scan payloads for manual testing
server.tool(
  "nextjs-generate-payload",
  `Generate exploit payloads for manual testing (authorized penetration testing only).

⚠️ WARNING: Only use on systems you have explicit authorization to test.
Unauthorized use may violate computer crime laws.`,
  {
    waf_bypass: z.boolean().optional().default(false).describe(
      "Include WAF bypass junk data"
    ),
    unicode_encode: z.boolean().optional().default(false).describe(
      "Encode payload in Unicode"
    ),
    payload_type: z.enum(["detection", "safe"]).optional().default("detection").describe(
      "Type of payload: 'detection' for RCE PoC, 'safe' for error-based detection"
    )
  },
  async (args) => {
    // Import payload functions
    const { generateRCEPayload, generateSafeCheckPayload, generateHeaders } = await import('./payloads.js');

    const payload = args.payload_type === "safe"
      ? generateSafeCheckPayload()
      : generateRCEPayload({
          wafBypass: args.waf_bypass,
          useUnicode: args.unicode_encode
        });

    const headers = generateHeaders(payload);

    let output = `
🔧 Next.js CVE Payload Generator
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ FOR AUTHORIZED TESTING ONLY

Payload Type: ${args.payload_type}
WAF Bypass:   ${args.waf_bypass ? 'Enabled' : 'Disabled'}
Unicode:      ${args.unicode_encode ? 'Enabled' : 'Disabled'}

📤 HTTP Headers:
${Object.entries(headers).map(([k, v]) => `  ${k}: ${v}`).join('\n')}

📦 Request Body:
─────────────────────────────────
${payload.body.substring(0, 2000)}${payload.body.length > 2000 ? '\n... (truncated)' : ''}
─────────────────────────────────

🎯 Expected Result:
If vulnerable, look for "${payload.expectedResult}" in:
  • X-Action-Redirect header (e.g., /login?a=11111)
  • Response body

📋 cURL Command:
curl -X POST "TARGET_URL" \\
  -H "Content-Type: ${payload.contentType}" \\
  -H "Accept: text/x-component" \\
  -H "Next-Action: \$\$ACTION_1" \\
  -H "RSC: 1" \\
  --data-binary @payload.txt
`;

    return {
      content: [{
        type: "text",
        text: output
      }]
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Next.js CVE Scanner MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
