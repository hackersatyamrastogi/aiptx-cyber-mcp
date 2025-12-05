# @mcp-security/http-headers

<div align="center">

![MCP](https://img.shields.io/badge/MCP-Server-blue?style=flat-square)
[![npm version](https://img.shields.io/npm/v/@mcp-security/http-headers?style=flat-square)](https://www.npmjs.com/package/@mcp-security/http-headers)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

**MCP server for [HTTP Security Headers](https://owasp.org/www-project-secure-headers/) - Security headers analysis**

</div>

## Overview

This MCP server provides AI assistants with access to HTTP Security Headers, enabling natural language interaction for security assessments.


## Installation

```bash
# Global installation
npm install -g @mcp-security/http-headers

# Or use npx directly
npx @mcp-security/http-headers
```

## Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "http-headers": {
      "command": "npx",
      "args": ["-y", "@mcp-security/http-headers"]
    }
  }
}
```

## Usage

Once configured, you can interact with HTTP Security Headers through natural language in Claude.

## Security Considerations

> **IMPORTANT**: Only use this tool on systems you have permission to test.

- Always obtain proper authorization before scanning
- Some features may require elevated privileges
- Follow responsible disclosure practices

## License

MIT License - see [LICENSE](LICENSE) for details.

## Related

- [HTTP Security Headers](https://owasp.org/www-project-secure-headers/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP Security Tools](https://github.com/mcp-security/mcp-security)
