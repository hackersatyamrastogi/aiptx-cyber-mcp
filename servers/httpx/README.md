# @mcp-security/httpx

<div align="center">

![MCP](https://img.shields.io/badge/MCP-Server-blue?style=flat-square)
[![npm version](https://img.shields.io/npm/v/@mcp-security/httpx?style=flat-square)](https://www.npmjs.com/package/@mcp-security/httpx)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

**MCP server for [httpx](https://github.com/projectdiscovery/httpx) - Fast HTTP probing and analysis**

</div>

## Overview

This MCP server provides AI assistants with access to httpx, enabling natural language interaction for security assessments.


### Prerequisites

- **Node.js** 18 or higher
- **httpx** installed on your system

## Installation

```bash
# Global installation
npm install -g @mcp-security/httpx

# Or use npx directly
npx @mcp-security/httpx <path-to-httpx>
```

## Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "httpx": {
      "command": "npx",
      "args": ["-y", "@mcp-security/httpx", "httpx"]
    }
  }
}
```

## Usage

Once configured, you can interact with httpx through natural language in Claude.

## Security Considerations

> **IMPORTANT**: Only use this tool on systems you have permission to test.

- Always obtain proper authorization before scanning
- Some features may require elevated privileges
- Follow responsible disclosure practices

## License

MIT License - see [LICENSE](LICENSE) for details.

## Related

- [httpx](https://github.com/projectdiscovery/httpx)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP Security Tools](https://github.com/mcp-security/mcp-security)
