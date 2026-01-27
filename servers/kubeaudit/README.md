# kubeaudit MCP Server

MCP server for [kubeaudit](https://github.com/Shopify/kubeaudit) - Kubernetes security auditing tool by Shopify.

## Features

- **Security Checks**: Privileged containers, root users, capabilities
- **Resource Limits**: Detect missing CPU/memory limits
- **Host Isolation**: Check host namespace access
- **Image Security**: Verify image tags and pull policies
- **Manifest Auditing**: Audit YAML files before deployment

## Installation

```bash
npm install @mcp-security/kubeaudit
```

## Prerequisites

Install kubeaudit:
```bash
# macOS
brew install kubeaudit

# From releases
# https://github.com/Shopify/kubeaudit/releases
```

## Usage

```bash
mcp-kubeaudit /path/to/kubeaudit
```

## Available Tools

| Tool | Description |
|------|-------------|
| `kubeaudit-all` | Run all security checks |
| `kubeaudit-privileged` | Check privileged containers |
| `kubeaudit-rootfs` | Check read-only root filesystem |
| `kubeaudit-capabilities` | Check dangerous capabilities |
| `kubeaudit-limits` | Check resource limits |
| `kubeaudit-nonroot` | Check for root users |
| `kubeaudit-hostns` | Check host namespace access |
| `kubeaudit-image` | Check image security |
| `kubeaudit-manifest` | Audit manifest files |
| `kubeaudit-checks` | List all checks |

## Security Checks

- Privileged containers
- Root user execution
- Dangerous capabilities
- Host namespace access
- Missing resource limits
- Image tag policies
- Service account tokens

## License

MIT
