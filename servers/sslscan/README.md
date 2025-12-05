# @mcp-security/sslscan

<div align="center">

![MCP](https://img.shields.io/badge/MCP-Server-blue?style=flat-square)
[![npm version](https://img.shields.io/npm/v/@mcp-security/sslscan?style=flat-square)](https://www.npmjs.com/package/@mcp-security/sslscan)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

**MCP server for [SSLScan](https://github.com/rbsec/sslscan) - SSL/TLS configuration testing**

</div>

## Overview

This MCP server provides AI assistants with access to SSLScan, enabling natural language interaction for security assessments.


### Prerequisites

- **Node.js** 18 or higher
- **SSLScan** installed on your system

## Installation

```bash
# Global installation
npm install -g @mcp-security/sslscan

# Or use npx directly
npx @mcp-security/sslscan <path-to-sslscan>
```

## Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "sslscan": {
      "command": "npx",
      "args": ["-y", "@mcp-security/sslscan", "sslscan"]
    }
  }
}
```

## Usage

Once configured, you can interact with SSLScan through natural language in Claude.

## Security Considerations

> **IMPORTANT**: Only use this tool on systems you have permission to test.

- Always obtain proper authorization before scanning
- Some features may require elevated privileges
- Follow responsible disclosure practices

## License

MIT License - see [LICENSE](LICENSE) for details.

## Related

- [SSLScan](https://github.com/rbsec/sslscan)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP Security Tools](https://github.com/mcp-security/mcp-security)
