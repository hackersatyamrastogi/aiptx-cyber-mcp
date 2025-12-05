#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const SERVERS_DIR = path.join(__dirname, '../servers');

// Server metadata
const serverMeta = {
  nmap: {
    tool: 'Nmap',
    description: 'Network exploration and security auditing',
    url: 'https://nmap.org',
    keywords: ['network-scanner', 'port-scanner', 'security-audit'],
    hasPty: false,
  },
  nuclei: {
    tool: 'Nuclei',
    description: 'Template-based vulnerability scanner',
    url: 'https://github.com/projectdiscovery/nuclei',
    keywords: ['vulnerability-scanner', 'template-scanner', 'security'],
    hasPty: true,
  },
  sqlmap: {
    tool: 'SQLmap',
    description: 'SQL injection detection and exploitation',
    url: 'https://sqlmap.org',
    keywords: ['sql-injection', 'database-security', 'exploitation'],
    hasPty: false,
  },
  httpx: {
    tool: 'httpx',
    description: 'Fast HTTP probing and analysis',
    url: 'https://github.com/projectdiscovery/httpx',
    keywords: ['http-probe', 'web-analysis', 'reconnaissance'],
    hasPty: true,
  },
  ffuf: {
    tool: 'FFUF',
    description: 'Fast web fuzzer for directories and parameters',
    url: 'https://github.com/ffuf/ffuf',
    keywords: ['web-fuzzer', 'directory-scanner', 'brute-force'],
    hasPty: false,
  },
  amass: {
    tool: 'Amass',
    description: 'Subdomain enumeration and attack surface mapping',
    url: 'https://github.com/owasp-amass/amass',
    keywords: ['subdomain-enum', 'attack-surface', 'osint'],
    hasPty: false,
  },
  katana: {
    tool: 'Katana',
    description: 'Next-gen web crawling framework',
    url: 'https://github.com/projectdiscovery/katana',
    keywords: ['web-crawler', 'spider', 'endpoint-discovery'],
    hasPty: true,
  },
  sslscan: {
    tool: 'SSLScan',
    description: 'SSL/TLS configuration testing',
    url: 'https://github.com/rbsec/sslscan',
    keywords: ['ssl-scanner', 'tls-testing', 'certificate-analysis'],
    hasPty: false,
  },
  arjun: {
    tool: 'Arjun',
    description: 'HTTP parameter discovery suite',
    url: 'https://github.com/s0md3v/Arjun',
    keywords: ['parameter-discovery', 'http-params', 'web-testing'],
    hasPty: false,
  },
  waybackurls: {
    tool: 'Waybackurls',
    description: 'Fetch URLs from Wayback Machine',
    url: 'https://github.com/tomnomnom/waybackurls',
    keywords: ['wayback-machine', 'url-discovery', 'osint'],
    hasPty: false,
  },
  masscan: {
    tool: 'Masscan',
    description: 'High-speed port scanner',
    url: 'https://github.com/robertdavidgraham/masscan',
    keywords: ['port-scanner', 'mass-scanner', 'network-discovery'],
    hasPty: false,
  },
  alterx: {
    tool: 'Alterx',
    description: 'Fast subdomain wordlist generator',
    url: 'https://github.com/projectdiscovery/alterx',
    keywords: ['wordlist-generator', 'subdomain-permutation'],
    hasPty: true,
  },
  assetfinder: {
    tool: 'Assetfinder',
    description: 'Asset discovery from various sources',
    url: 'https://github.com/tomnomnom/assetfinder',
    keywords: ['asset-discovery', 'subdomain-finder', 'reconnaissance'],
    hasPty: false,
  },
  cero: {
    tool: 'Cero',
    description: 'Certificate-based subdomain discovery',
    url: 'https://github.com/glebarez/cero',
    keywords: ['certificate-discovery', 'subdomain-enum', 'ssl'],
    hasPty: false,
  },
  crtsh: {
    tool: 'crt.sh',
    description: 'Certificate transparency log search',
    url: 'https://crt.sh',
    keywords: ['certificate-transparency', 'subdomain-enum', 'ssl-certs'],
    hasPty: false,
    noBinary: true,
  },
  shuffledns: {
    tool: 'ShuffleDNS',
    description: 'High-speed DNS resolver and bruteforcer',
    url: 'https://github.com/projectdiscovery/shuffledns',
    keywords: ['dns-resolver', 'dns-bruteforce', 'subdomain-enum'],
    hasPty: true,
  },
  gowitness: {
    tool: 'GoWitness',
    description: 'Website screenshot utility',
    url: 'https://github.com/sensepost/gowitness',
    keywords: ['screenshot', 'visual-recon', 'web-capture'],
    hasPty: false,
  },
  wpscan: {
    tool: 'WPScan',
    description: 'WordPress security scanner',
    url: 'https://wpscan.com',
    keywords: ['wordpress', 'cms-scanner', 'plugin-vulnerabilities'],
    hasPty: false,
  },
  commix: {
    tool: 'Commix',
    description: 'Command injection exploitation tool',
    url: 'https://github.com/commixproject/commix',
    keywords: ['command-injection', 'exploitation', 'web-security'],
    hasPty: false,
  },
  'http-headers': {
    tool: 'HTTP Security Headers',
    description: 'Security headers analysis',
    url: 'https://owasp.org/www-project-secure-headers/',
    keywords: ['security-headers', 'http-headers', 'owasp'],
    hasPty: false,
    noBinary: true,
  },
  scoutsuite: {
    tool: 'ScoutSuite',
    description: 'Cloud security auditing (AWS/Azure/GCP)',
    url: 'https://github.com/nccgroup/ScoutSuite',
    keywords: ['cloud-security', 'aws', 'azure', 'gcp', 'audit'],
    hasPty: false,
  },
  mobsf: {
    tool: 'MobSF',
    description: 'Mobile app security analysis',
    url: 'https://github.com/MobSF/Mobile-Security-Framework-MobSF',
    keywords: ['mobile-security', 'android', 'ios', 'apk-analysis'],
    hasPty: false,
    noBinary: true,
  },
  smuggler: {
    tool: 'Smuggler',
    description: 'HTTP request smuggling detector',
    url: 'https://github.com/defparam/smuggler',
    keywords: ['http-smuggling', 'desync', 'web-security'],
    hasPty: false,
  },
  nessus: {
    tool: 'Nessus',
    description: 'Vulnerability scanner integration',
    url: 'https://www.tenable.com/products/nessus',
    keywords: ['vulnerability-scanner', 'nessus', 'tenable'],
    hasPty: false,
    noBinary: true,
  },
};

