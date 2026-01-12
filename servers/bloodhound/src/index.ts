#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error("Usage: mcp-bloodhound <neo4j-url> <neo4j-password>");
  console.error("Example: mcp-bloodhound bolt://localhost:7687 bloodhound");
  process.exit(1);
}

const neo4jUrl = args[0];
const neo4jPassword = args[1];
const neo4jUser = args[2] || "neo4j";

const server = new McpServer({
  name: "bloodhound",
  version: "1.0.0",
});

async function runCypherQuery(query: string): Promise<any> {
  // Using HTTP API for Neo4j
  const httpUrl = neo4jUrl.replace("bolt://", "http://").replace(":7687", ":7474");

  const response = await fetch(`${httpUrl}/db/neo4j/tx/commit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Basic ${Buffer.from(`${neo4jUser}:${neo4jPassword}`).toString("base64")}`,
    },
    body: JSON.stringify({
      statements: [{ statement: query }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Neo4j error: ${response.status}`);
  }

  const result = await response.json() as {
    errors?: { message: string }[];
    results?: any[]
  };
  if (result.errors && result.errors.length > 0) {
    throw new Error(result.errors[0].message);
  }

  return result.results?.[0];
}

server.tool(
  "bloodhound-path-to-da",
  "Find shortest paths to Domain Admin",
  {
    startNode: z.string().optional()
      .describe("Starting user/computer (e.g., USER@DOMAIN.COM). If not specified, finds all paths."),
  },
  async ({ startNode }) => {
    let query: string;

    if (startNode) {
      query = `
        MATCH p=shortestPath((n)-[*1..]->(m:Group))
        WHERE n.name = "${startNode.toUpperCase()}"
        AND m.name =~ "(?i).*DOMAIN ADMINS.*"
        RETURN p
        LIMIT 10
      `;
    } else {
      query = `
        MATCH p=shortestPath((n:User)-[*1..]->(m:Group))
        WHERE m.name =~ "(?i).*DOMAIN ADMINS.*"
        AND n.enabled = true
        RETURN n.name as User, length(p) as PathLength
        ORDER BY PathLength ASC
        LIMIT 20
      `;
    }

    try {
      const result = await runCypherQuery(query);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      throw new Error(`Query failed: ${error}`);
    }
  }
);

server.tool(
  "bloodhound-kerberoastable",
  "Find Kerberoastable users with paths to high value targets",
  {},
  async () => {
    const query = `
      MATCH (u:User {hasspn:true})
      WHERE u.enabled = true
      OPTIONAL MATCH p=shortestPath((u)-[*1..]->(g:Group))
      WHERE g.highvalue = true
      RETURN u.name as User,
             u.serviceprincipalnames as SPNs,
             g.name as HighValueTarget,
             length(p) as PathLength
      ORDER BY PathLength ASC
    `;

    try {
      const result = await runCypherQuery(query);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      throw new Error(`Query failed: ${error}`);
    }
  }
);

server.tool(
  "bloodhound-asreproastable",
  "Find AS-REP Roastable users (no pre-authentication required)",
  {},
  async () => {
    const query = `
      MATCH (u:User {dontreqpreauth:true})
      WHERE u.enabled = true
      RETURN u.name as User,
             u.description as Description,
             u.pwdlastset as PasswordLastSet
    `;

    try {
      const result = await runCypherQuery(query);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      throw new Error(`Query failed: ${error}`);
    }
  }
);

server.tool(
  "bloodhound-unconstrained-delegation",
  "Find computers with unconstrained delegation",
  {},
  async () => {
    const query = `
      MATCH (c:Computer {unconstraineddelegation:true})
      WHERE c.enabled = true
      RETURN c.name as Computer,
             c.operatingsystem as OS,
             c.description as Description
    `;

    try {
      const result = await runCypherQuery(query);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      throw new Error(`Query failed: ${error}`);
    }
  }
);

server.tool(
  "bloodhound-admin-to",
  "Find what a user/group has admin rights to",
  {
    principal: z.string().describe("User or group name (e.g., USER@DOMAIN.COM)"),
  },
  async ({ principal }) => {
    const query = `
      MATCH p=(n)-[:AdminTo|MemberOf*1..]->(c:Computer)
      WHERE n.name = "${principal.toUpperCase()}"
      RETURN DISTINCT c.name as Computer,
             c.operatingsystem as OS,
             c.enabled as Enabled
    `;

    try {
      const result = await runCypherQuery(query);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      throw new Error(`Query failed: ${error}`);
    }
  }
);

server.tool(
  "bloodhound-sessions",
  "Find active sessions for a user or on a computer",
  {
    target: z.string().describe("User or computer name"),
    type: z.enum(["user", "computer"]).describe("Whether target is a user or computer"),
  },
  async ({ target, type }) => {
    let query: string;

    if (type === "user") {
      query = `
        MATCH (c:Computer)-[:HasSession]->(u:User)
        WHERE u.name = "${target.toUpperCase()}"
        RETURN c.name as Computer, u.name as User
      `;
    } else {
      query = `
        MATCH (c:Computer)-[:HasSession]->(u:User)
        WHERE c.name = "${target.toUpperCase()}"
        RETURN c.name as Computer, u.name as User
      `;
    }

    try {
      const result = await runCypherQuery(query);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      throw new Error(`Query failed: ${error}`);
    }
  }
);

server.tool(
  "bloodhound-custom-query",
  "Run a custom Cypher query against BloodHound data",
  {
    query: z.string().describe("Cypher query to execute"),
  },
  async ({ query }) => {
    try {
      const result = await runCypherQuery(query);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      throw new Error(`Query failed: ${error}`);
    }
  }
);

server.tool(
  "bloodhound-domain-stats",
  "Get domain statistics and overview",
  {},
  async () => {
    const queries = [
      "MATCH (u:User) WHERE u.enabled = true RETURN 'Enabled Users' as Type, count(u) as Count",
      "MATCH (c:Computer) WHERE c.enabled = true RETURN 'Enabled Computers' as Type, count(c) as Count",
      "MATCH (g:Group) RETURN 'Groups' as Type, count(g) as Count",
      "MATCH (u:User {hasspn:true, enabled:true}) RETURN 'Kerberoastable' as Type, count(u) as Count",
      "MATCH (u:User {dontreqpreauth:true, enabled:true}) RETURN 'ASREProastable' as Type, count(u) as Count",
      "MATCH (c:Computer {unconstraineddelegation:true}) RETURN 'Unconstrained Delegation' as Type, count(c) as Count",
    ];

    try {
      const results = [];
      for (const q of queries) {
        const result = await runCypherQuery(q);
        if (result.data?.[0]) {
          results.push(result.data[0]);
        }
      }

      return {
        content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
      };
    } catch (error) {
      throw new Error(`Stats query failed: ${error}`);
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("BloodHound MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
