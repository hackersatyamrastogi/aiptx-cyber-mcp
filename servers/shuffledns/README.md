# @mcp-security/shuffledns

<div align="center">

![MCP](https://img.shields.io/badge/MCP-Server-blue?style=flat-square)
[![npm version](https://img.shields.io/npm/v/@mcp-security/shuffledns?style=flat-square)](https://www.npmjs.com/package/@mcp-security/shuffledns)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

**MCP server for [ShuffleDNS](https://github.com/projectdiscovery/shuffledns) - High-speed DNS resolver and bruteforcer**

</div>

## Overview

This MCP server provides AI assistants with access to ShuffleDNS, enabling natural language interaction for security assessments.


### Prerequisites

- **Node.js** 18 or higher
- **ShuffleDNS** installed on your system

## Installation

```bash
# Global installation
npm install -g @mcp-security/shuffledns

# Or use npx directly
npx @mcp-security/shuffledns <path-to-shuffledns>
```

## Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "shuffledns": {
      "command": "npx",
      "args": ["-y", "@mcp-security/shuffledns", "shuffledns"]
    }
  }
}
```

## Usage

Once configured, you can interact with ShuffleDNS through natural language in Claude.

## Security Considerations

> **IMPORTANT**: Only use this tool on systems you have permission to test.

- Always obtain proper authorization before scanning
- Some features may require elevated privileges
- Follow responsible disclosure practices

## License

MIT License - see [LICENSE](LICENSE) for details.

## Related

- [ShuffleDNS](https://github.com/projectdiscovery/shuffledns)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP Security Tools](https://github.com/mcp-security/mcp-security)