function generatePackageJson(name) {
  const meta = serverMeta[name] || {
    tool: name,
    description: `MCP server for ${name}`,
    keywords: [],
    hasPty: false,
  };

  const deps = {
    '@modelcontextprotocol/sdk': '^1.8.0',
    zod: '^3.24.0',
  };

  if (meta.hasPty) {
    deps['node-pty'] = '^1.0.0';
  }

  return JSON.stringify(
    {
      name: `@mcp-security/${name}`,
      version: '1.0.0',
      description: `MCP server for ${meta.tool} - ${meta.description}`,
      main: 'build/index.js',
      types: 'build/index.d.ts',
      bin: {
        [`mcp-${name}`]: 'build/index.js',
      },
      files: ['build', 'README.md', 'LICENSE'],
      scripts: {
        build: 'tsc',
        dev: 'tsx watch src/index.ts',
        start: 'node build/index.js',
        clean: 'rm -rf build',
        prepublishOnly: 'npm run build',
      },
      keywords: [
        'mcp',
        'model-context-protocol',
        name,
        'security',
        'penetration-testing',
        'ai',
        'claude',
        ...meta.keywords,
      ],
      author: 'MCP Security Contributors',
      license: 'MIT',
      repository: {
        type: 'git',
        url: 'https://github.com/mcp-security/mcp-security.git',
        directory: `servers/${name}`,
      },
      bugs: {
        url: 'https://github.com/mcp-security/mcp-security/issues',
      },
      homepage: `https://github.com/mcp-security/mcp-security/tree/main/servers/${name}#readme`,
      dependencies: deps,
      devDependencies: {
        '@types/node': '^22.0.0',
        tsx: '^4.19.0',
        typescript: '^5.4.0',
      },
      engines: {
        node: '>=18.0.0',
      },
      publishConfig: {
        access: 'public',
      },
    },
    null,
    2
  );
}

