# uncover MCP Server

MCP server for [uncover](https://github.com/projectdiscovery/uncover) - Quickly discover exposed hosts using multiple search engines.

## Features

- **Multi-Engine Search**: Shodan, Censys, Fofa, Hunter, Zoomeye, and more
- **Organization Search**: Find assets by organization name
- **JSON Output**: Detailed results with metadata
- **Rate Limiting**: Built-in rate limiting per engine

## Installation

```bash
npm install @mcp-security/uncover
```

## Prerequisites

Install uncover:
```bash
go install -v github.com/projectdiscovery/uncover/cmd/uncover@latest
```

Configure API keys in `~/.config/uncover/provider-config.yaml`

## Usage

```bash
mcp-uncover /path/to/uncover
```

## Available Tools

| Tool | Description |
|------|-------------|
| `uncover-search` | Search across multiple engines |
| `uncover-search-json` | Search with JSON output |
| `uncover-shodan` | Shodan-specific search |
| `uncover-censys` | Censys-specific search |
| `uncover-org` | Search by organization |
| `uncover-engines` | List available engines |

## Supported Engines

- Shodan
- Censys
- Fofa
- Hunter
- Quake
- Zoomeye
- Netlas
- Criminal IP
- PublicWWW
- HunterHow

## License

MIT
