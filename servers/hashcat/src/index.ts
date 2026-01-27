#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { spawn } from "child_process";

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: mcp-hashcat <path-to-hashcat-binary>");
  console.error("Example: mcp-hashcat hashcat");
  console.error("Example: mcp-hashcat /usr/bin/hashcat");
  process.exit(1);
}

const hashcatBinary = args[0];

const server = new McpServer({
  name: "hashcat",
  version: "1.0.0",
});

function runHashcat(args: string[], timeout: number = 3600000): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(hashcatBinary, args, { timeout });

    let output = "";
    let errorOutput = "";

    proc.stdout.on("data", (data) => {
      output += data.toString();
    });

    proc.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    proc.on("close", (code) => {
      // Hashcat returns various codes (0=cracked, 1=exhausted, etc)
      resolve(output + errorOutput);
    });

    proc.on("error", (error) => {
      reject(new Error(`Failed to start hashcat: ${error.message}`));
    });
  });
}

server.tool(
  "hashcat-crack",
  "Crack password hashes using various attack modes",
  {
    hashFile: z.string().describe("Path to file containing hashes"),
    hashType: z.number().describe("Hash type code (e.g., 0=MD5, 1000=NTLM, 1800=sha512crypt)"),
    attackMode: z.enum(["dictionary", "combinator", "bruteforce", "hybrid-dict-mask", "hybrid-mask-dict"])
      .describe("Attack mode to use"),
    wordlist: z.string().optional().describe("Path to wordlist (for dictionary/hybrid modes)"),
    mask: z.string().optional().describe("Mask pattern for brute force (e.g., ?a?a?a?a?a?a)"),
    rules: z.string().optional().describe("Path to rules file"),
    outputFile: z.string().optional().describe("Output file for cracked hashes"),
    workloadProfile: z.number().optional().default(3).describe("Workload profile (1=low, 2=default, 3=high, 4=nightmare)"),
    potfileDisable: z.boolean().optional().default(false).describe("Disable potfile"),
  },
  async ({ hashFile, hashType, attackMode, wordlist, mask, rules, outputFile, workloadProfile, potfileDisable }) => {
    const modeMap: Record<string, string> = {
      "dictionary": "0",
      "combinator": "1",
      "bruteforce": "3",
      "hybrid-dict-mask": "6",
      "hybrid-mask-dict": "7",
    };

    const args = [
      "-m", hashType.toString(),
      "-a", modeMap[attackMode],
      "-w", workloadProfile.toString(),
      "--status",
      "--status-timer=10",
    ];

    if (outputFile) {
      args.push("-o", outputFile);
    }

    if (potfileDisable) {
      args.push("--potfile-disable");
    }

    if (rules) {
      args.push("-r", rules);
    }

    args.push(hashFile);

    // Add wordlist and/or mask based on attack mode
    if (attackMode === "dictionary" || attackMode === "combinator" || attackMode === "hybrid-dict-mask") {
      if (!wordlist) throw new Error("Wordlist required for this attack mode");
      args.push(wordlist);
    }

    if (attackMode === "bruteforce" || attackMode === "hybrid-dict-mask" || attackMode === "hybrid-mask-dict") {
      if (!mask && attackMode === "bruteforce") throw new Error("Mask required for brute force mode");
      if (mask) args.push(mask);
    }

    try {
      const output = await runHashcat(args);

      return {
        content: [{
          type: "text",
          text: `Hashcat Results:\nHash Type: ${hashType}\nAttack Mode: ${attackMode}\n\n${output}`,
        }],
      };
    } catch (error) {
      throw new Error(`hashcat crack failed: ${error}`);
    }
  }
);

server.tool(
  "hashcat-benchmark",
  "Run hashcat benchmark for hash types",
  {
    hashType: z.number().optional().describe("Specific hash type to benchmark (omit for all)"),
    workloadProfile: z.number().optional().default(3).describe("Workload profile"),
  },
  async ({ hashType, workloadProfile }) => {
    const args = ["-b", "-w", workloadProfile.toString()];

    if (hashType !== undefined) {
      args.push("-m", hashType.toString());
    }

    try {
      const output = await runHashcat(args, 600000);

      return {
        content: [{
          type: "text",
          text: `Hashcat Benchmark:\n\n${output}`,
        }],
      };
    } catch (error) {
      throw new Error(`hashcat benchmark failed: ${error}`);
    }
  }
);

server.tool(
  "hashcat-show",
  "Show already cracked hashes from potfile",
  {
    hashFile: z.string().describe("Path to hash file"),
    hashType: z.number().describe("Hash type code"),
  },
  async ({ hashFile, hashType }) => {
    const args = ["-m", hashType.toString(), "--show", hashFile];

    try {
      const output = await runHashcat(args, 60000);

      const cracked = output.trim().split("\n").filter(Boolean);

      return {
        content: [{
          type: "text",
          text: `Previously Cracked Hashes (${cracked.length}):\n\n${output || "No cracked hashes found"}`,
        }],
      };
    } catch (error) {
      throw new Error(`hashcat show failed: ${error}`);
    }
  }
);

