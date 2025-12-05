# @mcp-security/nessus

<div align="center">

![MCP](https://img.shields.io/badge/MCP-Server-blue?style=flat-square)
[![npm version](https://img.shields.io/npm/v/@mcp-security/nessus?style=flat-square)](https://www.npmjs.com/package/@mcp-security/nessus)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

**MCP server for [Nessus](https://www.tenable.com/products/nessus) - Vulnerability scanner integration**

</div>

## Overview

This MCP server provides AI assistants with access to Nessus, enabling natural language interaction for security assessments.


## Installation

```bash
# Global installation
npm install -g @mcp-security/nessus

# Or use npx directly
npx @mcp-security/nessus
```

## Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "nessus": {
      "command": "npx",
      "args": ["-y", "@mcp-security/nessus"]
    }
  }
}
```

## Usage

Once configured, you can interact with Nessus through natural language in Claude.

## Security Considerations

> **IMPORTANT**: Only use this tool on systems you have permission to test.

- Always obtain proper authorization before scanning
- Some features may require elevated privileges
- Follow responsible disclosure practices

## License

MIT License - see [LICENSE](LICENSE) for details.

## Related

- [Nessus](https://www.tenable.com/products/nessus)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP Security Tools](https://github.com/mcp-security/mcp-security)
