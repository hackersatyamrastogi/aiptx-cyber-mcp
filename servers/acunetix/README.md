# Acunetix MCP Server

Model Context Protocol server for **Acunetix Web Vulnerability Scanner** integration.

## Features

- 🚀 **Start Scans**: Initiate vulnerability scans on target URLs
- 📊 **Monitor Progress**: Check real-time scan status and progress
- 🔍 **Get Results**: Retrieve detailed vulnerability findings
- 🎯 **Manage Targets**: List and manage scan targets
- 📋 **Scan History**: View all scans and their results
- 🐛 **Vulnerability Details**: Get comprehensive vulnerability information with remediation guidance

## Installation

```bash
pnpm install
pnpm build
```

## Configuration

Set environment variables:

```bash
export ACUNETIX_URL="https://your-acunetix-instance:3443"
export ACUNETIX_API_KEY="your-api-key-here"
```

Or use the defaults configured in the server.

## Available Tools

### `start-scan`
Start a new vulnerability scan on a target URL.

**Parameters:**
- `target_url` (required): Target URL to scan
- `profile_id` (optional): Scanning profile ID (defaults to Full Scan)
- `description` (optional): Scan description

**Example:**
```json
{
  "target_url": "https://example.com",
  "description": "Comprehensive security assessment"
}
```

### `get-scan-status`
Check the status of a running or completed scan.

**Parameters:**
- `scan_id` (required): Scan ID to check

**Example:**
```json
{
  "scan_id": "abc-123-def"
}
```

### `get-scan-results`
Retrieve detailed results from a completed scan.

**Parameters:**
- `scan_id` (required): Scan ID to retrieve results
- `severity` (optional): Filter by severity (critical, high, medium, low, info)

**Example:**
```json
{
  "scan_id": "abc-123-def",
  "severity": "high"
}
```

### `list-targets`
List all configured scan targets.

**Parameters:**
- `limit` (optional): Maximum targets to return (default: 10)

**Example:**
```json
{
  "limit": 20
}
```

### `list-scans`
List all scans, optionally filtered by target.

**Parameters:**
- `target_id` (optional): Filter scans by target ID
- `limit` (optional): Maximum scans to return (default: 10)

**Example:**
```json
{
  "target_id": "target-123",
  "limit": 15
}
```

### `get-vulnerability`
Get detailed information about a specific vulnerability.

**Parameters:**
- `vuln_id` (required): Vulnerability ID
- `target_id` (required): Target ID

**Example:**
```json
{
  "vuln_id": "vuln-456",
  "target_id": "target-123"
}
```

## Usage with Claude

```
Can you scan https://example.com for vulnerabilities using Acunetix?
```

```
Show me all critical vulnerabilities from scan abc-123-def
```

```
What targets do we have configured in Acunetix?
```

## API Reference

Acunetix API v1 Documentation: [Official Docs](https://www.acunetix.com/resources/api/)

## Security Considerations

- Uses HTTPS with self-signed certificate support
- API key authentication via X-Auth header
- Supports all Acunetix scan profiles
- Rate limiting applies per Acunetix instance

## License

MIT License - See LICENSE file for details.
