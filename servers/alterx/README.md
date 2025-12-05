# @mcp-security/alterx

<div align="center">

![MCP](https://img.shields.io/badge/MCP-Server-blue?style=flat-square)
[![npm version](https://img.shields.io/npm/v/@mcp-security/alterx?style=flat-square)](https://www.npmjs.com/package/@mcp-security/alterx)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

**MCP server for [Alterx](https://github.com/projectdiscovery/alterx) - Fast subdomain wordlist generator**

</div>

## Overview

This MCP server provides AI assistants with access to Alterx, enabling natural language interaction for security assessments.


### Prerequisites

- **Node.js** 18 or higher
- **Alterx** installed on your system

## Installation

```bash
# Global installation
npm install -g @mcp-security/alterx

# Or use npx directly
npx @mcp-security/alterx <path-to-alterx>
```

## Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "alterx": {
      "command": "npx",
      "args": ["-y", "@mcp-security/alterx", "alterx"]
    }
  }
}
```

## Usage

Once configured, you can interact with Alterx through natural language in Claude.

## Security Considerations

> **IMPORTANT**: Only use this tool on systems you have permission to test.

- Always obtain proper authorization before scanning
- Some features may require elevated privileges
- Follow responsible disclosure practices

## License

MIT License - see [LICENSE](LICENSE) for details.

## Related

- [Alterx](https://github.com/projectdiscovery/alterx)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP Security Tools](https://github.com/mcp-security/mcp-security)
