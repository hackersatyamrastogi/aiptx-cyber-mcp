#!/bin/bash

#===============================================================================
#   AIPTX Cyber MCP - Configuration Generator
#   Generates Claude Desktop / Cursor / GPT config for all MCP servers
#===============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MCP_ROOT="$(dirname "$SCRIPT_DIR")"
SERVERS_DIR="$MCP_ROOT/servers"

# Colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_banner() {
    echo -e "${CYAN}"
    echo "╔═══════════════════════════════════════════════════════════════════╗"
    echo "║          AIPTX Cyber MCP - Config Generator                       ║"
    echo "╚═══════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Tool binary paths (customize these)
declare -A TOOL_ARGS=(
    ["nmap"]="nmap"
    ["masscan"]="masscan"
    ["nuclei"]="nuclei"
    ["subfinder"]="subfinder"
    ["httpx"]="httpx"
    ["katana"]="katana"
    ["amass"]="amass"
    ["ffuf"]="ffuf"
    ["gowitness"]="gowitness"
    ["waybackurls"]="waybackurls"
    ["alterx"]="alterx"
    ["shuffledns"]="shuffledns"
    ["assetfinder"]="assetfinder"
    ["cero"]="cero"
    ["sqlmap"]="sqlmap"
    ["dalfox"]="dalfox"
    ["arjun"]="arjun"
    ["commix"]="commix"
    ["wpscan"]="wpscan"
    ["sslscan"]="sslscan"
    ["smuggler"]="smuggler"
    ["trivy"]="trivy"
    ["semgrep"]="semgrep"
    ["gitleaks"]="gitleaks"
    ["prowler"]="prowler"
    ["checkov"]="checkov"
    ["scoutsuite"]="scout"
    ["crackmapexec"]="netexec"
    ["ghidra"]="/opt/ghidra/support/analyzeHeadless"
    ["mobsf"]="http://localhost:8000"
    # API-based tools - replace with your keys
    ["shodan"]="YOUR_SHODAN_API_KEY"
    ["virustotal"]="YOUR_VIRUSTOTAL_API_KEY"
    ["burpsuite"]="http://localhost:1337"
    ["zap"]="http://localhost:8080"
    ["bloodhound"]="bolt://localhost:7687 neo4j"
    ["nessus"]="https://localhost:8834 admin password"
    ["acunetix"]="https://localhost:3443 YOUR_API_KEY"
)

generate_claude_config() {
    echo -e "${GREEN}Generating Claude Desktop config...${NC}"

    CONFIG_FILE="$MCP_ROOT/claude_desktop_config.json"

    echo '{
  "mcpServers": {' > "$CONFIG_FILE"

    local first=true
    for server_dir in "$SERVERS_DIR"/*/; do
        server_name=$(basename "$server_dir")
        build_file="$server_dir/build/index.js"

        # Skip if no build file
        [[ ! -f "$build_file" ]] && continue

        # Get tool args
        tool_args="${TOOL_ARGS[$server_name]:-$server_name}"

        if [ "$first" = true ]; then
            first=false
        else
            echo "," >> "$CONFIG_FILE"
        fi

        # Handle multi-arg tools
        if [[ "$tool_args" == *" "* ]]; then
            IFS=' ' read -ra ARGS <<< "$tool_args"
            args_json=$(printf '"%s", ' "${ARGS[@]}")
            args_json="${args_json%, }"
            echo -n "    \"$server_name\": {
      \"command\": \"node\",
      \"args\": [\"$build_file\", $args_json]
    }" >> "$CONFIG_FILE"
        else
            echo -n "    \"$server_name\": {
      \"command\": \"node\",
      \"args\": [\"$build_file\", \"$tool_args\"]
    }" >> "$CONFIG_FILE"
        fi
    done

    echo '
  }
}' >> "$CONFIG_FILE"

    echo -e "${GREEN}✓ Generated: $CONFIG_FILE${NC}"
}

generate_cursor_config() {
    echo -e "${GREEN}Generating Cursor IDE config...${NC}"

    # Cursor uses same format as Claude Desktop
    CONFIG_FILE="$MCP_ROOT/cursor_mcp_config.json"
    cp "$MCP_ROOT/claude_desktop_config.json" "$CONFIG_FILE"

    echo -e "${GREEN}✓ Generated: $CONFIG_FILE${NC}"
}

generate_env_file() {
    echo -e "${GREEN}Generating .env template...${NC}"

    ENV_FILE="$MCP_ROOT/.env.mcp"

    cat > "$ENV_FILE" << 'EOF'
# AIPTX Cyber MCP - Environment Variables
# Copy this to .env and fill in your API keys

# Shodan API Key (https://account.shodan.io/)
SHODAN_API_KEY=your_shodan_api_key_here

# VirusTotal API Key (https://www.virustotal.com/gui/my-apikey)
VIRUSTOTAL_API_KEY=your_virustotal_api_key_here

# Burp Suite API URL (Burp Pro REST API)
BURP_API_URL=http://localhost:1337

# OWASP ZAP API URL
ZAP_API_URL=http://localhost:8080
ZAP_API_KEY=your_zap_api_key

# BloodHound Neo4j
NEO4J_URL=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=bloodhound

# Nessus
NESSUS_URL=https://localhost:8834
NESSUS_ACCESS_KEY=your_access_key
NESSUS_SECRET_KEY=your_secret_key

# MobSF
MOBSF_URL=http://localhost:8000
MOBSF_API_KEY=your_mobsf_api_key
EOF

    echo -e "${GREEN}✓ Generated: $ENV_FILE${NC}"
}

install_to_claude() {
    echo -e "${GREEN}Installing config to Claude Desktop...${NC}"

    case "$(uname -s)" in
        Darwin)
            CLAUDE_CONFIG_DIR="$HOME/Library/Application Support/Claude"
            ;;
        Linux)
            CLAUDE_CONFIG_DIR="$HOME/.config/Claude"
            ;;
        *)
            echo -e "${YELLOW}Unsupported OS. Copy manually.${NC}"
            return
            ;;
    esac

    mkdir -p "$CLAUDE_CONFIG_DIR"
    cp "$MCP_ROOT/claude_desktop_config.json" "$CLAUDE_CONFIG_DIR/claude_desktop_config.json"

    echo -e "${GREEN}✓ Installed to: $CLAUDE_CONFIG_DIR/claude_desktop_config.json${NC}"
    echo -e "${YELLOW}Restart Claude Desktop to apply changes.${NC}"
}

show_summary() {
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}                    Configuration Generated!${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "Generated files:"
    echo "  • claude_desktop_config.json  - For Claude Desktop"
    echo "  • cursor_mcp_config.json      - For Cursor IDE"
    echo "  • .env.mcp                    - API keys template"
    echo ""
    echo "Next steps:"
    echo "  1. Edit .env.mcp with your API keys"
    echo "  2. Run: $0 --install  (to install to Claude Desktop)"
    echo "  3. Restart Claude Desktop"
    echo ""
}

# Main
print_banner

case "${1:-}" in
    --install|-i)
        generate_claude_config
        install_to_claude
        ;;
    --cursor)
        generate_claude_config
        generate_cursor_config
        ;;
    --env)
        generate_env_file
        ;;
    --help|-h)
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Options:"
        echo "  (none)     Generate all config files"
        echo "  --install  Generate and install to Claude Desktop"
        echo "  --cursor   Generate Cursor IDE config"
        echo "  --env      Generate .env template only"
        echo "  --help     Show this help"
        ;;
    *)
        generate_claude_config
        generate_cursor_config
        generate_env_file
        show_summary
        ;;
esac
