# @mcp-security/nmap

<div align="center">

![MCP](https://img.shields.io/badge/MCP-Server-blue?style=flat-square)
[![npm version](https://img.shields.io/npm/v/@mcp-security/nmap?style=flat-square)](https://www.npmjs.com/package/@mcp-security/nmap)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

**MCP server for [Nmap](https://nmap.org) - Network exploration and security auditing**

</div>

## Overview

This MCP server provides AI assistants with access to Nmap, the industry-standard network scanner. It enables natural language interaction for:

- Port scanning and service detection
- OS fingerprinting
- Network discovery
- Security auditing

## Prerequisites

- **Node.js** 18 or higher
- **Nmap** installed on your system
  - macOS: `brew install nmap`
  - Ubuntu/Debian: `sudo apt install nmap`
  - Windows: Download from [nmap.org](https://nmap.org/download.html)

## Installation

```bash
# Global installation
npm install -g @mcp-security/nmap

# Or use npx directly (no installation needed)
npx @mcp-security/nmap /usr/bin/nmap
```

## Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

### macOS/Linux

```json
{
  "mcpServers": {
    "nmap": {
      "command": "npx",
      "args": ["-y", "@mcp-security/nmap", "nmap"]
    }
  }
}
```

### Windows

```json
{
  "mcpServers": {
    "nmap": {
      "command": "npx",
      "args": ["-y", "@mcp-security/nmap", "C:\\Program Files (x86)\\Nmap\\nmap.exe"]
    }
  }
}
```

### With Custom Nmap Path

```json
{
  "mcpServers": {
    "nmap": {
      "command": "npx",
      "args": ["-y", "@mcp-security/nmap", "/opt/homebrew/bin/nmap"]
    }
  }
}
```

## Available Tools

### `nmap-scan`

Run an Nmap scan on the specified target.

**Parameters:**
- `target` (required): IP address, hostname, or CIDR range
- `args` (optional): Array of Nmap arguments (default: `["-T4", "-F"]`)

## Usage Examples

### With Claude Desktop

```
User: Scan 192.168.1.1 for open ports

Claude: I'll run a port scan on that IP address.
[Executes nmap-scan with target="192.168.1.1"]

Results:
PORT    STATE SERVICE
22/tcp  open  ssh
80/tcp  open  http
443/tcp open  https
```

```
User: Do a comprehensive scan of 10.0.0.0/24 with version detection

Claude: I'll perform a thorough network scan with service version detection.
[Executes nmap-scan with target="10.0.0.0/24", args=["-sV", "-sC", "-O"]]
```

### Common Scan Types

| Use Case | Arguments |
|----------|-----------|
| Quick scan | `["-T4", "-F"]` |
| Full port scan | `["-p-"]` |
| Service version | `["-sV"]` |
| OS detection | `["-O"]` |
| Aggressive scan | `["-A"]` |
| Stealth SYN scan | `["-sS"]` |
| UDP scan | `["-sU"]` |
| Script scan | `["-sC"]` |
| Top 1000 ports | `["--top-ports", "1000"]` |

## Security Considerations

> **IMPORTANT**: Only scan networks and systems you have permission to test.

- Unauthorized scanning may violate laws and terms of service
- Some scan types (SYN, OS detection) require root/admin privileges
- Consider rate limiting (`-T2` or lower) in production environments
- Be aware that scans may trigger IDS/IPS alerts

## Development

```bash
# Clone the repository
git clone https://github.com/mcp-security/mcp-security.git
cd mcp-security/servers/nmap

# Install dependencies
npm install

# Build
npm run build

# Development mode with auto-reload
npm run dev -- /usr/bin/nmap
```

## License

MIT License - see [LICENSE](LICENSE) for details.

## Related

- [Nmap Official Documentation](https://nmap.org/docs.html)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP Security Tools](https://github.com/mcp-security/mcp-security)
