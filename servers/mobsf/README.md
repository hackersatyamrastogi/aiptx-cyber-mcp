# @mcp-security/mobsf

<div align="center">

![MCP](https://img.shields.io/badge/MCP-Server-blue?style=flat-square)
[![npm version](https://img.shields.io/npm/v/@mcp-security/mobsf?style=flat-square)](https://www.npmjs.com/package/@mcp-security/mobsf)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

**MCP server for [MobSF](https://github.com/MobSF/Mobile-Security-Framework-MobSF) - Mobile app security analysis**

</div>

## Overview

This MCP server provides AI assistants with access to MobSF, enabling natural language interaction for security assessments.


## Installation

```bash
# Global installation
npm install -g @mcp-security/mobsf

# Or use npx directly
npx @mcp-security/mobsf
```

## Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "mobsf": {
      "command": "npx",
      "args": ["-y", "@mcp-security/mobsf"]
    }
  }
}
```

## Usage

Once configured, you can interact with MobSF through natural language in Claude.

## Security Considerations

> **IMPORTANT**: Only use this tool on systems you have permission to test.

- Always obtain proper authorization before scanning
- Some features may require elevated privileges
- Follow responsible disclosure practices

## License

MIT License - see [LICENSE](LICENSE) for details.

## Related

- [MobSF](https://github.com/MobSF/Mobile-Security-Framework-MobSF)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP Security Tools](https://github.com/mcp-security/mcp-security)
