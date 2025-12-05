# @mcp-security/sqlmap

<div align="center">

![MCP](https://img.shields.io/badge/MCP-Server-blue?style=flat-square)
[![npm version](https://img.shields.io/npm/v/@mcp-security/sqlmap?style=flat-square)](https://www.npmjs.com/package/@mcp-security/sqlmap)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

**MCP server for [SQLmap](https://sqlmap.org) - SQL injection detection and exploitation**

</div>

## Overview

This MCP server provides AI assistants with access to SQLmap, enabling natural language interaction for security assessments.


### Prerequisites

- **Node.js** 18 or higher
- **SQLmap** installed on your system

## Installation

```bash
# Global installation
npm install -g @mcp-security/sqlmap

# Or use npx directly
npx @mcp-security/sqlmap <path-to-sqlmap>
```

## Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "sqlmap": {
      "command": "npx",
      "args": ["-y", "@mcp-security/sqlmap", "sqlmap"]
    }
  }
}
```

## Usage

Once configured, you can interact with SQLmap through natural language in Claude.

## Security Considerations

> **IMPORTANT**: Only use this tool on systems you have permission to test.

- Always obtain proper authorization before scanning
- Some features may require elevated privileges
- Follow responsible disclosure practices

## License

MIT License - see [LICENSE](LICENSE) for details.

## Related

- [SQLmap](https://sqlmap.org)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP Security Tools](https://github.com/mcp-security/mcp-security)
