#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { spawn, execSync } from "child_process";

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: mcp-metasploit <path-to-msfconsole>");
  console.error("Example: mcp-metasploit msfconsole");
  console.error("Example: mcp-metasploit /opt/metasploit/msfconsole");
  process.exit(1);
}

const msfconsoleBinary = args[0];

const server = new McpServer({
  name: "metasploit",
  version: "1.0.0",
});

function runMsfconsole(commands: string[], timeout: number = 120000): Promise<string> {
  return new Promise((resolve, reject) => {
    const commandStr = commands.join("; ") + "; exit";
    const proc = spawn(msfconsoleBinary, ["-q", "-x", commandStr], {
      timeout,
    });

    let output = "";
    let errorOutput = "";

    proc.stdout.on("data", (data) => {
      output += data.toString();
    });

    proc.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    proc.on("close", (code) => {
      // Metasploit may return non-zero codes for various reasons
      resolve(output || errorOutput);
    });

    proc.on("error", (error) => {
      reject(new Error(`Failed to start msfconsole: ${error.message}`));
    });

    // Set timeout
    setTimeout(() => {
      proc.kill("SIGTERM");
      resolve(output + "\n[TIMEOUT - Command execution exceeded time limit]");
    }, timeout);
  });
}

function runMsfvenom(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const msfvenomBinary = msfconsoleBinary.replace("msfconsole", "msfvenom");
    const proc = spawn(msfvenomBinary, args);

    let output = "";
    let errorOutput = "";

    proc.stdout.on("data", (data) => {
      output += data.toString();
    });

    proc.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    proc.on("close", (code) => {
      if (code === 0 || output) {
        resolve(output);
      } else {
        reject(new Error(errorOutput || `msfvenom exited with code ${code}`));
      }
    });

    proc.on("error", (error) => {
      reject(new Error(`Failed to start msfvenom: ${error.message}`));
    });
  });
}

server.tool(
  "msf-search",
  "Search for Metasploit modules (exploits, auxiliary, payloads)",
  {
    query: z.string().describe("Search query (e.g., 'type:exploit name:smb')"),
    moduleType: z.enum(["exploit", "auxiliary", "post", "payload", "encoder", "nop"]).optional()
      .describe("Filter by module type"),
  },
  async ({ query, moduleType }) => {
    let searchCmd = `search ${query}`;
    if (moduleType) {
      searchCmd = `search type:${moduleType} ${query}`;
    }

    try {
      const output = await runMsfconsole([searchCmd], 60000);
      return {
        content: [{
          type: "text",
          text: `Metasploit Search Results:\n\n${output}`,
        }],
      };
    } catch (error) {
      throw new Error(`msf search failed: ${error}`);
    }
  }
);

server.tool(
  "msf-info",
  "Get detailed information about a Metasploit module",
  {
    modulePath: z.string().describe("Full module path (e.g., 'exploit/windows/smb/ms17_010_eternalblue')"),
  },
  async ({ modulePath }) => {
    try {
      const output = await runMsfconsole([`info ${modulePath}`], 60000);
      return {
        content: [{
          type: "text",
          text: `Module Information:\n\n${output}`,
        }],
      };
    } catch (error) {
      throw new Error(`msf info failed: ${error}`);
    }
  }
);

server.tool(
  "msf-exploit-check",
  "Check if a target is vulnerable without exploiting (safe check)",
  {
    modulePath: z.string().describe("Exploit module path"),
    rhosts: z.string().describe("Target host(s) - IP or CIDR"),
    rport: z.number().optional().describe("Target port (if different from default)"),
    additionalOptions: z.record(z.string()).optional()
      .describe("Additional module options as key-value pairs"),
  },
  async ({ modulePath, rhosts, rport, additionalOptions }) => {
    const commands = [
      `use ${modulePath}`,
      `set RHOSTS ${rhosts}`,
    ];

    if (rport) {
      commands.push(`set RPORT ${rport}`);
    }

    if (additionalOptions) {
      for (const [key, value] of Object.entries(additionalOptions)) {
        commands.push(`set ${key} ${value}`);
      }
    }

    commands.push("check");

    try {
      const output = await runMsfconsole(commands, 120000);
      return {
        content: [{
          type: "text",
          text: `Vulnerability Check Results:\nModule: ${modulePath}\nTarget: ${rhosts}\n\n${output}`,
        }],
      };
    } catch (error) {
      throw new Error(`msf check failed: ${error}`);
    }
  }
);

server.tool(
  "msf-auxiliary-scan",
  "Run an auxiliary scanner module",
  {
    modulePath: z.string().describe("Auxiliary module path (e.g., 'auxiliary/scanner/smb/smb_version')"),
    rhosts: z.string().describe("Target host(s) - IP, CIDR, or range"),
    threads: z.number().optional().default(10)
      .describe("Number of concurrent threads"),
    additionalOptions: z.record(z.string()).optional()
      .describe("Additional module options"),
  },
  async ({ modulePath, rhosts, threads, additionalOptions }) => {
    const commands = [
      `use ${modulePath}`,
      `set RHOSTS ${rhosts}`,
      `set THREADS ${threads}`,
    ];

    if (additionalOptions) {
      for (const [key, value] of Object.entries(additionalOptions)) {
        commands.push(`set ${key} ${value}`);
      }
    }

    commands.push("run");

    try {
      const output = await runMsfconsole(commands, 300000); // 5 min timeout for scans
      return {
        content: [{
          type: "text",
          text: `Auxiliary Scan Results:\nModule: ${modulePath}\nTarget: ${rhosts}\n\n${output}`,
        }],
      };
    } catch (error) {
      throw new Error(`msf auxiliary scan failed: ${error}`);
    }
  }
);

