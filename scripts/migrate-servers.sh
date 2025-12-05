#!/bin/bash

# Migration script for MCP servers
# Creates the directory structure and copies source files

MCP_DIR="/Users/satyamrastogi/Documents/Claude/mcp-for-security/mcp/servers"
OLD_DIR="/Users/satyamrastogi/Documents/Claude/mcp-for-security/mcp-servers"

# Server mappings: old-name:new-name
SERVERS=(
  "nuclei-mcp:nuclei"
  "sqlmap-mcp:sqlmap"
  "httpx-mcp:httpx"
  "ffuf-mcp:ffuf"
  "amass-mcp:amass"
  "katana-mcp:katana"
  "sslscan-mcp:sslscan"
  "arjun-mcp:arjun"
  "waybackurls-mcp:waybackurls"
  "masscan-mcp:masscan"
  "alterx-mcp:alterx"
  "assetfinder-mcp:assetfinder"
  "cero:cero"
  "crtsh-mcp:crtsh"
  "shuffledns-mcp:shuffledns"
  "gowitness-mcp:gowitness"
  "wpscan-mcp:wpscan"
  "commix-mcp:commix"
  "http-headers-security-mcp:http-headers"
  "scoutsuite-mcp:scoutsuite"
  "mobsf-mcp:mobsf"
  "smuggler-mcp:smuggler"
  "nessus-mcp-server:nessus"
)

for mapping in "${SERVERS[@]}"; do
  OLD_NAME="${mapping%%:*}"
  NEW_NAME="${mapping##*:}"

  echo "Migrating $OLD_NAME -> $NEW_NAME"

  # Create directory structure
  mkdir -p "$MCP_DIR/$NEW_NAME/src"

  # Copy source files
  if [ -d "$OLD_DIR/$OLD_NAME/src" ]; then
    cp -r "$OLD_DIR/$OLD_NAME/src/"* "$MCP_DIR/$NEW_NAME/src/" 2>/dev/null || true
  fi

  # Copy existing README if available
  if [ -f "$OLD_DIR/$OLD_NAME/readme.md" ]; then
    cp "$OLD_DIR/$OLD_NAME/readme.md" "$MCP_DIR/$NEW_NAME/README.md.bak" 2>/dev/null || true
  fi

  echo "  Created $MCP_DIR/$NEW_NAME"
done

echo ""
echo "Migration complete! Source files copied."
echo "Now generate package.json and README.md for each server."
