#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: mcp-ghidra <path-to-ghidra-headless>");
  console.error("Example: mcp-ghidra /opt/ghidra/support/analyzeHeadless");
  console.error("Example: mcp-ghidra analyzeHeadless");
  process.exit(1);
}

const ghidraHeadless = args[0];
const projectDir = args[1] || "/tmp/ghidra_projects";

// Ensure project directory exists
if (!fs.existsSync(projectDir)) {
  fs.mkdirSync(projectDir, { recursive: true });
}

const server = new McpServer({
  name: "ghidra",
  version: "1.0.0",
});

function runGhidra(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(ghidraHeadless, args);
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
        resolve(output + errorOutput);
      } else {
        reject(new Error(errorOutput || `Ghidra exited with code ${code}`));
      }
    });

    proc.on("error", (error) => {
      reject(new Error(`Failed to start ghidra: ${error.message}`));
    });
  });
}

server.tool(
  "ghidra-analyze",
  "Analyze a binary file with Ghidra and perform auto-analysis",
  {
    binaryPath: z.string().describe("Path to binary file to analyze"),
    projectName: z.string().optional().default("analysis")
      .describe("Name for the Ghidra project"),
  },
  async ({ binaryPath, projectName }) => {
    const absPath = path.resolve(binaryPath);

    if (!fs.existsSync(absPath)) {
      throw new Error(`Binary file not found: ${absPath}`);
    }

    const args = [
      projectDir,
      projectName,
      "-import", absPath,
      "-overwrite",
      "-analysisTimeoutPerFile", "300",
    ];

    try {
      const output = await runGhidra(args);

      return {
        content: [
          {
            type: "text",
            text: `Analysis complete for: ${binaryPath}\n\nProject: ${projectDir}/${projectName}\n\n${output.substring(0, 2000)}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Ghidra analysis failed: ${error}`);
    }
  }
);

server.tool(
  "ghidra-decompile",
  "Decompile functions from an analyzed binary",
  {
    binaryPath: z.string().describe("Path to binary file"),
    functionName: z.string().optional()
      .describe("Specific function to decompile (default: main or entry point)"),
    projectName: z.string().optional().default("analysis")
      .describe("Ghidra project name"),
  },
  async ({ binaryPath, functionName, projectName }) => {
    // Create a Ghidra script to decompile
    const scriptContent = `
from ghidra.app.decompiler import DecompInterface
from ghidra.util.task import ConsoleTaskMonitor

def decompile_function(func):
    decomp = DecompInterface()
    decomp.openProgram(currentProgram)
    results = decomp.decompileFunction(func, 60, ConsoleTaskMonitor())
    if results.decompileCompleted():
        return results.getDecompiledFunction().getC()
    return None

# Find target function
target = "${functionName || "main"}"
func_manager = currentProgram.getFunctionManager()
functions = func_manager.getFunctions(True)

for func in functions:
    if target.lower() in func.getName().lower() or target == "all":
        code = decompile_function(func)
        if code:
            print("=== " + func.getName() + " ===")
            print(code)
            print("")
`;

    const scriptPath = path.join(projectDir, "decompile_script.py");
    fs.writeFileSync(scriptPath, scriptContent);

    const args = [
      projectDir,
      projectName,
      "-process", path.basename(binaryPath),
      "-noanalysis",
      "-scriptPath", projectDir,
      "-postScript", "decompile_script.py",
    ];

    try {
      const output = await runGhidra(args);

      // Extract decompiled code from output
      const codeMatch = output.match(/=== .+ ===([\s\S]*?)(?:=== |$)/g);

      return {
        content: [
          {
            type: "text",
            text: codeMatch ? codeMatch.join("\n") : output,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Decompilation failed: ${error}`);
    }
  }
);

server.tool(
  "ghidra-functions",
  "List all functions in an analyzed binary",
  {
    binaryPath: z.string().describe("Path to binary file"),
    projectName: z.string().optional().default("analysis")
      .describe("Ghidra project name"),
    filter: z.string().optional()
      .describe("Filter functions by name pattern"),
  },
  async ({ binaryPath, projectName, filter }) => {
    const scriptContent = `
func_manager = currentProgram.getFunctionManager()
functions = func_manager.getFunctions(True)

filter_pattern = "${filter || ""}".lower()

print("FUNCTIONS:")
for func in functions:
    name = func.getName()
    if not filter_pattern or filter_pattern in name.lower():
        entry = func.getEntryPoint()
        print(f"{entry} | {name} | {func.getSignature()}")
`;

    const scriptPath = path.join(projectDir, "list_functions.py");
    fs.writeFileSync(scriptPath, scriptContent);

    const args = [
      projectDir,
      projectName,
      "-process", path.basename(binaryPath),
      "-noanalysis",
      "-scriptPath", projectDir,
      "-postScript", "list_functions.py",
    ];

    try {
      const output = await runGhidra(args);

      // Parse function list
      const funcLines = output.split("\n").filter(line => line.includes(" | "));
      const functions = funcLines.map(line => {
        const [addr, name, sig] = line.split(" | ");
        return { address: addr?.trim(), name: name?.trim(), signature: sig?.trim() };
      });

      return {
        content: [
          {
            type: "text",
            text: `Found ${functions.length} functions:\n\n${JSON.stringify(functions, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Function listing failed: ${error}`);
    }
  }
);

server.tool(
  "ghidra-strings",
  "Extract strings from a binary",
  {
    binaryPath: z.string().describe("Path to binary file"),
    projectName: z.string().optional().default("analysis")
      .describe("Ghidra project name"),
    minLength: z.number().optional().default(4)
      .describe("Minimum string length"),
  },
  async ({ binaryPath, projectName, minLength }) => {
    const scriptContent = `
from ghidra.program.model.data import StringDataType

min_len = ${minLength}
memory = currentProgram.getMemory()
listing = currentProgram.getListing()

print("STRINGS:")
for data in listing.getDefinedData(True):
    if data.hasStringValue():
        value = data.getValue()
        if value and len(str(value)) >= min_len:
            print(f"{data.getAddress()} | {str(value)[:200]}")
`;

    const scriptPath = path.join(projectDir, "extract_strings.py");
    fs.writeFileSync(scriptPath, scriptContent);

    const args = [
      projectDir,
      projectName,
      "-process", path.basename(binaryPath),
      "-noanalysis",
      "-scriptPath", projectDir,
      "-postScript", "extract_strings.py",
    ];

    try {
      const output = await runGhidra(args);

      const stringLines = output.split("\n").filter(line => line.includes(" | "));
      const strings = stringLines.map(line => {
        const [addr, value] = line.split(" | ");
        return { address: addr?.trim(), value: value?.trim() };
      });

      return {
        content: [
          {
            type: "text",
            text: `Extracted ${strings.length} strings:\n\n${JSON.stringify(strings.slice(0, 100), null, 2)}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`String extraction failed: ${error}`);
    }
  }
);

server.tool(
  "ghidra-imports",
  "List imported functions/libraries",
  {
    binaryPath: z.string().describe("Path to binary file"),
    projectName: z.string().optional().default("analysis")
      .describe("Ghidra project name"),
  },
  async ({ binaryPath, projectName }) => {
    const scriptContent = `
symbol_table = currentProgram.getSymbolTable()
external_manager = currentProgram.getExternalManager()

print("IMPORTS:")
for lib in external_manager.getExternalLibraryNames():
    print(f"Library: {lib}")
    for sym in symbol_table.getExternalSymbols():
        if sym.getParentNamespace().getName() == lib:
            print(f"  - {sym.getName()}")
`;

    const scriptPath = path.join(projectDir, "list_imports.py");
    fs.writeFileSync(scriptPath, scriptContent);

    const args = [
      projectDir,
      projectName,
      "-process", path.basename(binaryPath),
      "-noanalysis",
      "-scriptPath", projectDir,
      "-postScript", "list_imports.py",
    ];

    try {
      const output = await runGhidra(args);

      return {
        content: [{ type: "text", text: output }],
      };
    } catch (error) {
      throw new Error(`Import listing failed: ${error}`);
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Ghidra MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
