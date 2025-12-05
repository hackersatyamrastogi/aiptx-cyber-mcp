# @mcp-security/wpscan

<div align="center">

![MCP](https://img.shields.io/badge/MCP-Server-blue?style=flat-square)
[![npm version](https://img.shields.io/npm/v/@mcp-security/wpscan?style=flat-square)](https://www.npmjs.com/package/@mcp-security/wpscan)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

**MCP server for [WPScan](https://wpscan.com) - WordPress security scanner**

</div>

## Overview

This MCP server provides AI assistants with access to WPScan, enabling natural language interaction for security assessments.


### Prerequisites

- **Node.js** 18 or higher
- **WPScan** installed on your system

## Installation

```bash
# Global installation
npm install -g @mcp-security/wpscan

# Or use npx directly
npx @mcp-security/wpscan <path-to-wpscan>
```

## Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "wpscan": {
      "command": "npx",
      "args": ["-y", "@mcp-security/wpscan", "wpscan"]
    }
  }
}
```

## Usage

Once configured, you can interact with WPScan through natural language in Claude.

## Security Considerations

> **IMPORTANT**: Only use this tool on systems you have permission to test.

- Always obtain proper authorization before scanning
- Some features may require elevated privileges
- Follow responsible disclosure practices

## License

MIT License - see [LICENSE](LICENSE) for details.

## Related

- [WPScan](https://wpscan.com)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP Security Tools](https://github.com/mcp-security/mcp-security)
