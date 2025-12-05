# @mcp-security/scoutsuite

<div align="center">

![MCP](https://img.shields.io/badge/MCP-Server-blue?style=flat-square)
[![npm version](https://img.shields.io/npm/v/@mcp-security/scoutsuite?style=flat-square)](https://www.npmjs.com/package/@mcp-security/scoutsuite)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

**MCP server for [ScoutSuite](https://github.com/nccgroup/ScoutSuite) - Cloud security auditing (AWS/Azure/GCP)**

</div>

## Overview

This MCP server provides AI assistants with access to ScoutSuite, enabling natural language interaction for security assessments.


### Prerequisites

- **Node.js** 18 or higher
- **ScoutSuite** installed on your system

## Installation

```bash
# Global installation
npm install -g @mcp-security/scoutsuite

# Or use npx directly
npx @mcp-security/scoutsuite <path-to-scoutsuite>
```

## Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "scoutsuite": {
      "command": "npx",
      "args": ["-y", "@mcp-security/scoutsuite", "scoutsuite"]
    }
  }
}
```

## Usage

Once configured, you can interact with ScoutSuite through natural language in Claude.

## Security Considerations

> **IMPORTANT**: Only use this tool on systems you have permission to test.

- Always obtain proper authorization before scanning
- Some features may require elevated privileges
- Follow responsible disclosure practices

## License

MIT License - see [LICENSE](LICENSE) for details.

## Related

- [ScoutSuite](https://github.com/nccgroup/ScoutSuite)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP Security Tools](https://github.com/mcp-security/mcp-security)
