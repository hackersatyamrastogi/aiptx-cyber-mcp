#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { spawn } from "child_process";

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: mcp-hydra <path-to-hydra-binary>");
  console.error("Example: mcp-hydra hydra");
  console.error("Example: mcp-hydra /usr/bin/hydra");
  process.exit(1);
}

const hydraBinary = args[0];

const server = new McpServer({
  name: "hydra",
  version: "1.0.0",
});

function runHydra(args: string[], timeout: number = 300000): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(hydraBinary, args, { timeout });

    let output = "";
    let errorOutput = "";

    proc.stdout.on("data", (data) => {
      output += data.toString();
    });

    proc.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    proc.on("close", (code) => {
      // Hydra may return various codes
      resolve(output + errorOutput);
    });

    proc.on("error", (error) => {
      reject(new Error(`Failed to start hydra: ${error.message}`));
    });
  });
}

server.tool(
  "hydra-attack",
  "Perform online password attack against a service (for authorized testing only)",
  {
    target: z.string().describe("Target IP or hostname"),
    service: z.enum([
      "ssh", "ftp", "telnet", "smtp", "http-get", "http-post", "http-get-form",
      "http-post-form", "https-get", "https-post", "mysql", "mssql", "postgres",
      "rdp", "vnc", "smb", "ldap", "pop3", "imap", "snmp"
    ]).describe("Service/protocol to attack"),
    port: z.number().optional().describe("Target port (uses default if not specified)"),
    username: z.string().optional().describe("Single username to test"),
    userList: z.string().optional().describe("Path to username wordlist"),
    password: z.string().optional().describe("Single password to test"),
    passwordList: z.string().optional().describe("Path to password wordlist"),
    threads: z.number().optional().default(16).describe("Number of parallel tasks"),
    timeout: z.number().optional().default(30).describe("Timeout per connection attempt"),
    verbose: z.boolean().optional().default(false).describe("Show verbose output"),
  },
  async ({ target, service, port, username, userList, password, passwordList, threads, timeout, verbose }) => {
    const args: string[] = [];

    // Username options
    if (username) {
      args.push("-l", username);
    } else if (userList) {
      args.push("-L", userList);
    } else {
      throw new Error("Either username or userList must be provided");
    }

    // Password options
    if (password) {
      args.push("-p", password);
    } else if (passwordList) {
      args.push("-P", passwordList);
    } else {
      throw new Error("Either password or passwordList must be provided");
    }

    // Other options
    args.push("-t", threads.toString());
    args.push("-W", timeout.toString());

    if (verbose) {
      args.push("-V");
    }

    // Target and service
    if (port) {
      args.push("-s", port.toString());
    }

    args.push(target);
    args.push(service);

    try {
      const output = await runHydra(args, 600000); // 10 min timeout

      // Parse results
      const foundCreds = output.match(/\[.*?\].*?login:.*?password:.*/g) || [];

      return {
        content: [{
          type: "text",
          text: `Hydra Attack Results:\nTarget: ${target}\nService: ${service}\n\n${output}\n\nFound Credentials: ${foundCreds.length}`,
        }],
      };
    } catch (error) {
      throw new Error(`hydra attack failed: ${error}`);
    }
  }
);

server.tool(
  "hydra-http-form",
  "Attack HTTP login forms (GET or POST)",
  {
    target: z.string().describe("Target hostname/IP"),
    port: z.number().optional().default(80).describe("Target port"),
    ssl: z.boolean().optional().default(false).describe("Use HTTPS"),
    method: z.enum(["get", "post"]).default("post").describe("HTTP method"),
    path: z.string().describe("Login form path (e.g., '/login.php')"),
    formParams: z.string().describe("Form parameters (e.g., 'user=^USER^&pass=^PASS^')"),
    failString: z.string().describe("String that indicates failed login"),
    userList: z.string().describe("Path to username wordlist"),
    passwordList: z.string().describe("Path to password wordlist"),
    threads: z.number().optional().default(16).describe("Parallel tasks"),
  },
  async ({ target, port, ssl, method, path, formParams, failString, userList, passwordList, threads }) => {
    const service = ssl
      ? (method === "post" ? "https-post-form" : "https-get-form")
      : (method === "post" ? "http-post-form" : "http-get-form");

    const formString = `${path}:${formParams}:${failString}`;

    const args = [
      "-L", userList,
      "-P", passwordList,
      "-t", threads.toString(),
      "-s", port.toString(),
      target,
      service,
      formString,
    ];

    try {
      const output = await runHydra(args, 600000);

      return {
        content: [{
          type: "text",
          text: `HTTP Form Attack Results:\nTarget: ${target}${path}\nMethod: ${method.toUpperCase()}\n\n${output}`,
        }],
      };
    } catch (error) {
      throw new Error(`hydra HTTP form attack failed: ${error}`);
    }
  }
);

