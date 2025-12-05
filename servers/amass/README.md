# @mcp-security/amass

<div align="center">

![MCP](https://img.shields.io/badge/MCP-Server-blue?style=flat-square)
[![npm version](https://img.shields.io/npm/v/@mcp-security/amass?style=flat-square)](https://www.npmjs.com/package/@mcp-security/amass)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

**MCP server for [Amass](https://github.com/owasp-amass/amass) - Subdomain enumeration and attack surface mapping**

</div>

## Overview

This MCP server provides AI assistants with access to Amass, enabling natural language interaction for security assessments.


### Prerequisites

- **Node.js** 18 or higher
- **Amass** installed on your system

## Installation

```bash
# Global installation
npm install -g @mcp-security/amass

# Or use npx directly
npx @mcp-security/amass <path-to-amass>
```

## Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "amass": {
      "command": "npx",
      "args": ["-y", "@mcp-security/amass", "amass"]
    }
  }
}
```

## Usage

Once configured, you can interact with Amass through natural language in Claude.

## Security Considerations

> **IMPORTANT**: Only use this tool on systems you have permission to test.

- Always obtain proper authorization before scanning
- Some features may require elevated privileges
- Follow responsible disclosure practices

## License

MIT License - see [LICENSE](LICENSE) for details.

## Related

- [Amass](https://github.com/owasp-amass/amass)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP Security Tools](https://github.com/mcp-security/mcp-security)
