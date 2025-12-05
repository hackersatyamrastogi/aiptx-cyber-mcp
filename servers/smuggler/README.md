# @mcp-security/smuggler

<div align="center">

![MCP](https://img.shields.io/badge/MCP-Server-blue?style=flat-square)
[![npm version](https://img.shields.io/npm/v/@mcp-security/smuggler?style=flat-square)](https://www.npmjs.com/package/@mcp-security/smuggler)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

**MCP server for [Smuggler](https://github.com/defparam/smuggler) - HTTP request smuggling detector**

</div>

## Overview

This MCP server provides AI assistants with access to Smuggler, enabling natural language interaction for security assessments.


### Prerequisites

- **Node.js** 18 or higher
- **Smuggler** installed on your system

## Installation

```bash
# Global installation
npm install -g @mcp-security/smuggler

# Or use npx directly
npx @mcp-security/smuggler <path-to-smuggler>
```

## Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "smuggler": {
      "command": "npx",
      "args": ["-y", "@mcp-security/smuggler", "smuggler"]
    }
  }
}
```

## Usage

Once configured, you can interact with Smuggler through natural language in Claude.

## Security Considerations

> **IMPORTANT**: Only use this tool on systems you have permission to test.

- Always obtain proper authorization before scanning
- Some features may require elevated privileges
- Follow responsible disclosure practices

## License

MIT License - see [LICENSE](LICENSE) for details.

## Related

- [Smuggler](https://github.com/defparam/smuggler)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP Security Tools](https://github.com/mcp-security/mcp-security)