server.tool(
  "msfvenom-generate",
  "Generate payloads using msfvenom",
  {
    payload: z.string().describe("Payload to use (e.g., 'windows/meterpreter/reverse_tcp')"),
    format: z.string().describe("Output format (exe, elf, raw, python, powershell, etc.)"),
    lhost: z.string().describe("Listener host (your IP)"),
    lport: z.number().describe("Listener port"),
    outputFile: z.string().optional().describe("Output file path"),
    encoder: z.string().optional().describe("Encoder to use (e.g., 'x86/shikata_ga_nai')"),
    iterations: z.number().optional().default(1).describe("Encoding iterations"),
    badChars: z.string().optional().describe("Characters to avoid (e.g., '\\x00\\x0a')"),
  },
  async ({ payload, format, lhost, lport, outputFile, encoder, iterations, badChars }) => {
    const args = [
      "-p", payload,
      `LHOST=${lhost}`,
      `LPORT=${lport}`,
      "-f", format,
    ];

    if (encoder) {
      args.push("-e", encoder);
      args.push("-i", iterations.toString());
    }

    if (badChars) {
      args.push("-b", badChars);
    }

    if (outputFile) {
      args.push("-o", outputFile);
    }

    try {
      const output = await runMsfvenom(args);

      const result = outputFile
        ? `Payload generated and saved to: ${outputFile}\n\n${output}`
        : `Generated Payload:\n\n${output}`;

      return {
        content: [{
          type: "text",
          text: result,
        }],
      };
    } catch (error) {
      throw new Error(`msfvenom failed: ${error}`);
    }
  }
);

server.tool(
  "msfvenom-list",
  "List available payloads, formats, or encoders",
  {
    listType: z.enum(["payloads", "formats", "encoders", "platforms", "archs"])
      .describe("What to list"),
    filter: z.string().optional()
      .describe("Filter results (e.g., 'windows' for Windows payloads)"),
  },
  async ({ listType, filter }) => {
    const args = ["-l", listType];

    try {
      const output = await runMsfvenom(args);

      let filteredOutput = output;
      if (filter) {
        const lines = output.split("\n");
        filteredOutput = lines.filter(line =>
          line.toLowerCase().includes(filter.toLowerCase())
        ).join("\n");
      }

      return {
        content: [{
          type: "text",
          text: `Metasploit ${listType}:\n\n${filteredOutput}`,
        }],
      };
    } catch (error) {
      throw new Error(`msfvenom list failed: ${error}`);
    }
  }
);

server.tool(
  "msf-db-nmap",
  "Run nmap scan and import results into Metasploit database",
  {
    targets: z.string().describe("Target specification for nmap"),
    nmapArgs: z.string().optional().default("-sV -sC")
      .describe("Additional nmap arguments"),
  },
  async ({ targets, nmapArgs }) => {
    const commands = [
      `db_nmap ${nmapArgs} ${targets}`,
      "hosts",
      "services",
    ];

    try {
      const output = await runMsfconsole(commands, 600000); // 10 min for nmap
      return {
        content: [{
          type: "text",
          text: `Nmap Scan Results (imported to MSF db):\n\n${output}`,
        }],
      };
    } catch (error) {
      throw new Error(`msf db_nmap failed: ${error}`);
    }
  }
);

server.tool(
  "msf-common-modules",
  "Get a list of commonly used Metasploit modules by category",
  {},
  async () => {
    const modules = `Common Metasploit Modules:

EXPLOITATION:
  exploit/windows/smb/ms17_010_eternalblue     - EternalBlue SMB RCE
  exploit/windows/smb/ms08_067_netapi          - Conficker vulnerability
  exploit/multi/http/apache_mod_cgi_bash_env   - Shellshock
  exploit/unix/ftp/vsftpd_234_backdoor         - vsFTPd backdoor
  exploit/multi/handler                         - Generic payload handler

SCANNING:
  auxiliary/scanner/portscan/tcp               - TCP port scanner
  auxiliary/scanner/smb/smb_version            - SMB version detection
  auxiliary/scanner/smb/smb_ms17_010           - EternalBlue checker
  auxiliary/scanner/ssh/ssh_version            - SSH version scanner
  auxiliary/scanner/http/http_version          - HTTP server info
  auxiliary/scanner/ftp/ftp_version            - FTP banner grab
  auxiliary/scanner/mysql/mysql_version        - MySQL version
  auxiliary/scanner/rdp/rdp_scanner            - RDP detection

CREDENTIAL ATTACKS:
  auxiliary/scanner/ssh/ssh_login              - SSH brute force
  auxiliary/scanner/smb/smb_login              - SMB brute force
  auxiliary/scanner/ftp/ftp_login              - FTP brute force
  auxiliary/scanner/mysql/mysql_login          - MySQL brute force

POST EXPLOITATION:
  post/windows/gather/hashdump                 - Dump password hashes
  post/multi/gather/env                        - Environment variables
  post/windows/gather/enum_logged_on_users     - Logged on users
  post/linux/gather/enum_system                - Linux system info

PAYLOADS:
  windows/meterpreter/reverse_tcp              - Windows Meterpreter
  linux/x64/meterpreter/reverse_tcp            - Linux Meterpreter
  cmd/unix/reverse_bash                        - Bash reverse shell
  windows/shell/reverse_tcp                    - Windows cmd shell`;

    return {
      content: [{ type: "text", text: modules }],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("metasploit MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
