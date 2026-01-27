# metasploit MCP Server

MCP server for [Metasploit Framework](https://www.metasploit.com/) - The world's most used penetration testing framework.

## Features

- **Module Search**: Search exploits, auxiliary, payloads, and more
- **Vulnerability Checks**: Safe check mode for vulnerability detection
- **Auxiliary Scanning**: Run scanners and information gathering
- **Payload Generation**: Generate payloads with msfvenom
- **Database Integration**: Nmap scan import to MSF database

## Installation

```bash
npm install @mcp-security/metasploit
```

## Prerequisites

Install Metasploit Framework:
- [Official Installation Guide](https://docs.metasploit.com/docs/using-metasploit/getting-started/nightly-installers.html)

## Usage

```bash
mcp-metasploit /path/to/msfconsole
```

## Available Tools

| Tool | Description |
|------|-------------|
| `msf-search` | Search for modules |
| `msf-info` | Get module information |
| `msf-exploit-check` | Check vulnerability (safe) |
| `msf-auxiliary-scan` | Run auxiliary scanners |
| `msfvenom-generate` | Generate payloads |
| `msfvenom-list` | List payloads/encoders/formats |
| `msf-db-nmap` | Import nmap results |
| `msf-common-modules` | List common modules |

## Security Notice

⚠️ **For authorized security testing only**

This tool should only be used for:
- Authorized penetration testing
- Security research
- CTF competitions
- Educational purposes

## License

MIT
