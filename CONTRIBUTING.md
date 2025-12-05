# Contributing to MCP Security Tools

Thank you for your interest in contributing! This document provides guidelines for contributing to the MCP Security Tools project.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## How to Contribute

### Reporting Issues

- Check existing issues before creating a new one
- Use the issue templates provided
- Include reproduction steps and environment details

### Submitting Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Follow the coding style** - run `pnpm lint` and `pnpm format`
3. **Write tests** for new functionality
4. **Update documentation** if needed
5. **Submit a pull request** with a clear description

### Adding a New MCP Server

1. Create a new directory under `servers/`:
   ```bash
   mkdir servers/my-tool
   cd servers/my-tool
   ```

2. Use this package.json template:
   ```json
   {
     "name": "@mcp-security/my-tool",
     "version": "1.0.0",
     "description": "MCP server for My Tool",
     "main": "build/index.js",
     "bin": {
       "mcp-my-tool": "build/index.js"
     },
     "scripts": {
       "build": "tsc",
       "dev": "tsx src/index.ts"
     },
     "dependencies": {
       "@modelcontextprotocol/sdk": "^1.8.0",
       "zod": "^3.24.0"
     },
     "devDependencies": {
       "@types/node": "^22.0.0",
       "typescript": "^5.4.0"
     }
   }
   ```

3. Implement the MCP server in `src/index.ts`:
   ```typescript
   import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
   import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
   import { z } from "zod";

   const server = new McpServer({
     name: "my-tool",
     version: "1.0.0",
   });

   server.tool(
     "do-my-tool",
     "Description of what this tool does",
     {
       target: z.string().describe("Target to scan"),
     },
     async ({ target }) => {
       // Implementation
     }
   );

   async function main() {
     const transport = new StdioServerTransport();
     await server.connect(transport);
   }

   main().catch(console.error);
   ```

4. Add a comprehensive README.md with:
   - Tool description and features
   - Installation instructions
   - Claude Desktop configuration
   - Usage examples
   - Available parameters

5. Submit a PR with:
   - The new MCP server implementation
   - Tests (if applicable)
   - Updated root README.md listing the new server

## Development Setup

```bash
# Clone the repo
git clone https://github.com/mcp-security/mcp-security.git
cd mcp-security

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run linting
pnpm lint

# Format code
pnpm format
```

## Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat: add new feature`
- `fix: resolve bug`
- `docs: update documentation`
- `chore: maintenance tasks`
- `refactor: code refactoring`

## Release Process

We use [Changesets](https://github.com/changesets/changesets) for version management:

1. Create a changeset: `pnpm changeset`
2. Describe your changes
3. Submit PR
4. Maintainers will publish releases

## Questions?

Open a GitHub Discussion or reach out to the maintainers.

---

Thank you for contributing!
