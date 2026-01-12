#!/bin/bash

#===============================================================================
#
#   AIPTX Cyber MCP - Security Tools Installer
#   One-click installation for all 38+ security tools
#
#   Usage: ./install-tools.sh [options]
#
#   Options:
#     --all         Install all tools (default)
#     --minimal     Install essential tools only
#     --category    Install by category (recon, vuln, cloud, etc.)
#     --list        List all available tools
#     --help        Show this help message
#
#===============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Counters
INSTALLED=0
SKIPPED=0
FAILED=0

#-------------------------------------------------------------------------------
# Helper Functions
#-------------------------------------------------------------------------------

print_banner() {
    echo -e "${CYAN}"
    echo "╔═══════════════════════════════════════════════════════════════════╗"
    echo "║                                                                   ║"
    echo "║     █████╗ ██╗██████╗ ████████╗██╗  ██╗                          ║"
    echo "║    ██╔══██╗██║██╔══██╗╚══██╔══╝╚██╗██╔╝                          ║"
    echo "║    ███████║██║██████╔╝   ██║    ╚███╔╝                           ║"
    echo "║    ██╔══██║██║██╔═══╝    ██║    ██╔██╗                           ║"
    echo "║    ██║  ██║██║██║        ██║   ██╔╝ ██╗                          ║"
    echo "║    ╚═╝  ╚═╝╚═╝╚═╝        ╚═╝   ╚═╝  ╚═╝                          ║"
    echo "║                                                                   ║"
    echo "║           Cyber MCP - Security Tools Installer                    ║"
    echo "║                  38+ Tools • One Click                            ║"
    echo "║                                                                   ║"
    echo "╚═══════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
    ((INSTALLED++))
}

log_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
    ((FAILED++))
}

log_skip() {
    echo -e "${PURPLE}[SKIP]${NC} $1 (already installed)"
    ((SKIPPED++))
}

command_exists() {
    command -v "$1" &> /dev/null
}

detect_os() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
        PKG_MANAGER="brew"
    elif [[ -f /etc/debian_version ]]; then
        OS="debian"
        PKG_MANAGER="apt"
    elif [[ -f /etc/redhat-release ]]; then
        OS="redhat"
        PKG_MANAGER="dnf"
    elif [[ -f /etc/arch-release ]]; then
        OS="arch"
        PKG_MANAGER="pacman"
    else
        OS="unknown"
        PKG_MANAGER="unknown"
    fi
    log_info "Detected OS: $OS (Package Manager: $PKG_MANAGER)"
}

install_prerequisites() {
    log_info "Installing prerequisites..."

    case $PKG_MANAGER in
        brew)
            if ! command_exists brew; then
                log_info "Installing Homebrew..."
                /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
            fi
            brew update
            brew install git curl wget jq go python3 node
            ;;
        apt)
            sudo apt update
            sudo apt install -y git curl wget jq golang python3 python3-pip python3-venv nodejs npm
            ;;
        dnf)
            sudo dnf install -y git curl wget jq golang python3 python3-pip nodejs npm
            ;;
        pacman)
            sudo pacman -Sy --noconfirm git curl wget jq go python python-pip nodejs npm
            ;;
    esac

    # Install pipx for Python tools
    if ! command_exists pipx; then
        python3 -m pip install --user pipx
        python3 -m pipx ensurepath
    fi

    log_success "Prerequisites installed"
}

#-------------------------------------------------------------------------------
# Tool Installation Functions
#-------------------------------------------------------------------------------

# ===== RECONNAISSANCE TOOLS =====

install_nmap() {
    if command_exists nmap; then
        log_skip "nmap"
        return
    fi
    log_info "Installing nmap..."
    case $PKG_MANAGER in
        brew) brew install nmap ;;
        apt) sudo apt install -y nmap ;;
        dnf) sudo dnf install -y nmap ;;
        pacman) sudo pacman -S --noconfirm nmap ;;
    esac
    log_success "nmap installed"
}

install_masscan() {
    if command_exists masscan; then
        log_skip "masscan"
        return
    fi
    log_info "Installing masscan..."
    case $PKG_MANAGER in
        brew) brew install masscan ;;
        apt) sudo apt install -y masscan ;;
        dnf) sudo dnf install -y masscan ;;
        pacman) sudo pacman -S --noconfirm masscan ;;
    esac
    log_success "masscan installed"
}