function generateTsConfig() {
  return JSON.stringify(
    {
      extends: '../../tsconfig.base.json',
      compilerOptions: {
        outDir: './build',
        rootDir: './src',
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'build'],
    },
    null,
    2
  );
}

function generateGitIgnore() {
  return `node_modules/
build/
*.tsbuildinfo
.DS_Store
`;
}

function generateReadme(name) {
  const meta = serverMeta[name] || {
    tool: name,
    description: `MCP server for ${name}`,
    url: '',
    keywords: [],
    noBinary: false,
  };

  const binaryArg = meta.noBinary ? '' : ` <path-to-${name}>`;
  const binaryExample = meta.noBinary
    ? ''
    : `

### Prerequisites

- **Node.js** 18 or higher
- **${meta.tool}** installed on your system`;

  return `# @mcp-security/${name}

<div align="center">

![MCP](https://img.shields.io/badge/MCP-Server-blue?style=flat-square)
[![npm version](https://img.shields.io/npm/v/@mcp-security/${name}?style=flat-square)](https://www.npmjs.com/package/@mcp-security/${name})
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

**MCP server for [${meta.tool}](${meta.url}) - ${meta.description}**

</div>

## Overview

This MCP server provides AI assistants with access to ${meta.tool}, enabling natural language interaction for security assessments.
${binaryExample}

## Installation

\`\`\`bash
# Global installation
npm install -g @mcp-security/${name}

# Or use npx directly
npx @mcp-security/${name}${binaryArg}
\`\`\`

## Claude Desktop Configuration

Add to your \`claude_desktop_config.json\`:

\`\`\`json
{
  "mcpServers": {
    "${name}": {
      "command": "npx",
      "args": ["-y", "@mcp-security/${name}"${meta.noBinary ? '' : `, "${name}"`}]
    }
  }
}
\`\`\`

## Usage

Once configured, you can interact with ${meta.tool} through natural language in Claude.

## Security Considerations

> **IMPORTANT**: Only use this tool on systems you have permission to test.

- Always obtain proper authorization before scanning
- Some features may require elevated privileges
- Follow responsible disclosure practices

## License

MIT License - see [LICENSE](LICENSE) for details.

## Related

- [${meta.tool}](${meta.url})
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP Security Tools](https://github.com/mcp-security/mcp-security)
`;
}

// Generate configs for all servers
const servers = fs.readdirSync(SERVERS_DIR).filter((f) => {
  const stat = fs.statSync(path.join(SERVERS_DIR, f));
  return stat.isDirectory() && f !== 'nmap'; // Skip nmap as it's already done
});

for (const server of servers) {
  const serverDir = path.join(SERVERS_DIR, server);

  console.log(`Generating configs for ${server}...`);

  // Generate package.json
  fs.writeFileSync(path.join(serverDir, 'package.json'), generatePackageJson(server));

  // Generate tsconfig.json
  fs.writeFileSync(path.join(serverDir, 'tsconfig.json'), generateTsConfig());

  // Generate .gitignore
  fs.writeFileSync(path.join(serverDir, '.gitignore'), generateGitIgnore());

  // Generate README.md
  fs.writeFileSync(path.join(serverDir, 'README.md'), generateReadme(server));

  console.log(`  ✓ ${server}`);
}

console.log('\\nAll configurations generated!');
