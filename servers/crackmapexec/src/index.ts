#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { spawn } from "child_process";

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: mcp-crackmapexec <path-to-cme-binary>");
  console.error("Example: mcp-crackmapexec crackmapexec");
  console.error("Example: mcp-crackmapexec cme");
  console.error("Example: mcp-crackmapexec netexec");
  process.exit(1);
}

const cmeBinary = args[0];

const server = new McpServer({
  name: "crackmapexec",
  version: "1.0.0",
});

function runCme(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmeBinary, args);
    let output = "";
    let errorOutput = "";

    proc.stdout.on("data", (data) => {
      output += data.toString();
    });

    proc.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    proc.on("close", (_code) => {
      // CME may return non-zero for various reasons
      resolve(output || errorOutput);
    });

    proc.on("error", (error) => {
      reject(new Error(`Failed to start crackmapexec: ${error.message}`));
    });
  });
}

server.tool(
  "cme-smb-enum",
  "Enumerate SMB shares and information on target hosts",
  {
    target: z.string().describe("Target IP, hostname, or CIDR range"),
    username: z.string().optional().describe("Username for authentication"),
    password: z.string().optional().describe("Password for authentication"),
    domain: z.string().optional().describe("Domain name"),
    shares: z.boolean().optional().default(true).describe("Enumerate shares"),
    sessions: z.boolean().optional().default(false).describe("Enumerate active sessions"),
    users: z.boolean().optional().default(false).describe("Enumerate domain users"),
  },
  async ({ target, username, password, domain, shares, sessions, users }) => {
    const args = ["smb", target];

    if (username && password) {
      args.push("-u", username, "-p", password);
    }

    if (domain) {
      args.push("-d", domain);
    }

    if (shares) {
      args.push("--shares");
    }

    if (sessions) {
      args.push("--sessions");
    }

    if (users) {
      args.push("--users");
    }

    try {
      const output = await runCme(args);

      return {
        content: [{ type: "text", text: output }],
      };
    } catch (error) {
      throw new Error(`SMB enumeration failed: ${error}`);
    }
  }
);

