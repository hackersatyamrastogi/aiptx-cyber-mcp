# @mcp-security/cero

<div align="center">

![MCP](https://img.shields.io/badge/MCP-Server-blue?style=flat-square)
[![npm version](https://img.shields.io/npm/v/@mcp-security/cero?style=flat-square)](https://www.npmjs.com/package/@mcp-security/cero)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

**MCP server for [Cero](https://github.com/glebarez/cero) - Certificate-based subdomain discovery**

</div>

## Overview

This MCP server provides AI assistants with access to Cero, enabling natural language interaction for security assessments.


### Prerequisites

- **Node.js** 18 or higher
- **Cero** installed on your system

## Installation

```bash
# Global installation
npm install -g @mcp-security/cero

# Or use npx directly
npx @mcp-security/cero <path-to-cero>
```

## Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "cero": {
      "command": "npx",
      "args": ["-y", "@mcp-security/cero", "cero"]
    }
  }
}
```

## Usage

Once configured, you can interact with Cero through natural language in Claude.

## Security Considerations

> **IMPORTANT**: Only use this tool on systems you have permission to test.

- Always obtain proper authorization before scanning
- Some features may require elevated privileges
- Follow responsible disclosure practices

## License

MIT License - see [LICENSE](LICENSE) for details.

## Related

- [Cero](https://github.com/glebarez/cero)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP Security Tools](https://github.com/mcp-security/mcp-security)