server.tool(
  "hashcat-identify",
  "Identify potential hash types for a given hash",
  {
    hash: z.string().describe("Hash string to identify"),
  },
  async ({ hash }) => {
    // Common hash patterns
    const patterns: Array<{ pattern: RegExp; types: string }> = [
      { pattern: /^[a-f0-9]{32}$/i, types: "MD5 (0), NTLM (1000), MD4 (900)" },
      { pattern: /^[a-f0-9]{40}$/i, types: "SHA1 (100)" },
      { pattern: /^[a-f0-9]{64}$/i, types: "SHA256 (1400)" },
      { pattern: /^[a-f0-9]{128}$/i, types: "SHA512 (1700)" },
      { pattern: /^\$1\$/, types: "MD5crypt (500)" },
      { pattern: /^\$2[aby]?\$/, types: "bcrypt (3200)" },
      { pattern: /^\$5\$/, types: "SHA256crypt (7400)" },
      { pattern: /^\$6\$/, types: "SHA512crypt (1800)" },
      { pattern: /^\$apr1\$/, types: "Apache MD5 (1600)" },
      { pattern: /^[a-f0-9]{32}:[a-f0-9]+$/i, types: "MD5 with salt, NTLM with salt" },
      { pattern: /^\$P\$/, types: "phpBB3/WordPress (400)" },
      { pattern: /^\$H\$/, types: "phpBB3 (400)" },
      { pattern: /^sha1\$/, types: "Django SHA1 (124)" },
      { pattern: /^pbkdf2_sha256\$/, types: "Django PBKDF2-SHA256 (10000)" },
    ];

    let identified = "Unknown hash type";
    for (const { pattern, types } of patterns) {
      if (pattern.test(hash)) {
        identified = types;
        break;
      }
    }

    return {
      content: [{
        type: "text",
        text: `Hash: ${hash}\nLength: ${hash.length}\nPotential Types: ${identified}\n\nNote: Use hashcat --example-hashes to see format examples`,
      }],
    };
  }
);

server.tool(
  "hashcat-hash-types",
  "List common hash types and their codes",
  {
    category: z.enum(["all", "raw", "salted", "unix", "windows", "web", "database", "network"])
      .optional()
      .default("all")
      .describe("Category to filter"),
  },
  async ({ category }) => {
    const hashTypes: Record<string, string> = {
      raw: `
RAW HASHES:
  0       MD5
  100     SHA1
  1400    SHA256
  1700    SHA512
  900     MD4
  17400   SHA3-256
  17600   SHA3-512
  6000    RIPEMD-160`,
      salted: `
SALTED HASHES:
  10      MD5($pass.$salt)
  20      MD5($salt.$pass)
  110     SHA1($pass.$salt)
  120     SHA1($salt.$pass)
  1410    SHA256($pass.$salt)
  1420    SHA256($salt.$pass)`,
      unix: `
UNIX/LINUX:
  500     MD5crypt $1$
  1800    SHA512crypt $6$
  7400    SHA256crypt $5$
  3200    bcrypt $2*$
  1500    DES(Unix)
  15600   Argon2`,
      windows: `
WINDOWS:
  1000    NTLM
  3000    LM
  5500    NetNTLMv1
  5600    NetNTLMv2
  1100    Domain Cached Credentials (DCC)
  2100    Domain Cached Credentials 2 (DCC2)
  13100   Kerberos 5 TGS-REP`,
      web: `
WEB APPLICATIONS:
  400     phpBB3/WordPress/Drupal
  2612    PHPS
  121     SMF
  21      osCommerce
  124     Django SHA1
  10000   Django PBKDF2-SHA256
  3711    MediaWiki B
  7900    Drupal7`,
      database: `
DATABASE:
  12      PostgreSQL
  131     MSSQL 2000
  132     MSSQL 2005
  1731    MSSQL 2012/2014
  300     MySQL4.1/MySQL5
  200     MySQL323
  112     Oracle S`,
      network: `
NETWORK:
  2500    WPA/WPA2
  16800   WPA-PMKID-PBKDF2
  5500    NetNTLMv1
  5600    NetNTLMv2
  7300    IPMI2 RAKP HMAC-SHA1
  4800    iSCSI CHAP`,
    };

    let output = "";
    if (category === "all") {
      output = Object.values(hashTypes).join("\n");
    } else {
      output = hashTypes[category] || "Category not found";
    }

    return {
      content: [{
        type: "text",
        text: `Hashcat Hash Types:\n${output}\n\nUse: hashcat --help to see all ${">"}600 hash types`,
      }],
    };
  }
);

server.tool(
  "hashcat-masks",
  "Show mask charset reference for brute force attacks",
  {},
  async () => {
    const masks = `Hashcat Mask Charsets:

BUILT-IN CHARSETS:
  ?l    Lowercase letters     (abcdefghijklmnopqrstuvwxyz)
  ?u    Uppercase letters     (ABCDEFGHIJKLMNOPQRSTUVWXYZ)
  ?d    Digits                (0123456789)
  ?s    Special characters    (!"#$%&'()*+,-./:;<=>?@[\\]^_\`{|}~)
  ?a    All printable         (?l?u?d?s)
  ?b    All bytes             (0x00 - 0xff)
  ?h    Lowercase hex         (0123456789abcdef)
  ?H    Uppercase hex         (0123456789ABCDEF)

CUSTOM CHARSETS:
  -1 ?l?d            Custom charset 1 (use as ?1)
  -2 ?l?u            Custom charset 2 (use as ?2)
  -3 abc123          Custom charset 3 (use as ?3)
  -4 ?d?s            Custom charset 4 (use as ?4)

MASK EXAMPLES:
  ?d?d?d?d           4-digit PIN (0000-9999)
  ?l?l?l?l?l         5 lowercase letters
  ?u?l?l?l?l?d?d     Capital + 4 lower + 2 digits (Password12)
  ?a?a?a?a?a?a       6 chars, all printable

  password?d?d       password + 2 digits
  ?d?d?d?d?d?d?s     6 digits + special char

INCREMENT MODE:
  --increment        Try all lengths up to mask length
  --increment-min=4  Start from length 4
  --increment-max=8  Stop at length 8

Example: hashcat -a 3 -m 1000 hashes.txt ?a?a?a?a?a?a --increment`;

    return {
      content: [{ type: "text", text: masks }],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("hashcat MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
