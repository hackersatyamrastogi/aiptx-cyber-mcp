# notify MCP Server

MCP server for [notify](https://github.com/projectdiscovery/notify) - Stream scan results to multiple notification platforms.

## Features

- **Multi-Platform**: Send to Slack, Discord, Telegram, Teams, and more
- **Bulk Notifications**: Send multiple messages efficiently
- **Security Alerts**: Formatted scan result notifications
- **Provider Management**: Configure and manage notification providers

## Installation

```bash
npm install @mcp-security/notify
```

## Prerequisites

Install notify:
```bash
go install -v github.com/projectdiscovery/notify/cmd/notify@latest
```

Configure providers in `~/.config/notify/provider-config.yaml`

## Usage

```bash
mcp-notify /path/to/notify
```

## Available Tools

| Tool | Description |
|------|-------------|
| `notify-send` | Send notification to configured providers |
| `notify-send-bulk` | Send multiple notifications |
| `notify-scan-results` | Send formatted security scan results |
| `notify-providers` | List available providers |

## Example Configuration

```yaml
slack:
  - id: "security-alerts"
    slack_webhook_url: "https://hooks.slack.com/services/xxx"

discord:
  - id: "bug-bounty"
    discord_webhook_url: "https://discord.com/api/webhooks/xxx"
```

## License

MIT
