# @mcp-security/katana

<div align="center">

![MCP](https://img.shields.io/badge/MCP-Server-blue?style=flat-square)
[![npm version](https://img.shields.io/npm/v/@mcp-security/katana?style=flat-square)](https://www.npmjs.com/package/@mcp-security/katana)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

**MCP server for [Katana](https://github.com/projectdiscovery/katana) - Next-gen web crawling framework**

</div>

## Overview

This MCP server provides AI assistants with access to Katana, enabling natural language interaction for security assessments.


### Prerequisites

- **Node.js** 18 or higher
- **Katana** installed on your system

## Installation

```bash
# Global installation
npm install -g @mcp-security/katana

# Or use npx directly
npx @mcp-security/katana <path-to-katana>
```

## Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "katana": {
      "command": "npx",
      "args": ["-y", "@mcp-security/katana", "katana"]
    }
  }
}
```

## Usage

Once configured, you can interact with Katana through natural language in Claude.

## Security Considerations

> **IMPORTANT**: Only use this tool on systems you have permission to test.

- Always obtain proper authorization before scanning
- Some features may require elevated privileges
- Follow responsible disclosure practices

## License

MIT License - see [LICENSE](LICENSE) for details.

## Related

- [Katana](https://github.com/projectdiscovery/katana)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP Security Tools](https://github.com/mcp-security/mcp-security)
