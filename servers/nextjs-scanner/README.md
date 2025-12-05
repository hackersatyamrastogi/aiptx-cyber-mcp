# Next.js CVE Scanner MCP Server

A comprehensive MCP server for detecting **CVE-2025-66478** and **CVE-2025-55182** vulnerabilities in Next.js applications.

## Overview

These critical vulnerabilities affect Next.js applications using React Server Components (RSC), allowing Remote Code Execution (RCE) through crafted multipart POST requests that exploit prototype pollution.

### Vulnerable Versions

| Version | Status |
|---------|--------|
| Next.js 16.x < 16.0.7 | 🚨 Vulnerable |
| Next.js 15.x (most versions) | 🚨 Vulnerable |
| Next.js 15.0.5, 15.1.9, 15.2.6, 15.3.6, 15.4.8, 15.5.7 | ✅ Patched |
| Next.js 14.3.0-canary.77+ | 🚨 Vulnerable |
| Next.js 14.x stable | ✅ Not Affected |
| Next.js 13.x and earlier | ✅ Not Affected |

## Installation

```bash
cd servers/nextjs-scanner
pnpm install
pnpm build
```

## Usage

### With Claude Desktop / Claude Code

Add to your MCP configuration:

```json
{
  "mcpServers": {
    "nextjs-scanner": {
      "command": "node",
      "args": ["/path/to/servers/nextjs-scanner/build/index.js"]
    }
  }
}
```

### Available Tools

#### 1. `nextjs-scan` - Single URL Scan

Scan a single URL for the vulnerability.

```
Parameters:
- url (required): Target URL to scan
- safe_check: Use error-based detection (no code execution)
- waf_bypass: Prepend junk data to evade WAFs
- unicode_encode: Encode payload in Unicode
- timeout: Request timeout in ms
```

#### 2. `nextjs-batch-scan` - Batch Scanning

Scan multiple URLs with configurable concurrency.

```
Parameters:
- urls (required): Array of URLs to scan
- concurrency: Number of concurrent scans (default: 10)
- safe_check: Use safe detection mode
- waf_bypass: Enable WAF evasion
```

#### 3. `nextjs-version-check` - Version Vulnerability Check

Check if a specific Next.js version is vulnerable.

```
Parameters:
- version: Next.js version string (e.g., "15.0.1", "16.0.6")
```

#### 4. `nextjs-vuln-info` - Vulnerability Information

Get detailed information about the vulnerabilities.

#### 5. `nextjs-generate-payload` - Payload Generator

Generate exploit payloads for authorized penetration testing.

## Detection Methods

### 1. RCE Proof-of-Concept (Default)

Sends a payload that performs `41 * 271 = 11111`. If vulnerable:
- Result appears in `X-Action-Redirect` header
- High confidence detection

### 2. Safe Check Mode

Detects vulnerability via error patterns:
- Looks for 500 status with RSC error digest
- No code execution on target
- Medium confidence detection

### 3. Version Detection

Extracts Next.js version from:
- `X-Powered-By` header
- Compares against known vulnerable versions

## WAF Bypass Techniques

- **Junk Data Padding**: Prepends random data (default 128KB) to evade content inspection
- **Unicode Encoding**: Encodes JSON payload in Unicode

## Example Output

```
🔍 Next.js CVE-2025-66478 Scan Result
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Target:     https://example.com
Status:     🚨 VULNERABLE
Confidence: HIGH
Method:     rce-poc
Details:    RCE confirmed! X-Action-Redirect contains "11111" (41*271=11111)

Version:    15.0.1
Vuln Check: ⚠️ Version is vulnerable
            Next.js 15.0.1 is vulnerable. Upgrade to one of: 15.0.5, 15.1.9, ...
```

## Credits

This scanner combines techniques from:
- [assetnote/react2shell-scanner](https://github.com/assetnote/react2shell-scanner)
- [pyroxenites/Nextjs_RCE_Exploit_Tool](https://github.com/pyroxenites/Nextjs_RCE_Exploit_Tool)
- [Malayke/Next.js-RSC-RCE-Scanner](https://github.com/Malayke/Next.js-RSC-RCE-Scanner-CVE-2025-66478)
- [abtonc/next-cve-2025-66478](https://github.com/abtonc/next-cve-2025-66478)

## Disclaimer

⚠️ **This tool is for authorized security testing only.**

Using this scanner against systems without explicit permission may violate computer crime laws. Always obtain proper authorization before testing.

## License

MIT
