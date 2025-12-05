# @mcp-security/masscan

<div align="center">

![MCP](https://img.shields.io/badge/MCP-Server-blue?style=flat-square)
[![npm version](https://img.shields.io/npm/v/@mcp-security/masscan?style=flat-square)](https://www.npmjs.com/package/@mcp-security/masscan)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

**MCP server for [Masscan](https://github.com/robertdavidgraham/masscan) - High-speed port scanner**

</div>

## Overview

This MCP server provides AI assistants with access to Masscan, enabling natural language interaction for security assessments.


### Prerequisites

- **Node.js** 18 or higher
- **Masscan** installed on your system

## Installation

```bash
# Global installation
npm install -g @mcp-security/masscan

# Or use npx directly
npx @mcp-security/masscan <path-to-masscan>
```

## Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "masscan": {
      "command": "npx",
      "args": ["-y", "@mcp-security/masscan", "masscan"]
    }
  }
}
```

## Usage

Once configured, you can interact with Masscan through natural language in Claude.

## Security Considerations

> **IMPORTANT**: Only use this tool on systems you have permission to test.

- Always obtain proper authorization before scanning
- Some features may require elevated privileges
- Follow responsible disclosure practices

## License

MIT License - see [LICENSE](LICENSE) for details.

## Related

- [Masscan](https://github.com/robertdavidgraham/masscan)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP Security Tools](https://github.com/mcp-security/mcp-security)
