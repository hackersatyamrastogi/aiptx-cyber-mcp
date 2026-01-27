#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { spawn } from "child_process";

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: mcp-notify <path-to-notify-binary>");
  console.error("Example: mcp-notify notify");
  console.error("Example: mcp-notify /usr/local/bin/notify");
  process.exit(1);
}

const notifyBinary = args[0];

const server = new McpServer({
  name: "notify",
  version: "1.0.0",
});

function runNotify(args: string[], input?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(notifyBinary, args);
    let output = "";
    let errorOutput = "";

    if (input) {
      proc.stdin.write(input);
      proc.stdin.end();
    }

    proc.stdout.on("data", (data) => {
      output += data.toString();
    });

    proc.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    proc.on("close", (code) => {
      if (code === 0) {
        resolve(output || "Notification sent successfully");
      } else {
        reject(new Error(errorOutput || `Process exited with code ${code}`));
      }
    });

    proc.on("error", (error) => {
      reject(new Error(`Failed to start notify: ${error.message}`));
    });
  });
}

server.tool(
  "notify-send",
  "Send notifications to configured providers (Slack, Discord, Telegram, etc.)",
  {
    message: z.string().describe("Message to send"),
    providerId: z.string().optional()
      .describe("Specific provider ID from config to use"),
    bulk: z.boolean().optional().default(false)
      .describe("Enable bulk notification mode"),
    silent: z.boolean().optional().default(false)
      .describe("Suppress output"),
  },
  async ({ message, providerId, bulk, silent }) => {
    const args: string[] = [];

    if (providerId) {
      args.push("-provider-id", providerId);
    }

    if (bulk) {
      args.push("-bulk");
    }

    if (silent) {
      args.push("-silent");
    }

    try {
      const result = await runNotify(args, message);
      return {
        content: [{
          type: "text",
          text: `Notification Result:\n${result || "Message sent successfully"}`,
        }],
      };
    } catch (error) {
      throw new Error(`notify failed: ${error}`);
    }
  }
);

server.tool(
  "notify-send-bulk",
  "Send multiple notifications in bulk",
  {
    messages: z.array(z.string()).describe("List of messages to send"),
    providerId: z.string().optional()
      .describe("Specific provider ID to use"),
    delay: z.number().optional().default(0)
      .describe("Delay between messages in seconds"),
  },
  async ({ messages, providerId, delay }) => {
    const args: string[] = ["-bulk"];

    if (providerId) {
      args.push("-provider-id", providerId);
    }

    if (delay > 0) {
      args.push("-delay", delay.toString());
    }

    try {
      const result = await runNotify(args, messages.join("\n"));
      return {
        content: [{
          type: "text",
          text: `Bulk Notification Result:\nSent ${messages.length} messages\n${result}`,
        }],
      };
    } catch (error) {
      throw new Error(`notify bulk send failed: ${error}`);
    }
  }
);

server.tool(
  "notify-scan-results",
  "Send security scan results as formatted notifications",
  {
    toolName: z.string().describe("Name of the security tool (e.g., nuclei, nmap)"),
    target: z.string().describe("Scan target"),
    findings: z.array(z.object({
      severity: z.enum(["critical", "high", "medium", "low", "info"]).optional(),
      title: z.string(),
      description: z.string().optional(),
    })).describe("List of findings to report"),
    providerId: z.string().optional()
      .describe("Specific provider ID to use"),
  },
  async ({ toolName, target, findings, providerId }) => {
    const severityEmoji: Record<string, string> = {
      critical: "🔴",
      high: "🟠",
      medium: "🟡",
      low: "🔵",
      info: "⚪",
    };

    const formattedFindings = findings.map((f) => {
      const emoji = f.severity ? severityEmoji[f.severity] : "📌";
      const sev = f.severity ? `[${f.severity.toUpperCase()}]` : "";
      return `${emoji} ${sev} ${f.title}${f.description ? `\n   ${f.description}` : ""}`;
    }).join("\n\n");

    const message = `🔍 **${toolName.toUpperCase()} Scan Results**
Target: ${target}
Findings: ${findings.length}

${formattedFindings}`;

    const args: string[] = [];
    if (providerId) {
      args.push("-provider-id", providerId);
    }

    try {
      const result = await runNotify(args, message);
      return {
        content: [{
          type: "text",
          text: `Scan results notification sent:\n${result || "Success"}`,
        }],
      };
    } catch (error) {
      throw new Error(`notify scan results failed: ${error}`);
    }
  }
);

server.tool(
  "notify-providers",
  "List available notification providers and their configuration status",
  {},
  async () => {
    const providers = `Available Notify Providers:

CHAT PLATFORMS:
  - slack         - Slack webhooks/bot
  - discord       - Discord webhooks
  - telegram      - Telegram bot API
  - teams         - Microsoft Teams webhooks
  - pushover      - Pushover notifications
  - gotify        - Gotify server

EMAIL:
  - smtp          - Email via SMTP

CUSTOM:
  - custom        - Custom webhook endpoints

Configure providers in ~/.config/notify/provider-config.yaml

Example config:
  slack:
    - id: "security-alerts"
      slack_webhook_url: "https://hooks.slack.com/services/xxx"

  discord:
    - id: "bug-bounty"
      discord_webhook_url: "https://discord.com/api/webhooks/xxx"

  telegram:
    - id: "personal"
      telegram_api_key: "xxx"
      telegram_chat_id: "xxx"`;

    return {
      content: [{ type: "text", text: providers }],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("notify MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