server.tool(
  "cme-smb-spray",
  "Perform password spraying against SMB",
  {
    target: z.string().describe("Target IP, hostname, or CIDR range"),
    userList: z.array(z.string()).describe("List of usernames to test"),
    password: z.string().describe("Password to spray"),
    domain: z.string().optional().describe("Domain name"),
    continueOnSuccess: z.boolean().optional().default(false)
      .describe("Continue spraying after finding valid credentials"),
  },
  async ({ target, userList, password, domain, continueOnSuccess }) => {
    const args = ["smb", target, "-u"];
    args.push(...userList);
    args.push("-p", password);

    if (domain) {
      args.push("-d", domain);
    }

    if (continueOnSuccess) {
      args.push("--continue-on-success");
    }

    try {
      const output = await runCme(args);

      // Parse results to highlight successful authentications
      const lines = output.split("\n");
      const successes = lines.filter(line =>
        line.includes("[+]") || line.includes("Pwn3d!")
      );

      return {
        content: [
          {
            type: "text",
            text: `Password Spray Results:\n\nSuccessful: ${successes.length}\n\n${output}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Password spray failed: ${error}`);
    }
  }
);

server.tool(
  "cme-winrm",
  "Execute commands via WinRM",
  {
    target: z.string().describe("Target IP or hostname"),
    username: z.string().describe("Username"),
    password: z.string().describe("Password"),
    domain: z.string().optional().describe("Domain name"),
    command: z.string().optional().describe("Command to execute"),
  },
  async ({ target, username, password, domain, command }) => {
    const args = ["winrm", target, "-u", username, "-p", password];

    if (domain) {
      args.push("-d", domain);
    }

    if (command) {
      args.push("-x", command);
    }

    try {
      const output = await runCme(args);

      return {
        content: [{ type: "text", text: output }],
      };
    } catch (error) {
      throw new Error(`WinRM execution failed: ${error}`);
    }
  }
);

server.tool(
  "cme-ldap",
  "Query LDAP/Active Directory",
  {
    target: z.string().describe("Domain controller IP or hostname"),
    username: z.string().describe("Username"),
    password: z.string().describe("Password"),
    domain: z.string().optional().describe("Domain name"),
    query: z.enum(["users", "groups", "computers", "trusts", "asreproast", "kerberoast"]).optional()
      .describe("Type of LDAP query to perform"),
  },
  async ({ target, username, password, domain, query }) => {
    const args = ["ldap", target, "-u", username, "-p", password];

    if (domain) {
      args.push("-d", domain);
    }

    switch (query) {
      case "users":
        args.push("--users");
        break;
      case "groups":
        args.push("--groups");
        break;
      case "computers":
        args.push("--computers");
        break;
      case "trusts":
        args.push("--trusts");
        break;
      case "asreproast":
        args.push("--asreproast", "/dev/stdout");
        break;
      case "kerberoast":
        args.push("--kerberoasting", "/dev/stdout");
        break;
    }

    try {
      const output = await runCme(args);

      return {
        content: [{ type: "text", text: output }],
      };
    } catch (error) {
      throw new Error(`LDAP query failed: ${error}`);
    }
  }
);

server.tool(
  "cme-mssql",
  "Interact with Microsoft SQL Server",
  {
    target: z.string().describe("Target IP or hostname"),
    username: z.string().describe("Username"),
    password: z.string().describe("Password"),
    domain: z.string().optional().describe("Domain name"),
    query: z.string().optional().describe("SQL query to execute"),
    localAuth: z.boolean().optional().default(false)
      .describe("Use local authentication instead of domain"),
  },
  async ({ target, username, password, domain, query, localAuth }) => {
    const args = ["mssql", target, "-u", username, "-p", password];

    if (domain) {
      args.push("-d", domain);
    }

    if (localAuth) {
      args.push("--local-auth");
    }

    if (query) {
      args.push("-q", query);
    }

    try {
      const output = await runCme(args);

      return {
        content: [{ type: "text", text: output }],
      };
    } catch (error) {
      throw new Error(`MSSQL operation failed: ${error}`);
    }
  }
);

server.tool(
  "cme-protocols",
  "List supported protocols and modules",
  {},
  async () => {
    const protocols = `CrackMapExec/NetExec Supported Protocols:

PROTOCOLS:
  smb     - SMB protocol (file shares, authentication, command execution)
  winrm   - Windows Remote Management (PowerShell remoting)
  ldap    - LDAP/Active Directory queries
  mssql   - Microsoft SQL Server
  ssh     - SSH protocol
  rdp     - Remote Desktop Protocol
  wmi     - Windows Management Instrumentation
  ftp     - FTP protocol

COMMON MODULES (SMB):
  --shares          - Enumerate shares
  --sessions        - Enumerate active sessions
  --disks           - Enumerate disks
  --loggedon-users  - Enumerate logged on users
  --users           - Enumerate domain users
  --groups          - Enumerate local groups
  --local-groups    - Enumerate local group membership
  --pass-pol        - Get password policy
  --rid-brute       - RID cycling for user enumeration
  --sam             - Dump SAM hashes
  --lsa             - Dump LSA secrets
  --ntds            - Dump NTDS.dit (Domain Controller)

AUTHENTICATION OPTIONS:
  -u USER           - Username
  -p PASS           - Password
  -H HASH           - NTLM hash (pass-the-hash)
  -d DOMAIN         - Domain name
  --local-auth      - Use local authentication

EXECUTION MODULES:
  -x CMD            - Execute command
  -X PS_CMD         - Execute PowerShell command
  --exec-method     - Execution method (smbexec, wmiexec, atexec, mmcexec)`;

    return {
      content: [{ type: "text", text: protocols }],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("CrackMapExec MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
