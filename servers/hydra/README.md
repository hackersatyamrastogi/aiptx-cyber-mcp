# hydra MCP Server

MCP server for [THC-Hydra](https://github.com/vanhauser-thc/thc-hydra) - Fast and flexible online password attack tool.

## Features

- **Multi-Protocol**: SSH, FTP, HTTP, SMB, MySQL, and 50+ protocols
- **HTTP Form Attacks**: GET and POST form authentication
- **Parallel Tasks**: Configurable thread count
- **Credential Discovery**: Efficient password spraying

## Installation

```bash
npm install @mcp-security/hydra
```

## Prerequisites

Install Hydra:
```bash
# macOS
brew install hydra

# Ubuntu/Debian
apt install hydra

# Kali Linux
# Pre-installed
```

## Usage

```bash
mcp-hydra /path/to/hydra
```

## Available Tools

| Tool | Description |
|------|-------------|
| `hydra-attack` | General password attack |
| `hydra-http-form` | HTTP form authentication attack |
| `hydra-ssh` | SSH brute force |
| `hydra-smb` | SMB/Windows authentication attack |
| `hydra-services` | List supported services |

## Supported Protocols

SSH, FTP, Telnet, HTTP(S), SMB, MySQL, MSSQL, PostgreSQL, RDP, VNC, LDAP, POP3, IMAP, SMTP, and many more.

## Security Notice

⚠️ **For authorized security testing only**

This tool should only be used against systems you have explicit permission to test.

## License

MIT
