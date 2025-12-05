# @mcp-security/gowitness

<div align="center">

![MCP](https://img.shields.io/badge/MCP-Server-blue?style=flat-square)
[![npm version](https://img.shields.io/npm/v/@mcp-security/gowitness?style=flat-square)](https://www.npmjs.com/package/@mcp-security/gowitness)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

**MCP server for [GoWitness](https://github.com/sensepost/gowitness) - Website screenshot utility**

</div>

## Overview

This MCP server provides AI assistants with access to GoWitness, enabling natural language interaction for security assessments.


### Prerequisites

- **Node.js** 18 or higher
- **GoWitness** installed on your system

## Installation

```bash
# Global installation
npm install -g @mcp-security/gowitness

# Or use npx directly
npx @mcp-security/gowitness <path-to-gowitness>
```

## Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "gowitness": {
      "command": "npx",
      "args": ["-y", "@mcp-security/gowitness", "gowitness"]
    }
  }
}
```

## Usage

Once configured, you can interact with GoWitness through natural language in Claude.

## Security Considerations

> **IMPORTANT**: Only use this tool on systems you have permission to test.

- Always obtain proper authorization before scanning
- Some features may require elevated privileges
- Follow responsible disclosure practices

## License

MIT License - see [LICENSE](LICENSE) for details.

## Related

- [GoWitness](https://github.com/sensepost/gowitness)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP Security Tools](https://github.com/mcp-security/mcp-security)