install_subfinder() {
    if command_exists subfinder; then
        log_skip "subfinder"
        return
    fi
    log_info "Installing subfinder..."
    go install -v github.com/projectdiscovery/subfinder/v2/cmd/subfinder@latest
    log_success "subfinder installed"
}

install_httpx() {
    if command_exists httpx; then
        log_skip "httpx"
        return
    fi
    log_info "Installing httpx..."
    go install -v github.com/projectdiscovery/httpx/cmd/httpx@latest
    log_success "httpx installed"
}

install_nuclei() {
    if command_exists nuclei; then
        log_skip "nuclei"
        return
    fi
    log_info "Installing nuclei..."
    go install -v github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest
    log_success "nuclei installed"
}

install_katana() {
    if command_exists katana; then
        log_skip "katana"
        return
    fi
    log_info "Installing katana..."
    go install -v github.com/projectdiscovery/katana/cmd/katana@latest
    log_success "katana installed"
}

install_alterx() {
    if command_exists alterx; then
        log_skip "alterx"
        return
    fi
    log_info "Installing alterx..."
    go install -v github.com/projectdiscovery/alterx/cmd/alterx@latest
    log_success "alterx installed"
}

install_shuffledns() {
    if command_exists shuffledns; then
        log_skip "shuffledns"
        return
    fi
    log_info "Installing shuffledns..."
    go install -v github.com/projectdiscovery/shuffledns/cmd/shuffledns@latest
    log_success "shuffledns installed"
}

install_amass() {
    if command_exists amass; then
        log_skip "amass"
        return
    fi
    log_info "Installing amass..."
    go install -v github.com/owasp-amass/amass/v4/...@master
    log_success "amass installed"
}

install_assetfinder() {
    if command_exists assetfinder; then
        log_skip "assetfinder"
        return
    fi
    log_info "Installing assetfinder..."
    go install -v github.com/tomnomnom/assetfinder@latest
    log_success "assetfinder installed"
}

install_waybackurls() {
    if command_exists waybackurls; then
        log_skip "waybackurls"
        return
    fi
    log_info "Installing waybackurls..."
    go install -v github.com/tomnomnom/waybackurls@latest
    log_success "waybackurls installed"
}

install_gowitness() {
    if command_exists gowitness; then
        log_skip "gowitness"
        return
    fi
    log_info "Installing gowitness..."
    go install -v github.com/sensepost/gowitness@latest
    log_success "gowitness installed"
}

install_ffuf() {
    if command_exists ffuf; then
        log_skip "ffuf"
        return
    fi
    log_info "Installing ffuf..."
    go install -v github.com/ffuf/ffuf/v2@latest
    log_success "ffuf installed"
}

install_cero() {
    if command_exists cero; then
        log_skip "cero"
        return
    fi
    log_info "Installing cero..."
    go install -v github.com/glebarez/cero@latest
    log_success "cero installed"
}

# ===== VULNERABILITY ASSESSMENT =====

install_sqlmap() {
    if command_exists sqlmap; then
        log_skip "sqlmap"
        return
    fi
    log_info "Installing sqlmap..."
    case $PKG_MANAGER in
        brew) brew install sqlmap ;;
        *) pipx install sqlmap ;;
    esac
    log_success "sqlmap installed"
}

install_dalfox() {
    if command_exists dalfox; then
        log_skip "dalfox"
        return
    fi
    log_info "Installing dalfox..."
    go install -v github.com/hahwul/dalfox/v2@latest
    log_success "dalfox installed"
}

install_arjun() {
    if command_exists arjun; then
        log_skip "arjun"
        return
    fi
    log_info "Installing arjun..."
    pipx install arjun
    log_success "arjun installed"
}

install_commix() {
    if command_exists commix; then
        log_skip "commix"
        return
    fi
    log_info "Installing commix..."
    pipx install commix
    log_success "commix installed"
}

install_wpscan() {
    if command_exists wpscan; then
        log_skip "wpscan"
        return
    fi
    log_info "Installing wpscan..."
    case $PKG_MANAGER in
        brew) brew install wpscan ;;
        *)
            if command_exists gem; then
                sudo gem install wpscan
            else
                log_warning "Ruby/gem not found. Install Ruby first for wpscan."
                return
            fi
            ;;
    esac
    log_success "wpscan installed"
}

