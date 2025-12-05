# @mcp-security/arjun

<div align="center">

![MCP](https://img.shields.io/badge/MCP-Server-blue?style=flat-square)
[![npm version](https://img.shields.io/npm/v/@mcp-security/arjun?style=flat-square)](https://www.npmjs.com/package/@mcp-security/arjun)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

**MCP server for [Arjun](https://github.com/s0md3v/Arjun) - HTTP parameter discovery suite**

</div>

## Overview

This MCP server provides AI assistants with access to Arjun, enabling natural language interaction for security assessments.


### Prerequisites

- **Node.js** 18 or higher
- **Arjun** installed on your system

## Installation

```bash
# Global installation
npm install -g @mcp-security/arjun

# Or use npx directly
npx @mcp-security/arjun <path-to-arjun>
```

## Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "arjun": {
      "command": "npx",
      "args": ["-y", "@mcp-security/arjun", "arjun"]
    }
  }
}
```

## Usage

Once configured, you can interact with Arjun through natural language in Claude.

## Security Considerations

> **IMPORTANT**: Only use this tool on systems you have permission to test.

- Always obtain proper authorization before scanning
- Some features may require elevated privileges
- Follow responsible disclosure practices

## License

MIT License - see [LICENSE](LICENSE) for details.

## Related

- [Arjun](https://github.com/s0md3v/Arjun)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP Security Tools](https://github.com/mcp-security/mcp-security)
