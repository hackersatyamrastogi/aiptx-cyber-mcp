# @mcp-security/crtsh

<div align="center">

![MCP](https://img.shields.io/badge/MCP-Server-blue?style=flat-square)
[![npm version](https://img.shields.io/npm/v/@mcp-security/crtsh?style=flat-square)](https://www.npmjs.com/package/@mcp-security/crtsh)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

**MCP server for [crt.sh](https://crt.sh) - Certificate transparency log search**

</div>

## Overview

This MCP server provides AI assistants with access to crt.sh, enabling natural language interaction for security assessments.


## Installation

```bash
# Global installation
npm install -g @mcp-security/crtsh

# Or use npx directly
npx @mcp-security/crtsh
```

## Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "crtsh": {
      "command": "npx",
      "args": ["-y", "@mcp-security/crtsh"]
    }
  }
}
```

## Usage

Once configured, you can interact with crt.sh through natural language in Claude.

## Security Considerations

> **IMPORTANT**: Only use this tool on systems you have permission to test.

- Always obtain proper authorization before scanning
- Some features may require elevated privileges
- Follow responsible disclosure practices

## License

MIT License - see [LICENSE](LICENSE) for details.

## Related

- [crt.sh](https://crt.sh)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP Security Tools](https://github.com/mcp-security/mcp-security)