install_sslscan() {
    if command_exists sslscan; then
        log_skip "sslscan"
        return
    fi
    log_info "Installing sslscan..."
    case $PKG_MANAGER in
        brew) brew install sslscan ;;
        apt) sudo apt install -y sslscan ;;
        dnf) sudo dnf install -y sslscan ;;
        pacman) sudo pacman -S --noconfirm sslscan ;;
    esac
    log_success "sslscan installed"
}

install_zap() {
    if command_exists zap.sh || command_exists zaproxy; then
        log_skip "OWASP ZAP"
        return
    fi
    log_info "Installing OWASP ZAP..."
    case $PKG_MANAGER in
        brew) brew install --cask owasp-zap ;;
        apt)
            sudo snap install zaproxy --classic 2>/dev/null || \
            log_warning "Install ZAP manually from https://www.zaproxy.org/download/"
            ;;
        *) log_warning "Install ZAP manually from https://www.zaproxy.org/download/" ;;
    esac
    log_success "OWASP ZAP installed"
}

# ===== THREAT INTELLIGENCE & OSINT =====

install_shodan() {
    if command_exists shodan; then
        log_skip "shodan CLI"
        return
    fi
    log_info "Installing shodan CLI..."
    pipx install shodan
    log_success "shodan CLI installed (configure with: shodan init YOUR_API_KEY)"
}

# ===== CLOUD & INFRASTRUCTURE SECURITY =====

install_trivy() {
    if command_exists trivy; then
        log_skip "trivy"
        return
    fi
    log_info "Installing trivy..."
    case $PKG_MANAGER in
        brew) brew install trivy ;;
        apt)
            sudo apt-get install wget apt-transport-https gnupg lsb-release -y
            wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | sudo apt-key add -
            echo "deb https://aquasecurity.github.io/trivy-repo/deb $(lsb_release -sc) main" | sudo tee /etc/apt/sources.list.d/trivy.list
            sudo apt-get update && sudo apt-get install trivy -y
            ;;
        *)
            curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sudo sh -s -- -b /usr/local/bin
            ;;
    esac
    log_success "trivy installed"
}

install_prowler() {
    if command_exists prowler; then
        log_skip "prowler"
        return
    fi
    log_info "Installing prowler..."
    pipx install prowler
    log_success "prowler installed"
}

install_checkov() {
    if command_exists checkov; then
        log_skip "checkov"
        return
    fi
    log_info "Installing checkov..."
    pipx install checkov
    log_success "checkov installed"
}

install_scoutsuite() {
    if command_exists scout; then
        log_skip "scoutsuite"
        return
    fi
    log_info "Installing scoutsuite..."
    pipx install scoutsuite
    log_success "scoutsuite installed"
}

# ===== CODE & SECRET SECURITY =====

install_semgrep() {
    if command_exists semgrep; then
        log_skip "semgrep"
        return
    fi
    log_info "Installing semgrep..."
    pipx install semgrep
    log_success "semgrep installed"
}

install_gitleaks() {
    if command_exists gitleaks; then
        log_skip "gitleaks"
        return
    fi
    log_info "Installing gitleaks..."
    case $PKG_MANAGER in
        brew) brew install gitleaks ;;
        *) go install github.com/gitleaks/gitleaks/v8@latest ;;
    esac
    log_success "gitleaks installed"
}

# ===== NETWORK & AD SECURITY =====

install_crackmapexec() {
    if command_exists crackmapexec || command_exists cme || command_exists netexec; then
        log_skip "crackmapexec/netexec"
        return
    fi
    log_info "Installing netexec (crackmapexec successor)..."
    pipx install git+https://github.com/Pennyw0rth/NetExec
    log_success "netexec installed"
}

install_bloodhound() {
    log_info "BloodHound requires Neo4j database..."
    if command_exists docker; then
        log_info "Installing BloodHound via Docker..."
        docker pull specterops/bloodhound-neo4j 2>/dev/null || true
        log_success "BloodHound Docker image pulled (run with: docker run -p 7474:7474 -p 7687:7687 specterops/bloodhound-neo4j)"
    else
        log_warning "Install Docker first, then run: docker pull specterops/bloodhound-neo4j"
    fi
}

