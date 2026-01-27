# Pentesting Cyber MCP

<div align="center">

![MCP Security](https://img.shields.io/badge/MCP-Security%20Tools-red?style=for-the-badge)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![MCP SDK](https://img.shields.io/badge/MCP%20SDK-1.8+-purple?style=for-the-badge)](https://modelcontextprotocol.io/)
[![Tools](https://img.shields.io/badge/Tools-50-orange?style=for-the-badge)]()

**50 MCP Servers for Security Tools**

*Standardized protocol interface for pentesting and bug bounty automation*

[Installation](#installation) | [Available Tools](#available-mcp-servers) | [Usage](#usage) | [Contributing](#contributing)

</div>

---

## What is MCP?

**Model Context Protocol (MCP)** is an open protocol that standardizes how applications expose tools and capabilities. This repository provides MCP server implementations for 50 popular security tools.

Each MCP server:
- Wraps a security tool with a standardized interface
- Exposes tool functionality through MCP protocol
- Can be used with any MCP-compatible client
- Runs as a standalone process

---

## Available MCP Servers

### Reconnaissance (15)

| MCP Server | Tool | Description |
|------------|------|-------------|
| `amass` | [Amass](https://github.com/owasp-amass/amass) | Attack surface mapping & subdomain enumeration |
| `alterx` | [Alterx](https://github.com/projectdiscovery/alterx) | Subdomain wordlist generator |
| `assetfinder` | [Assetfinder](https://github.com/tomnomnom/assetfinder) | Asset discovery |
| `cero` | [Cero](https://github.com/glebarez/cero) | Certificate-based subdomain discovery |
| `crtsh` | [crt.sh](https://crt.sh) | Certificate transparency logs |
| `dnsx` | [dnsx](https://github.com/projectdiscovery/dnsx) | DNS toolkit |
| `httpx` | [httpx](https://github.com/projectdiscovery/httpx) | HTTP probing |
| `katana` | [Katana](https://github.com/projectdiscovery/katana) | Web crawler |
| `gowitness` | [GoWitness](https://github.com/sensepost/gowitness) | Screenshot utility |
| `masscan` | [Masscan](https://github.com/robertdavidgraham/masscan) | Port scanner |
| `shuffledns` | [ShuffleDNS](https://github.com/projectdiscovery/shuffledns) | DNS bruteforcer |
| `subfinder` | [Subfinder](https://github.com/projectdiscovery/subfinder) | Subdomain enumeration |
| `uncover` | [Uncover](https://github.com/projectdiscovery/uncover) | Shodan/Censys/Fofa search |
| `waybackurls` | [Waybackurls](https://github.com/tomnomnom/waybackurls) | Wayback Machine URLs |
| `notify` | [Notify](https://github.com/projectdiscovery/notify) | Notification streaming |

### Vulnerability Scanning (11)

| MCP Server | Tool | Description |
|------------|------|-------------|
| `nuclei` | [Nuclei](https://github.com/projectdiscovery/nuclei) | Template-based scanner |
| `nmap` | [Nmap](https://nmap.org) | Network scanner |
| `sqlmap` | [SQLmap](https://sqlmap.org) | SQL injection |
| `ffuf` | [FFUF](https://github.com/ffuf/ffuf) | Web fuzzer |
| `arjun` | [Arjun](https://github.com/s0md3v/Arjun) | Parameter discovery |
| `smuggler` | [Smuggler](https://github.com/defparam/smuggler) | Request smuggling |
| `wpscan` | [WPScan](https://wpscan.com) | WordPress scanner |
| `nessus` | [Nessus](https://www.tenable.com/products/nessus) | Vulnerability scanner |
| `dalfox` | [Dalfox](https://github.com/hahwul/dalfox) | XSS scanner |
| `zap` | [OWASP ZAP](https://www.zaproxy.org/) | Web app scanner |
| `burpsuite` | [Burp Suite](https://portswigger.net/burp) | Web security testing |

### Exploitation & Password (3)

| MCP Server | Tool | Description |
|------------|------|-------------|
| `metasploit` | [Metasploit](https://www.metasploit.com/) | Exploitation framework |
| `hydra` | [THC-Hydra](https://github.com/vanhauser-thc/thc-hydra) | Password brute force |
| `hashcat` | [Hashcat](https://hashcat.net/hashcat/) | Password cracking |

### Cloud Security (4)

| MCP Server | Tool | Description |
|------------|------|-------------|
| `prowler` | [Prowler](https://github.com/prowler-cloud/prowler) | AWS/Azure/GCP security |
| `scoutsuite` | [ScoutSuite](https://github.com/nccgroup/ScoutSuite) | Cloud auditing |
| `trivy` | [Trivy](https://github.com/aquasecurity/trivy) | Container/IaC scanner |
| `checkov` | [Checkov](https://github.com/bridgecrewio/checkov) | IaC security |

### Kubernetes Security (3)

| MCP Server | Tool | Description |
|------------|------|-------------|
| `kube-hunter` | [kube-hunter](https://github.com/aquasecurity/kube-hunter) | K8s penetration testing |
| `kubeaudit` | [kubeaudit](https://github.com/Shopify/kubeaudit) | K8s security audit |
| `kube-bench` | [kube-bench](https://github.com/aquasecurity/kube-bench) | CIS benchmark |

### Threat Intelligence (3)

| MCP Server | Tool | Description |
|------------|------|-------------|
| `shodan` | [Shodan](https://www.shodan.io/) | Internet search engine |
| `virustotal` | [VirusTotal](https://www.virustotal.com/) | Malware analysis |
| `bloodhound` | [BloodHound](https://github.com/BloodHoundAD/BloodHound) | AD attack paths |

### Code Security (2)

| MCP Server | Tool | Description |
|------------|------|-------------|
| `semgrep` | [Semgrep](https://semgrep.dev/) | Static analysis |
| `gitleaks` | [Gitleaks](https://github.com/gitleaks/gitleaks) | Secret detection |

### Network & AD (2)

| MCP Server | Tool | Description |
|------------|------|-------------|
| `crackmapexec` | [CrackMapExec](https://github.com/byt3bl33d3r/CrackMapExec) | AD/SMB toolkit |
| `ghidra` | [Ghidra](https://ghidra-sre.org/) | Reverse engineering |

### Specialized (7)

| MCP Server | Tool | Description |
|------------|------|-------------|
| `acunetix` | [Acunetix](https://www.acunetix.com/) | Web vulnerability scanner |
| `mobsf` | [MobSF](https://github.com/MobSF/Mobile-Security-Framework-MobSF) | Mobile security |
| `sslscan` | [SSLScan](https://github.com/rbsec/sslscan) | SSL/TLS testing |
| `http-headers` | Custom | Security headers |
| `commix` | [Commix](https://github.com/commixproject/commix) | Command injection |
| `nextjs-scanner` | Custom | Next.js CVE scanner |
| `unified` | All-in-one | Single server for all tools |

---

## Installation

### Prerequisites

- Node.js 18+
- The underlying security tool installed
- Any MCP-compatible client

### Install Individual Server

```bash
# Clone the repository
git clone https://github.com/hackersatyamrastogi/pentesting-cyber-mcp.git
cd pentesting-cyber-mcp

# Install dependencies
pnpm install

# Build all servers
pnpm build

# Or build specific server
cd servers/nmap && pnpm build
```

### Run MCP Server

```bash
# Run nmap MCP server
node servers/nmap/build/index.js /usr/bin/nmap

# Run nuclei MCP server
node servers/nuclei/build/index.js /usr/bin/nuclei

# Run metasploit MCP server
node servers/metasploit/build/index.js msfconsole
```

---

## Configuration

### MCP Client Configuration

Add to your MCP client config:

```json
{
  "mcpServers": {
    "nmap": {
      "command": "node",
      "args": ["path/to/servers/nmap/build/index.js", "/usr/bin/nmap"]
    },
    "nuclei": {
      "command": "node",
      "args": ["path/to/servers/nuclei/build/index.js", "nuclei"]
    },
    "sqlmap": {
      "command": "node",
      "args": ["path/to/servers/sqlmap/build/index.js", "sqlmap"]
    },
    "metasploit": {
      "command": "node",
      "args": ["path/to/servers/metasploit/build/index.js", "msfconsole"]
    }
  }
}
```

### Unified Server (All Tools)

Use the unified server to access all 50 tools through a single MCP connection:

```json
{
  "mcpServers": {
    "security-tools": {
      "command": "node",
      "args": ["path/to/servers/unified/build/index.js"]
    }
  }
}
```

---

## Project Structure

```
pentesting-cyber-mcp/
├── servers/
│   ├── nmap/
│   │   ├── src/index.ts
│   │   ├── package.json
│   │   └── README.md
│   ├── nuclei/
│   ├── sqlmap/
│   ├── metasploit/
│   ├── hydra/
│   ├── hashcat/
│   ├── ... (50 servers)
│   └── unified/
├── scripts/
│   └── generate-config.sh
├── package.json
└── README.md
```

---

## Usage Example

Each MCP server exposes tools that can be called through the MCP protocol:

```typescript
// Example: nmap MCP server exposes these tools
- nmap-scan          // Run port scan
- nmap-service-scan  // Service detection
- nmap-vuln-scan     // Vulnerability scripts

// Example: nuclei MCP server
- do-nuclei          // Run template scan
- get-nuclei-tags    // List available tags

// Example: metasploit MCP server
- msf-search         // Search modules
- msf-exploit-check  // Check vulnerability
- msfvenom-generate  // Generate payload
```

---

## Security Notice

⚠️ **For authorized testing only**

- Obtain proper authorization before scanning
- Some tools require root/admin privileges
- Follow responsible disclosure practices
- Secure your API keys

See [SECURITY.md](SECURITY.md) for details.

---

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md).

**Add a new MCP server:**

```bash
mkdir servers/my-tool
cd servers/my-tool
# Create src/index.ts, package.json, README.md
```

---

## License

MIT License - see [LICENSE](LICENSE)

## Author

**Satyam Rastogi** - [@hackersatyamrastogi](https://github.com/hackersatyamrastogi)

---

<div align="center">

**Pentesting Cyber MCP**

*50 Security Tools • One Protocol*

[![GitHub](https://img.shields.io/badge/GitHub-pentesting--cyber--mcp-black?style=flat&logo=github)](https://github.com/hackersatyamrastogi/pentesting-cyber-mcp)

</div>
