# Cyber MCPs - Security Tools for AI

<div align="center">

![MCP Security](https://img.shields.io/badge/MCP-Security%20Tools-blue?style=for-the-badge)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![MCP SDK](https://img.shields.io/badge/MCP%20SDK-1.8+-purple?style=for-the-badge)](https://github.com/modelcontextprotocol/sdk)
[![GitHub](https://img.shields.io/github/stars/hackersatyamrastogi/Cyber_MCPs?style=for-the-badge)](https://github.com/hackersatyamrastogi/Cyber_MCPs)

**A collection of Model Context Protocol (MCP) servers for security tools**

*Enabling AI-powered security assessments through standardized tool integration*

[Installation](#installation) | [Available Servers](#available-servers) | [Usage](#usage) | [Security](#-security-warning) | [Contributing](#contributing)

</div>

---

## ⚠️ SECURITY WARNING

<table>
<tr>
<td>

### 🚨 READ BEFORE USING

**These MCP servers wrap powerful security tools that can:**

- Execute system commands on your machine
- Scan networks and systems (potentially illegally without authorization)
- Expose your IP address to targets
- Require elevated privileges (root/admin)

**CRITICAL SECURITY RISKS:**

1. **Command Injection** - User inputs flow to shell commands
2. **Privilege Escalation** - Some tools need root access
3. **Legal Liability** - Unauthorized scanning is illegal
4. **Data Exposure** - Scan results may leak through AI systems

📖 **Read the full [SECURITY.md](SECURITY.md) before deploying**

</td>
</tr>
</table>

---

## Overview

This monorepo contains **24 MCP servers** that wrap popular security tools, making them accessible to AI assistants like Claude through the [Model Context Protocol](https://modelcontextprotocol.io/).

Each server is:
- **Standalone** - Can be installed and used independently
- **Type-safe** - Written in TypeScript with full type definitions
- **Well-documented** - Includes usage examples and Claude Desktop configuration
- **Production-ready** - Published on npm with semantic versioning

## Available Servers

### Reconnaissance Tools (11)

| Package | Tool | Description |
|---------|------|-------------|
| [`@mcp-security/amass`](./amass) | [Amass](https://github.com/owasp-amass/amass) | Subdomain enumeration and attack surface mapping |
| [`@mcp-security/alterx`](./alterx) | [Alterx](https://github.com/projectdiscovery/alterx) | Fast subdomain wordlist generator |
| [`@mcp-security/assetfinder`](./assetfinder) | [Assetfinder](https://github.com/tomnomnom/assetfinder) | Asset discovery from various sources |
| [`@mcp-security/cero`](./cero) | [Cero](https://github.com/glebarez/cero) | Certificate-based subdomain discovery |
| [`@mcp-security/crtsh`](./crtsh) | [crt.sh](https://crt.sh) | Certificate transparency log search |
| [`@mcp-security/shuffledns`](./shuffledns) | [ShuffleDNS](https://github.com/projectdiscovery/shuffledns) | High-speed DNS resolver and bruteforcer |
| [`@mcp-security/httpx`](./httpx) | [httpx](https://github.com/projectdiscovery/httpx) | Fast HTTP probing and analysis |
| [`@mcp-security/katana`](./katana) | [Katana](https://github.com/projectdiscovery/katana) | Next-gen web crawling framework |
| [`@mcp-security/gowitness`](./gowitness) | [GoWitness](https://github.com/sensepost/gowitness) | Website screenshot utility |
| [`@mcp-security/waybackurls`](./waybackurls) | [Waybackurls](https://github.com/tomnomnom/waybackurls) | Fetch URLs from Wayback Machine |
| [`@mcp-security/masscan`](./masscan) | [Masscan](https://github.com/robertdavidgraham/masscan) | High-speed port scanner |

### Vulnerability Assessment (8)

| Package | Tool | Description |
|---------|------|-------------|
| [`@mcp-security/nuclei`](./nuclei) | [Nuclei](https://github.com/projectdiscovery/nuclei) | Template-based vulnerability scanner |
| [`@mcp-security/nmap`](./nmap) | [Nmap](https://nmap.org) | Network discovery and security auditing |
| [`@mcp-security/sqlmap`](./sqlmap) | [SQLmap](https://sqlmap.org) | SQL injection detection and exploitation |
| [`@mcp-security/ffuf`](./ffuf) | [FFUF](https://github.com/ffuf/ffuf) | Fast web fuzzer |
| [`@mcp-security/arjun`](./arjun) | [Arjun](https://github.com/s0md3v/Arjun) | HTTP parameter discovery |
| [`@mcp-security/smuggler`](./smuggler) | [Smuggler](https://github.com/defparam/smuggler) | HTTP request smuggling detector |
| [`@mcp-security/wpscan`](./wpscan) | [WPScan](https://wpscan.com) | WordPress security scanner |
| [`@mcp-security/nessus`](./nessus) | [Nessus](https://www.tenable.com/products/nessus) | Vulnerability scanner integration |

### Specialized Tools (5)

| Package | Tool | Description |
|---------|------|-------------|
| [`@mcp-security/scoutsuite`](./scoutsuite) | [ScoutSuite](https://github.com/nccgroup/ScoutSuite) | Cloud security auditing (AWS/Azure/GCP) |
| [`@mcp-security/mobsf`](./mobsf) | [MobSF](https://github.com/MobSF/Mobile-Security-Framework-MobSF) | Mobile app security analysis |
| [`@mcp-security/sslscan`](./sslscan) | [SSLScan](https://github.com/rbsec/sslscan) | SSL/TLS configuration testing |
| [`@mcp-security/http-headers`](./http-headers) | Custom | Security headers analysis |
| [`@mcp-security/commix`](./commix) | [Commix](https://github.com/commixproject/commix) | Command injection exploitation |

## Installation

### Prerequisites

- Node.js 18+
- The underlying security tool installed on your system
- Claude Desktop or any MCP-compatible client

### Quick Start

```bash
# Install a specific MCP server
npm install -g @mcp-security/nmap

# Or use npx directly
npx @mcp-security/nmap /usr/bin/nmap
```

### Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "nmap": {
      "command": "npx",
      "args": ["-y", "@mcp-security/nmap", "/usr/bin/nmap"]
    },
    "nuclei": {
      "command": "npx",
      "args": ["-y", "@mcp-security/nuclei", "/usr/bin/nuclei"]
    },
    "sqlmap": {
      "command": "npx",
      "args": ["-y", "@mcp-security/sqlmap", "python3", "/path/to/sqlmap.py"]
    }
  }
}
```

## Usage

Once configured, you can interact with security tools through natural language:

```
User: Scan 192.168.1.1 for open ports

Claude: I'll run an Nmap scan on that target.
[Uses nmap MCP server]

Results:
- Port 22/tcp: open (SSH)
- Port 80/tcp: open (HTTP)
- Port 443/tcp: open (HTTPS)
```

```
User: Check example.com for SQL injection vulnerabilities

Claude: I'll use SQLmap to test for SQL injection.
[Uses sqlmap MCP server]

Testing URL: https://example.com/search?q=test
[Scan results...]
```

## Development

### Setting Up the Monorepo

```bash
# Clone the repository
git clone https://github.com/hackersatyamrastogi/Cyber_MCPs.git
cd Cyber_MCPs

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test
```

### Creating a New MCP Server

```bash
# Use the generator script
./scripts/create-mcp-server.sh my-tool

# Or manually create the structure
mkdir my-tool
cd my-tool
npm init -y
```

## Security Considerations

> **IMPORTANT**: These tools are intended for authorized security testing only.

- Always obtain proper authorization before scanning networks or systems
- Some tools require root/administrator privileges
- Be aware of rate limiting and scan detection
- Follow responsible disclosure practices

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Ways to Contribute

- Add new MCP servers for security tools
- Improve existing server implementations
- Enhance documentation and examples
- Report bugs and suggest features

## License

This project is licensed under the MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- [Model Context Protocol](https://modelcontextprotocol.io/) by Anthropic
- All the amazing open-source security tools this project wraps
- The security research community

---

<div align="center">

**MCP Security Tools**

*Making security tools accessible to AI*

</div>
