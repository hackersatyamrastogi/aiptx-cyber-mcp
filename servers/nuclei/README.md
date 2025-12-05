# @mcp-security/nuclei

<div align="center">

![MCP](https://img.shields.io/badge/MCP-Server-blue?style=flat-square)
[![npm version](https://img.shields.io/npm/v/@mcp-security/nuclei?style=flat-square)](https://www.npmjs.com/package/@mcp-security/nuclei)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

**MCP server for [Nuclei](https://github.com/projectdiscovery/nuclei) - Template-based vulnerability scanner**

</div>

## Overview

This MCP server provides AI assistants with access to Nuclei, enabling natural language interaction for security assessments.


### Prerequisites

- **Node.js** 18 or higher
- **Nuclei** installed on your system

## Installation

```bash
# Global installation
npm install -g @mcp-security/nuclei

# Or use npx directly
npx @mcp-security/nuclei <path-to-nuclei>
```

## Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "nuclei": {
      "command": "npx",
      "args": ["-y", "@mcp-security/nuclei", "nuclei"]
    }
  }
}
```

## Usage

Once configured, you can interact with Nuclei through natural language in Claude.

## Security Considerations

> **IMPORTANT**: Only use this tool on systems you have permission to test.

- Always obtain proper authorization before scanning
- Some features may require elevated privileges
- Follow responsible disclosure practices

## License

MIT License - see [LICENSE](LICENSE) for details.

## Related

- [Nuclei](https://github.com/projectdiscovery/nuclei)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP Security Tools](https://github.com/mcp-security/mcp-security)