install_ghidra() {
    if command_exists ghidra || [[ -d "/opt/ghidra" ]] || [[ -d "$HOME/ghidra" ]]; then
        log_skip "ghidra"
        return
    fi
    log_info "Installing Ghidra..."
    case $PKG_MANAGER in
        brew) brew install --cask ghidra ;;
        *)
            GHIDRA_VERSION="11.0.1"
            GHIDRA_DATE="20240130"
            log_info "Downloading Ghidra ${GHIDRA_VERSION}..."
            wget -q "https://github.com/NationalSecurityAgency/ghidra/releases/download/Ghidra_${GHIDRA_VERSION}_build/ghidra_${GHIDRA_VERSION}_PUBLIC_${GHIDRA_DATE}.zip" -O /tmp/ghidra.zip
            sudo unzip -q /tmp/ghidra.zip -d /opt/
            sudo ln -sf /opt/ghidra_${GHIDRA_VERSION}_PUBLIC/ghidraRun /usr/local/bin/ghidra
            rm /tmp/ghidra.zip
            ;;
    esac
    log_success "ghidra installed"
}

# ===== SPECIALIZED TOOLS =====

install_mobsf() {
    log_info "MobSF is best run via Docker..."
    if command_exists docker; then
        docker pull opensecurity/mobile-security-framework-mobsf 2>/dev/null || true
        log_success "MobSF Docker image pulled (run with: docker run -p 8000:8000 opensecurity/mobile-security-framework-mobsf)"
    else
        log_warning "Install Docker first for MobSF"
    fi
}

install_burpsuite() {
    log_warning "Burp Suite Professional requires a license."
    log_info "Download from: https://portswigger.net/burp/releases"
    case $PKG_MANAGER in
        brew)
            log_info "Installing Burp Suite Community Edition..."
            brew install --cask burp-suite
            log_success "Burp Suite Community installed"
            ;;
        *) log_warning "Download Burp Suite manually from https://portswigger.net/burp" ;;
    esac
}

#-------------------------------------------------------------------------------
# Installation Categories
#-------------------------------------------------------------------------------

install_recon_tools() {
    echo -e "\n${CYAN}═══ Installing Reconnaissance Tools ═══${NC}\n"
    install_nmap
    install_masscan
    install_subfinder
    install_httpx
    install_amass
    install_assetfinder
    install_cero
    install_waybackurls
    install_gowitness
    install_katana
    install_alterx
    install_shuffledns
}

install_vuln_tools() {
    echo -e "\n${CYAN}═══ Installing Vulnerability Assessment Tools ═══${NC}\n"
    install_nuclei
    install_sqlmap
    install_ffuf
    install_dalfox
    install_arjun
    install_commix
    install_wpscan
    install_sslscan
    install_zap
}

install_threat_intel_tools() {
    echo -e "\n${CYAN}═══ Installing Threat Intelligence Tools ═══${NC}\n"
    install_shodan
}

install_cloud_tools() {
    echo -e "\n${CYAN}═══ Installing Cloud & Infrastructure Security Tools ═══${NC}\n"
    install_trivy
    install_prowler
    install_checkov
    install_scoutsuite
}

install_code_security_tools() {
    echo -e "\n${CYAN}═══ Installing Code & Secret Security Tools ═══${NC}\n"
    install_semgrep
    install_gitleaks
}

install_network_ad_tools() {
    echo -e "\n${CYAN}═══ Installing Network & AD Security Tools ═══${NC}\n"
    install_crackmapexec
    install_bloodhound
    install_ghidra
}

install_specialized_tools() {
    echo -e "\n${CYAN}═══ Installing Specialized Tools ═══${NC}\n"
    install_mobsf
    install_burpsuite
}

install_all() {
    install_recon_tools
    install_vuln_tools
    install_threat_intel_tools
    install_cloud_tools
    install_code_security_tools
    install_network_ad_tools
    install_specialized_tools
}

install_minimal() {
    echo -e "\n${CYAN}═══ Installing Essential Tools Only ═══${NC}\n"
    install_nmap
    install_subfinder
    install_httpx
    install_nuclei
    install_ffuf
    install_trivy
    install_semgrep
    install_gitleaks
}

#-------------------------------------------------------------------------------
# Post-Installation Setup
#-------------------------------------------------------------------------------

setup_go_path() {
    if [[ ":$PATH:" != *":$HOME/go/bin:"* ]]; then
        echo 'export PATH=$PATH:$HOME/go/bin' >> ~/.bashrc
        echo 'export PATH=$PATH:$HOME/go/bin' >> ~/.zshrc 2>/dev/null || true
        export PATH=$PATH:$HOME/go/bin
        log_info "Added Go bin to PATH"
    fi
}

