# @mcp-security/assetfinder

<div align="center">

![MCP](https://img.shields.io/badge/MCP-Server-blue?style=flat-square)
[![npm version](https://img.shields.io/npm/v/@mcp-security/assetfinder?style=flat-square)](https://www.npmjs.com/package/@mcp-security/assetfinder)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

**MCP server for [Assetfinder](https://github.com/tomnomnom/assetfinder) - Asset discovery from various sources**

</div>

## Overview

This MCP server provides AI assistants with access to Assetfinder, enabling natural language interaction for security assessments.


### Prerequisites

- **Node.js** 18 or higher
- **Assetfinder** installed on your system

## Installation

```bash
# Global installation
npm install -g @mcp-security/assetfinder

# Or use npx directly
npx @mcp-security/assetfinder <path-to-assetfinder>
```

## Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "assetfinder": {
      "command": "npx",
      "args": ["-y", "@mcp-security/assetfinder", "assetfinder"]
    }
  }
}
```

## Usage

Once configured, you can interact with Assetfinder through natural language in Claude.

## Security Considerations

> **IMPORTANT**: Only use this tool on systems you have permission to test.

- Always obtain proper authorization before scanning
- Some features may require elevated privileges
- Follow responsible disclosure practices

## License

MIT License - see [LICENSE](LICENSE) for details.

## Related

- [Assetfinder](https://github.com/tomnomnom/assetfinder)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP Security Tools](https://github.com/mcp-security/mcp-security)
