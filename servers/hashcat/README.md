# hashcat MCP Server

MCP server for [Hashcat](https://hashcat.net/hashcat/) - World's fastest password recovery tool.

## Features

- **600+ Hash Types**: MD5, SHA, NTLM, bcrypt, and many more
- **Multiple Attack Modes**: Dictionary, brute force, hybrid, combinator
- **GPU Acceleration**: Leverage GPU power for cracking
- **Hash Identification**: Identify hash types automatically
- **Mask Attacks**: Powerful pattern-based brute force

## Installation

```bash
npm install @mcp-security/hashcat
```

## Prerequisites

Install Hashcat:
```bash
# macOS
brew install hashcat

# Ubuntu/Debian
apt install hashcat

# From source
# https://hashcat.net/hashcat/
```

## Usage

```bash
mcp-hashcat /path/to/hashcat
```

## Available Tools

| Tool | Description |
|------|-------------|
| `hashcat-crack` | Crack hashes with various modes |
| `hashcat-benchmark` | Run performance benchmark |
| `hashcat-show` | Show cracked hashes from potfile |
| `hashcat-identify` | Identify hash type |
| `hashcat-hash-types` | List hash types by category |
| `hashcat-masks` | Mask charset reference |

## Common Hash Types

| Code | Type |
|------|------|
| 0 | MD5 |
| 100 | SHA1 |
| 1000 | NTLM |
| 1400 | SHA256 |
| 1800 | SHA512crypt |
| 3200 | bcrypt |

## Security Notice

⚠️ **For authorized security testing only**

## License

MIT