server.tool(
  "hydra-ssh",
  "Perform SSH brute force attack",
  {
    target: z.string().describe("Target IP or hostname"),
    port: z.number().optional().default(22).describe("SSH port"),
    userList: z.string().describe("Path to username wordlist"),
    passwordList: z.string().describe("Path to password wordlist"),
    threads: z.number().optional().default(4).describe("Parallel tasks (keep low for SSH)"),
  },
  async ({ target, port, userList, passwordList, threads }) => {
    const args = [
      "-L", userList,
      "-P", passwordList,
      "-t", threads.toString(),
      "-s", port.toString(),
      "-V",
      target,
      "ssh",
    ];

    try {
      const output = await runHydra(args, 900000); // 15 min for SSH

      return {
        content: [{
          type: "text",
          text: `SSH Brute Force Results:\nTarget: ${target}:${port}\n\n${output}`,
        }],
      };
    } catch (error) {
      throw new Error(`hydra SSH attack failed: ${error}`);
    }
  }
);

server.tool(
  "hydra-smb",
  "Perform SMB/Windows authentication brute force",
  {
    target: z.string().describe("Target IP or hostname"),
    domain: z.string().optional().describe("Windows domain"),
    userList: z.string().describe("Path to username wordlist"),
    passwordList: z.string().describe("Path to password wordlist"),
    threads: z.number().optional().default(8).describe("Parallel tasks"),
  },
  async ({ target, domain, userList, passwordList, threads }) => {
    const args = [
      "-L", userList,
      "-P", passwordList,
      "-t", threads.toString(),
      "-V",
    ];

    if (domain) {
      args.push("-m", `DOMAIN:${domain}`);
    }

    args.push(target, "smb");

    try {
      const output = await runHydra(args, 600000);

      return {
        content: [{
          type: "text",
          text: `SMB Brute Force Results:\nTarget: ${target}\nDomain: ${domain || "N/A"}\n\n${output}`,
        }],
      };
    } catch (error) {
      throw new Error(`hydra SMB attack failed: ${error}`);
    }
  }
);

server.tool(
  "hydra-services",
  "List all supported services and protocols",
  {},
  async () => {
    const services = `Hydra Supported Services:

REMOTE ACCESS:
  ssh         - Secure Shell
  telnet      - Telnet
  rdp         - Remote Desktop Protocol
  vnc         - Virtual Network Computing
  rsh         - Remote Shell
  rexec       - Remote Execution
  rlogin      - Remote Login

WEB:
  http-get         - HTTP GET basic auth
  http-post        - HTTP POST basic auth
  http-get-form    - HTTP GET form login
  http-post-form   - HTTP POST form login
  https-get        - HTTPS GET
  https-post       - HTTPS POST
  https-get-form   - HTTPS GET form
  https-post-form  - HTTPS POST form

EMAIL:
  smtp        - SMTP authentication
  pop3        - POP3
  imap        - IMAP
  pop3s       - POP3 over SSL
  imaps       - IMAP over SSL

FILE TRANSFER:
  ftp         - FTP
  ftps        - FTP over SSL
  smb         - SMB/CIFS
  smb2        - SMBv2

DATABASE:
  mysql       - MySQL
  mssql       - Microsoft SQL Server
  postgres    - PostgreSQL
  oracle      - Oracle
  mongodb     - MongoDB

DIRECTORY:
  ldap        - LDAP
  ldaps       - LDAP over SSL

OTHER:
  snmp        - SNMP community strings
  socks5      - SOCKS5 proxy
  cisco       - Cisco devices
  cisco-enable - Cisco enable password

Form Syntax:
  http-post-form "/login:user=^USER^&pass=^PASS^:Invalid"
  - ^USER^ = username placeholder
  - ^PASS^ = password placeholder
  - Last part = failure string`;

    return {
      content: [{ type: "text", text: services }],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("hydra MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
