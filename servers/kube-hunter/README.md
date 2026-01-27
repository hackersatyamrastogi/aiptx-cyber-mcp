# kube-hunter MCP Server

MCP server for [kube-hunter](https://github.com/aquasecurity/kube-hunter) - Hunt for security weaknesses in Kubernetes clusters.

## Features

- **Remote Scanning**: Scan external Kubernetes API surfaces
- **Internal Scanning**: Run from within pods
- **Network Discovery**: Find K8s clusters in network ranges
- **Active Hunting**: Optional exploitation mode
- **CVE Detection**: Check for known vulnerabilities

## Installation

```bash
npm install @mcp-security/kube-hunter
```

## Prerequisites

Install kube-hunter:
```bash
pip install kube-hunter
```

Or use Docker:
```bash
docker pull aquasec/kube-hunter
```

## Usage

```bash
mcp-kube-hunter kube-hunter
# or
mcp-kube-hunter "python -m kube_hunter"
```

## Available Tools

| Tool | Description |
|------|-------------|
| `kubehunter-remote` | Scan remote K8s clusters |
| `kubehunter-pod` | Internal scan from pod |
| `kubehunter-json` | JSON output mode |
| `kubehunter-network` | Network CIDR scanning |
| `kubehunter-vulnerabilities` | List checked vulnerabilities |

## Scan Modes

- **Passive (default)**: Safe information gathering
- **Active**: Attempts exploitation (use with caution)

## License

MIT
