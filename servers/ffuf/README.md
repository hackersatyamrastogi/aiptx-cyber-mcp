# @mcp-security/ffuf

<div align="center">

![MCP](https://img.shields.io/badge/MCP-Server-blue?style=flat-square)
[![npm version](https://img.shields.io/npm/v/@mcp-security/ffuf?style=flat-square)](https://www.npmjs.com/package/@mcp-security/ffuf)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

**MCP server for [FFUF](https://github.com/ffuf/ffuf) - Fast web fuzzer for directories and parameters**

</div>

## Overview

This MCP server provides AI assistants with access to FFUF, enabling natural language interaction for security assessments.


### Prerequisites

- **Node.js** 18 or higher
- **FFUF** installed on your system

## Installation

```bash
# Global installation
npm install -g @mcp-security/ffuf

# Or use npx directly
npx @mcp-security/ffuf <path-to-ffuf>
```

## Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "ffuf": {
      "command": "npx",
      "args": ["-y", "@mcp-security/ffuf", "ffuf"]
    }
  }
}
```

## Usage

Once configured, you can interact with FFUF through natural language in Claude.

## Security Considerations

> **IMPORTANT**: Only use this tool on systems you have permission to test.

- Always obtain proper authorization before scanning
- Some features may require elevated privileges
- Follow responsible disclosure practices

## License

MIT License - see [LICENSE](LICENSE) for details.

## Related

- [FFUF](https://github.com/ffuf/ffuf)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP Security Tools](https://github.com/mcp-security/mcp-security)
