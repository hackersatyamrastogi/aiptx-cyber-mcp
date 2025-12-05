# @mcp-security/waybackurls

<div align="center">

![MCP](https://img.shields.io/badge/MCP-Server-blue?style=flat-square)
[![npm version](https://img.shields.io/npm/v/@mcp-security/waybackurls?style=flat-square)](https://www.npmjs.com/package/@mcp-security/waybackurls)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

**MCP server for [Waybackurls](https://github.com/tomnomnom/waybackurls) - Fetch URLs from Wayback Machine**

</div>

## Overview

This MCP server provides AI assistants with access to Waybackurls, enabling natural language interaction for security assessments.


### Prerequisites

- **Node.js** 18 or higher
- **Waybackurls** installed on your system

## Installation

```bash
# Global installation
npm install -g @mcp-security/waybackurls

# Or use npx directly
npx @mcp-security/waybackurls <path-to-waybackurls>
```

## Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "waybackurls": {
      "command": "npx",
      "args": ["-y", "@mcp-security/waybackurls", "waybackurls"]
    }
  }
}
```

## Usage

Once configured, you can interact with Waybackurls through natural language in Claude.

## Security Considerations

> **IMPORTANT**: Only use this tool on systems you have permission to test.

- Always obtain proper authorization before scanning
- Some features may require elevated privileges
- Follow responsible disclosure practices

## License

MIT License - see [LICENSE](LICENSE) for details.

## Related

- [Waybackurls](https://github.com/tomnomnom/waybackurls)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP Security Tools](https://github.com/mcp-security/mcp-security)
