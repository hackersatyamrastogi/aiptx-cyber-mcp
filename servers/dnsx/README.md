# dnsx MCP Server

MCP server for [dnsx](https://github.com/projectdiscovery/dnsx) - A fast and multi-purpose DNS toolkit by ProjectDiscovery.

## Features

- **DNS Resolution**: Resolve multiple DNS record types (A, AAAA, CNAME, MX, NS, TXT, SOA, PTR)
- **Subdomain Bruteforce**: DNS bruteforce using wordlists
- **Reverse DNS**: PTR record lookups for IP addresses
- **JSON Output**: Detailed JSON responses with metadata

## Installation

```bash
npm install @mcp-security/dnsx
```

## Prerequisites

Install dnsx:
```bash
go install -v github.com/projectdiscovery/dnsx/cmd/dnsx@latest
```

## Usage

```bash
mcp-dnsx /path/to/dnsx
```

## Available Tools

| Tool | Description |
|------|-------------|
| `dnsx-resolve` | Resolve DNS records for domains |
| `dnsx-bruteforce` | Subdomain bruteforce with wordlist |
| `dnsx-reverse` | Reverse DNS lookups |
| `dnsx-json` | DNS resolution with JSON output |

## Example

```json
{
  "name": "dnsx",
  "command": "mcp-dnsx",
  "args": ["dnsx"]
}
```

## License

MIT
