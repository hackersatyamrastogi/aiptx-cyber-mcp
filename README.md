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

This monorepo contains **38 MCP servers** that wrap popular security tools, making them accessible to AI assistants like Claude through the [Model Context Protocol](https://modelcontextprotocol.io/).

Each server is:
- **Standalone** - Can be installed and used independently
- **Type-safe** - Written in TypeScript with full type definitions
- **Well-documented** - Includes usage examples and Claude Desktop configuration
- **Production-ready** - Published on npm with semantic versioning

## Available Servers

### Reconnaissance Tools (12)

| Package | Tool | Description |
|---------|------|-------------|
| [`@mcp-security/amass`](./servers/amass) | [Amass](https://github.com/owasp-amass/amass) | Subdomain enumeration and attack surface mapping |
| [`@mcp-security/alterx`](./servers/alterx) | [Alterx](https://github.com/projectdiscovery/alterx) | Fast subdomain wordlist generator |
| [`@mcp-security/assetfinder`](./servers/assetfinder) | [Assetfinder](https://github.com/tomnomnom/assetfinder) | Asset discovery from various sources |
| [`@mcp-security/cero`](./servers/cero) | [Cero](https://github.com/glebarez/cero) | Certificate-based subdomain discovery |
| [`@mcp-security/crtsh`](./servers/crtsh) | [crt.sh](https://crt.sh) | Certificate transparency log search |
| [`@mcp-security/shuffledns`](./servers/shuffledns) | [ShuffleDNS](https://github.com/projectdiscovery/shuffledns) | High-speed DNS resolver and bruteforcer |
| [`@mcp-security/httpx`](./servers/httpx) | [httpx](https://github.com/projectdiscovery/httpx) | Fast HTTP probing and analysis |
| [`@mcp-security/katana`](./servers/katana) | [Katana](https://github.com/projectdiscovery/katana) | Next-gen web crawling framework |
| [`@mcp-security/gowitness`](./servers/gowitness) | [GoWitness](https://github.com/sensepost/gowitness) | Website screenshot utility |
| [`@mcp-security/waybackurls`](./servers/waybackurls) | [Waybackurls](https://github.com/tomnomnom/waybackurls) | Fetch URLs from Wayback Machine |
| [`@mcp-security/masscan`](./servers/masscan) | [Masscan](https://github.com/robertdavidgraham/masscan) | High-speed port scanner |
| [`@mcp-security/subfinder`](./servers/subfinder) | [Subfinder](https://github.com/projectdiscovery/subfinder) | Fast passive subdomain enumeration |

### Vulnerability Assessment (11)

| Package | Tool | Description |
|---------|------|-------------|
| [`@mcp-security/nuclei`](./servers/nuclei) | [Nuclei](https://github.com/projectdiscovery/nuclei) | Template-based vulnerability scanner |
| [`@mcp-security/nmap`](./servers/nmap) | [Nmap](https://nmap.org) | Network discovery and security auditing |
| [`@mcp-security/sqlmap`](./servers/sqlmap) | [SQLmap](https://sqlmap.org) | SQL injection detection and exploitation |
| [`@mcp-security/ffuf`](./servers/ffuf) | [FFUF](https://github.com/ffuf/ffuf) | Fast web fuzzer |
| [`@mcp-security/arjun`](./servers/arjun) | [Arjun](https://github.com/s0md3v/Arjun) | HTTP parameter discovery |
| [`@mcp-security/smuggler`](./servers/smuggler) | [Smuggler](https://github.com/defparam/smuggler) | HTTP request smuggling detector |
| [`@mcp-security/wpscan`](./servers/wpscan) | [WPScan](https://wpscan.com) | WordPress security scanner |
| [`@mcp-security/nessus`](./servers/nessus) | [Nessus](https://www.tenable.com/products/nessus) | Vulnerability scanner integration |
| [`@mcp-security/dalfox`](./servers/dalfox) | [Dalfox](https://github.com/hahwul/dalfox) | XSS vulnerability scanner |
| [`@mcp-security/zap`](./servers/zap) | [OWASP ZAP](https://www.zaproxy.org/) | Web application security scanner |
| [`@mcp-security/burpsuite`](./servers/burpsuite) | [Burp Suite](https://portswigger.net/burp) | Web security testing platform |

### Threat Intelligence & OSINT (3)

| Package | Tool | Description |
|---------|------|-------------|
| [`@mcp-security/shodan`](./servers/shodan) | [Shodan](https://www.shodan.io/) | Internet-connected device search engine |
| [`@mcp-security/virustotal`](./servers/virustotal) | [VirusTotal](https://www.virustotal.com/) | Malware and URL threat analysis |
| [`@mcp-security/bloodhound`](./servers/bloodhound) | [BloodHound](https://github.com/BloodHoundAD/BloodHound) | Active Directory attack path analysis |

### Cloud & Infrastructure Security (4)

| Package | Tool | Description |
|---------|------|-------------|
| [`@mcp-security/scoutsuite`](./servers/scoutsuite) | [ScoutSuite](https://github.com/nccgroup/ScoutSuite) | Cloud security auditing (AWS/Azure/GCP) |
| [`@mcp-security/prowler`](./servers/prowler) | [Prowler](https://github.com/prowler-cloud/prowler) | AWS/Azure/GCP security assessment |
| [`@mcp-security/trivy`](./servers/trivy) | [Trivy](https://github.com/aquasecurity/trivy) | Container and IaC vulnerability scanner |
| [`@mcp-security/checkov`](./servers/checkov) | [Checkov](https://github.com/bridgecrewio/checkov) | Infrastructure as Code security scanner |

### Code & Secret Security (2)

| Package | Tool | Description |
|---------|------|-------------|
| [`@mcp-security/semgrep`](./servers/semgrep) | [Semgrep](https://semgrep.dev/) | Static analysis for security vulnerabilities |
| [`@mcp-security/gitleaks`](./servers/gitleaks) | [Gitleaks](https://github.com/gitleaks/gitleaks) | Secret detection in git repositories |

### Network & AD Security (2)

| Package | Tool | Description |
|---------|------|-------------|
| [`@mcp-security/crackmapexec`](./servers/crackmapexec) | [CrackMapExec](https://github.com/byt3bl33d3r/CrackMapExec) | Network/AD penetration testing toolkit |
| [`@mcp-security/ghidra`](./servers/ghidra) | [Ghidra](https://ghidra-sre.org/) | NSA reverse engineering framework |

### Specialized Tools (4)

| Package | Tool | Description |
|---------|------|-------------|
| [`@mcp-security/mobsf`](./servers/mobsf) | [MobSF](https://github.com/MobSF/Mobile-Security-Framework-MobSF) | Mobile app security analysis |
| [`@mcp-security/sslscan`](./servers/sslscan) | [SSLScan](https://github.com/rbsec/sslscan) | SSL/TLS configuration testing |
| [`@mcp-security/http-headers`](./servers/http-headers) | Custom | Security headers analysis |
| [`@mcp-security/commix`](./servers/commix) | [Commix](https://github.com/commixproject/commix) | Command injection exploitation |

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
    "shodan": {
      "command": "npx",
      "args": ["-y", "@mcp-security/shodan", "YOUR_SHODAN_API_KEY"]
    },
    "semgrep": {
      "command": "npx",
      "args": ["-y", "@mcp-security/semgrep", "semgrep"]
    },
    "trivy": {
      "command": "npx",
      "args": ["-y", "@mcp-security/trivy", "trivy"]
    },
    "gitleaks": {
      "command": "npx",
      "args": ["-y", "@mcp-security/gitleaks", "gitleaks"]
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
User: Search Shodan for exposed MongoDB databases

Claude: I'll search Shodan for MongoDB instances.
[Uses shodan MCP server]

Found 15,432 results for MongoDB servers...
```

```
User: Scan my Terraform files for security issues

Claude: I'll run Checkov to analyze your IaC files.
[Uses checkov MCP server]

Found 12 security issues:
- 3 Critical: S3 bucket encryption disabled
- 5 High: Security group allows all traffic
- 4 Medium: Missing resource tags
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
mkdir servers/my-tool
cd servers/my-tool
npm init -y
```

## Security Considerations

> **IMPORTANT**: These tools are intended for authorized security testing only.

- Always obtain proper authorization before scanning networks or systems
- Some tools require root/administrator privileges
- Be aware of rate limiting and scan detection
- Follow responsible disclosure practices
- API keys (Shodan, VirusTotal, etc.) should be kept secure

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