update_nuclei_templates() {
    if command_exists nuclei; then
        log_info "Updating Nuclei templates..."
        nuclei -update-templates 2>/dev/null || true
    fi
}

print_summary() {
    echo -e "\n${CYAN}═══════════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}                    Installation Complete!${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "  ${GREEN}✓ Installed:${NC} $INSTALLED tools"
    echo -e "  ${PURPLE}○ Skipped:${NC}   $SKIPPED tools (already installed)"
    echo -e "  ${RED}✗ Failed:${NC}    $FAILED tools"
    echo ""
    echo -e "${YELLOW}Next Steps:${NC}"
    echo "  1. Restart your terminal or run: source ~/.bashrc"
    echo "  2. Configure API keys:"
    echo "     - Shodan:     shodan init YOUR_API_KEY"
    echo "     - VirusTotal: Set VT_API_KEY environment variable"
    echo "  3. Install MCP servers: cd mcp && pnpm install && pnpm build"
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════════${NC}"
}

show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --all           Install all security tools (default)"
    echo "  --minimal       Install essential tools only (nmap, nuclei, httpx, etc.)"
    echo "  --recon         Install reconnaissance tools"
    echo "  --vuln          Install vulnerability assessment tools"
    echo "  --cloud         Install cloud security tools"
    echo "  --code          Install code/secret security tools"
    echo "  --network       Install network/AD security tools"
    echo "  --list          List all available tools"
    echo "  --help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0              # Install all tools"
    echo "  $0 --minimal    # Install essential tools only"
    echo "  $0 --recon      # Install recon tools only"
}

list_tools() {
    echo -e "${CYAN}Available Security Tools (38+):${NC}"
    echo ""
    echo -e "${GREEN}Reconnaissance (12):${NC}"
    echo "  nmap, masscan, subfinder, httpx, amass, assetfinder,"
    echo "  cero, waybackurls, gowitness, katana, alterx, shuffledns"
    echo ""
    echo -e "${GREEN}Vulnerability Assessment (11):${NC}"
    echo "  nuclei, sqlmap, ffuf, dalfox, arjun, commix, wpscan,"
    echo "  sslscan, zap, burpsuite, nessus*"
    echo ""
    echo -e "${GREEN}Threat Intelligence (3):${NC}"
    echo "  shodan, virustotal*, bloodhound"
    echo ""
    echo -e "${GREEN}Cloud & Infrastructure (4):${NC}"
    echo "  trivy, prowler, checkov, scoutsuite"
    echo ""
    echo -e "${GREEN}Code & Secret Security (2):${NC}"
    echo "  semgrep, gitleaks"
    echo ""
    echo -e "${GREEN}Network & AD Security (2):${NC}"
    echo "  crackmapexec/netexec, ghidra"
    echo ""
    echo -e "${GREEN}Specialized (4):${NC}"
    echo "  mobsf, acunetix*, nessus*, http-headers"
    echo ""
    echo -e "${YELLOW}* = Commercial/API-based (requires license or API key)${NC}"
}

#-------------------------------------------------------------------------------
# Main
#-------------------------------------------------------------------------------

main() {
    print_banner

    case "${1:-}" in
        --help|-h)
            show_help
            exit 0
            ;;
        --list|-l)
            list_tools
            exit 0
            ;;
        --minimal)
            detect_os
            install_prerequisites
            setup_go_path
            install_minimal
            print_summary
            ;;
        --recon)
            detect_os
            install_prerequisites
            setup_go_path
            install_recon_tools
            print_summary
            ;;
        --vuln)
            detect_os
            install_prerequisites
            setup_go_path
            install_vuln_tools
            print_summary
            ;;
        --cloud)
            detect_os
            install_prerequisites
            install_cloud_tools
            print_summary
            ;;
        --code)
            detect_os
            install_prerequisites
            setup_go_path
            install_code_security_tools
            print_summary
            ;;
        --network)
            detect_os
            install_prerequisites
            setup_go_path
            install_network_ad_tools
            print_summary
            ;;
        --all|"")
            detect_os
            install_prerequisites
            setup_go_path
            install_all
            update_nuclei_templates
            print_summary
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            show_help
            exit 1
            ;;
    esac
}

main "$@"
