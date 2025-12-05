import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
const pty = require('node-pty');
const args = process.argv.slice(2);
if (args.length === 0) {
    console.error("Usage: httpx-mcp <httpx binary>");
    process.exit(1);
}

// Create server instance
const server = new McpServer({
    name: "httpx",
    version: "1.0.0",
});

server.tool(
    "httpx",
    "Scans the given target domains and detects active HTTP/HTTPS services on ports like 80 and 443.",
    {
        target: z.union([z.string(), z.array(z.string())]).describe("Domain name(s) to scan (e.g., 'example.com' or ['example.com', 'test.com'])"),
        ports: z.array(z.number()).optional().describe("Optional ports to scan"),
        probes: z.array(z.string()).optional().default(['status-code', 'title', 'tech-detect']).describe(`Optional probe options (defaults to status-code, title, tech-detect).
            status-code      Display response status-code
            content-length   Display response content-length
            content-type     Display response content-type
            location         Display response redirect location
            favicon          Display mmh3 hash for '/favicon.ico' file
            hash             Display response body hash (supported: md5,mmh3,simhash,sha1,sha256,sha512)
            jarm             Display jarm fingerprint hash
            response-time    Display response time
            line-count       Display response body line count
            word-count       Display response body word count
            title            Display page title
            body-preview     Display first N characters of response body (default 100)
            web-server       Display server name
            tech-detect      Display technology in use based on wappalyzer dataset
            method           Display http request method
            websocket        Display server using websocket
            ip               Display host ip
            cname            Display host cname
            extract-fqdn     Get domain and subdomains from response body and header
            asn              Display host asn information
            cdn              Display cdn/waf in use (default true)
            probe            Display probe status`)
    },
    async ({ target, ports, probes = ['status-code', 'title', 'tech-detect'] }) => {
        // Normalize target to array (accepts both string and array from schema)
        const targetArray = Array.isArray(target) ? target : [target];

        // Use -l for list input via stdin, or just pass URLs directly
        // Modern httpx accepts targets as positional args or via -target/-list
        const httpxArgs = ["-silent", "-target", targetArray.join(",")];

        if (ports && ports.length > 0) {
            httpxArgs.push("-p", ports.join(","));
        }

        if (probes && probes.length > 0) {
            for (const probe of probes) {
                httpxArgs.push(`-${probe}`);
            }
        }

        let output = '';


        const httpx = pty.spawn(args[0], httpxArgs, {
            name: 'xterm-color',
            cols: 80,
            rows: 30,
            cwd: process.cwd(),
            env: process.env
        });

        httpx.on('data', function (data: string) {
            output += data.toString();
        });

        // Handle process completion
        return new Promise((resolve, reject) => {
            httpx.on('close', function (code: number) {
                if (code === 0 || typeof code === "undefined") {
                    output = removeAnsiCodes(output)
                    const resolveData: any = {
                        content: [{
                            type: "text",
                            text: output
                        }]
                    };
                    resolve(resolveData);
                } else {
                    reject(new Error(`httpx exited with code ${code}`));
                }
            });
            httpx.on('error', function (error: Error) {
                if (typeof error.cause !== "undefined") {
                    reject(new Error(`Error to start httpx: ${error.cause}`));
                }
            });
        });
    },
);

function removeAnsiCodes(input: string): string {
    return input.replace(/\x1B\[[0-9;]*m/g, '');
}

// Start the server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("httpx MCP Server running on stdio");
}

main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});