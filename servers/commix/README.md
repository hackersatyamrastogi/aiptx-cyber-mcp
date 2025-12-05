# @mcp-security/commix

<div align="center">

![MCP](https://img.shields.io/badge/MCP-Server-blue?style=flat-square)
[![npm version](https://img.shields.io/npm/v/@mcp-security/commix?style=flat-square)](https://www.npmjs.com/package/@mcp-security/commix)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

**MCP server for [Commix](https://github.com/commixproject/commix) - Command injection exploitation tool**

</div>

## Overview

This MCP server provides AI assistants with access to Commix, enabling natural language interaction for security assessments.


### Prerequisites

- **Node.js** 18 or higher
- **Commix** installed on your system

## Installation

```bash
# Global installation
npm install -g @mcp-security/commix

# Or use npx directly
npx @mcp-security/commix <path-to-commix>
```

## Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "commix": {
      "command": "npx",
      "args": ["-y", "@mcp-security/commix", "commix"]
    }
  }
}
```

## Usage

Once configured, you can interact with Commix through natural language in Claude.

## Security Considerations

> **IMPORTANT**: Only use this tool on systems you have permission to test.

- Always obtain proper authorization before scanning
- Some features may require elevated privileges
- Follow responsible disclosure practices

## License

MIT License - see [LICENSE](LICENSE) for details.

## Related

- [Commix](https://github.com/commixproject/commix)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP Security Tools](https://github.com/mcp-security/mcp-security)
