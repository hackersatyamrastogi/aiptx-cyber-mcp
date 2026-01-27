# kube-bench MCP Server

MCP server for [kube-bench](https://github.com/aquasecurity/kube-bench) - Check Kubernetes clusters against CIS Benchmarks.

## Features

- **CIS Benchmarks**: Run official CIS Kubernetes Benchmark checks
- **Target Specific**: Master, node, etcd, policies
- **Managed Services**: EKS, GKE, AKS support
- **Compliance Reports**: JSON/JUnit output for CI/CD
- **Summary Statistics**: Pass/fail/warn counts

## Installation

```bash
npm install @mcp-security/kube-bench
```

## Prerequisites

Install kube-bench:
```bash
# From releases
# https://github.com/aquasecurity/kube-bench/releases

# Or use Docker
docker pull aquasec/kube-bench
```

## Usage

```bash
mcp-kube-bench /path/to/kube-bench
```

## Available Tools

| Tool | Description |
|------|-------------|
| `kubebench-run` | Run CIS benchmark checks |
| `kubebench-master` | Master node checks |
| `kubebench-node` | Worker node checks |
| `kubebench-etcd` | etcd security checks |
| `kubebench-policies` | Policy checks |
| `kubebench-json` | JSON output mode |
| `kubebench-managed` | EKS/GKE/AKS checks |
| `kubebench-summary` | Compliance summary |
| `kubebench-checks` | List check categories |

## Supported Benchmarks

- CIS Kubernetes Benchmark v1.6/1.7/1.8
- CIS Amazon EKS Benchmark
- CIS Google GKE Benchmark
- CIS Azure AKS Benchmark
- Red Hat OpenShift

## Result States

- **PASS**: Check passed
- **FAIL**: Check failed (action required)
- **WARN**: Manual verification needed
- **INFO**: Informational

## License

MIT
