#!/usr/bin/env node

/**
 * Acunetix MCP Server
 * Integrates Acunetix Web Vulnerability Scanner with Model Context Protocol
 *
 * Features:
 * - Start vulnerability scans
 * - Check scan status
 * - Retrieve scan results
 * - List targets and scans
 * - Get vulnerability details
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import fetch from 'node-fetch';
import https from 'https';

// Configuration from environment or defaults
const ACUNETIX_URL = process.env.ACUNETIX_URL || 'https://13.127.28.41:3443';
const ACUNETIX_API_KEY = process.env.ACUNETIX_API_KEY || '1986ad8c0a5b3df4d7028d5f3c06e936ceab6d520864c4732a33a416cf8398f92';

// Disable SSL verification for self-signed certificates
const agent = new https.Agent({ rejectUnauthorized: false });

// Zod schemas for validation
const StartScanSchema = z.object({
  target_url: z.string().url().describe('Target URL to scan'),
  profile_id: z.string().optional().describe('Scanning profile ID (default: Full Scan)'),
  description: z.string().optional().describe('Scan description'),
});

const GetScanStatusSchema = z.object({
  scan_id: z.string().describe('Scan ID to check status'),
});

const GetScanResultsSchema = z.object({
  scan_id: z.string().describe('Scan ID to retrieve results'),
  severity: z.enum(['critical', 'high', 'medium', 'low', 'info']).optional().describe('Filter by severity'),
});

const ListTargetsSchema = z.object({
  limit: z.number().optional().default(10).describe('Number of targets to return'),
});

const ListScansSchema = z.object({
  target_id: z.string().optional().describe('Filter scans by target ID'),
  limit: z.number().optional().default(10).describe('Number of scans to return'),
});

const GetVulnerabilitySchema = z.object({
  vuln_id: z.string().describe('Vulnerability ID'),
  target_id: z.string().describe('Target ID'),
});

// Acunetix API Client
class AcunetixClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.apiKey = apiKey;
  }

  private async request(endpoint: string, options: any = {}) {
    const url = `${this.baseUrl}/api/v1${endpoint}`;
    const response = await fetch(url, {
      ...options,
      agent,
      headers: {
        'X-Auth': this.apiKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Acunetix API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async startScan(targetUrl: string, profileId?: string, description?: string) {
    // First, create or get target
    const targetsResponse = await this.request('/targets');
    let target = targetsResponse.targets?.find((t: any) => t.address === targetUrl);

    if (!target) {
      // Create new target
      const newTarget = await this.request('/targets', {
        method: 'POST',
        body: JSON.stringify({
          address: targetUrl,
          description: description || `RaptorX Scan - ${new Date().toISOString()}`,
          criticality: 10,
        }),
      });
      target = newTarget;
    }

    // Get scanning profiles
    const profiles = await this.request('/scanning_profiles');
    const profile = profileId
      ? profiles.scanning_profiles.find((p: any) => p.profile_id === profileId)
      : profiles.scanning_profiles.find((p: any) => p.name === 'Full Scan');

    // Start scan
    const scan = await this.request('/scans', {
      method: 'POST',
      body: JSON.stringify({
        target_id: target.target_id,
        profile_id: profile.profile_id,
        schedule: {
          disable: false,
          start_date: null,
          time_sensitive: false,
        },
      }),
    });

    return {
      scan_id: scan.scan_id,
      target_id: target.target_id,
      target_url: targetUrl,
      profile: profile.name,
      status: 'queued',
      message: 'Scan started successfully',
    };
  }

  async getScanStatus(scanId: string) {
    const scans = await this.request('/scans');
    const scan = scans.scans?.find((s: any) => s.scan_id === scanId);

    if (!scan) {
      throw new Error(`Scan not found: ${scanId}`);
    }

    // Get target details
    const target = await this.request(`/targets/${scan.target_id}`);

    return {
      scan_id: scanId,
      target_url: target.address,
      status: scan.current_session?.status || 'unknown',
      progress: scan.current_session?.progress || 0,
      severity_counts: scan.current_session?.severity_counts || target.severity_counts,
      start_date: scan.current_session?.start_date,
      end_date: scan.current_session?.end_date,
    };
  }

  async getScanResults(scanId: string, severity?: string) {
    const scans = await this.request('/scans');
    const scan = scans.scans?.find((s: any) => s.scan_id === scanId);

    if (!scan) {
      throw new Error(`Scan not found: ${scanId}`);
    }

    // Get vulnerabilities
    let endpoint = `/targets/${scan.target_id}/vulnerabilities`;
    if (severity) {
      endpoint += `?severity=${severity}`;
    }

    const vulns = await this.request(endpoint);

    return {
      scan_id: scanId,
      target_id: scan.target_id,
      total_vulnerabilities: vulns.vulnerabilities?.length || 0,
      vulnerabilities: vulns.vulnerabilities?.map((v: any) => ({
        vuln_id: v.vuln_id,
        severity: v.severity,
        vt_name: v.vt_name,
        status: v.status,
        affects_url: v.affects_url,
        confidence: v.confidence,
      })) || [],
    };
  }

  async listTargets(limit: number = 10) {
    const targets = await this.request(`/targets?l=${limit}`);
    return {
      total: targets.pagination?.count || 0,
      targets: targets.targets?.slice(0, limit).map((t: any) => ({
        target_id: t.target_id,
        address: t.address,
        description: t.description,
        last_scan_date: t.last_scan_date,
        severity_counts: t.severity_counts,
        threat: t.threat,
      })) || [],
    };
  }

  async listScans(targetId?: string, limit: number = 10) {
    const endpoint = targetId ? `/targets/${targetId}/scans` : '/scans';
    const scans = await this.request(`${endpoint}?l=${limit}`);

    return {
      total: scans.pagination?.count || 0,
      scans: scans.scans?.slice(0, limit).map((s: any) => ({
        scan_id: s.scan_id,
        target_id: s.target_id,
        profile_name: s.profile_name,
        status: s.current_session?.status,
        severity_counts: s.current_session?.severity_counts,
        start_date: s.current_session?.start_date,
        end_date: s.current_session?.end_date,
      })) || [],
    };
  }

  async getVulnerability(vulnId: string, targetId: string) {
    const vuln = await this.request(`/targets/${targetId}/vulnerabilities/${vulnId}`);
    return {
      vuln_id: vuln.vuln_id,
      severity: vuln.severity,
      vt_name: vuln.vt_name,
      description: vuln.description,
      recommendation: vuln.recommendation,
      affects_url: vuln.affects_url,
      confidence: vuln.confidence,
      status: vuln.status,
      cvss_score: vuln.cvss_score,
      cvss_vector: vuln.cvss_vector,
      request: vuln.request,
      response: vuln.response,
    };
  }
}

// Initialize Acunetix client
const acunetix = new AcunetixClient(ACUNETIX_URL, ACUNETIX_API_KEY);

// Define available tools
const TOOLS: Tool[] = [
  {
    name: 'start-scan',
    description: 'Start a new Acunetix vulnerability scan on a target URL',
    inputSchema: {
      type: 'object',
      properties: {
        target_url: {
          type: 'string',
          description: 'Target URL to scan (e.g., https://example.com)',
        },
        profile_id: {
          type: 'string',
          description: 'Optional scanning profile ID (default: Full Scan)',
        },
        description: {
          type: 'string',
          description: 'Optional scan description',
        },
      },
      required: ['target_url'],
    },
  },
  {
    name: 'get-scan-status',
    description: 'Check the status of a running or completed scan',
    inputSchema: {
      type: 'object',
      properties: {
        scan_id: {
          type: 'string',
          description: 'Scan ID to check status',
        },
      },
      required: ['scan_id'],
    },
  },
  {
    name: 'get-scan-results',
    description: 'Retrieve detailed results from a completed scan',
    inputSchema: {
      type: 'object',
      properties: {
        scan_id: {
          type: 'string',
          description: 'Scan ID to retrieve results',
        },
        severity: {
          type: 'string',
          enum: ['critical', 'high', 'medium', 'low', 'info'],
          description: 'Filter vulnerabilities by severity',
        },
      },
      required: ['scan_id'],
    },
  },
  {
    name: 'list-targets',
    description: 'List all configured scan targets in Acunetix',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of targets to return (default: 10)',
          default: 10,
        },
      },
    },
  },
  {
    name: 'list-scans',
    description: 'List all scans (optionally filtered by target)',
    inputSchema: {
      type: 'object',
      properties: {
        target_id: {
          type: 'string',
          description: 'Optional target ID to filter scans',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of scans to return (default: 10)',
          default: 10,
        },
      },
    },
  },
  {
    name: 'get-vulnerability',
    description: 'Get detailed information about a specific vulnerability',
    inputSchema: {
      type: 'object',
      properties: {
        vuln_id: {
          type: 'string',
          description: 'Vulnerability ID',
        },
        target_id: {
          type: 'string',
          description: 'Target ID',
        },
      },
      required: ['vuln_id', 'target_id'],
    },
  },
];

// Create and configure MCP server
const server = new Server(
  {
    name: 'acunetix-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
}));

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'start-scan': {
        const parsed = StartScanSchema.parse(args);
        const result = await acunetix.startScan(
          parsed.target_url,
          parsed.profile_id,
          parsed.description
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'get-scan-status': {
        const parsed = GetScanStatusSchema.parse(args);
        const result = await acunetix.getScanStatus(parsed.scan_id);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'get-scan-results': {
        const parsed = GetScanResultsSchema.parse(args);
        const result = await acunetix.getScanResults(parsed.scan_id, parsed.severity);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'list-targets': {
        const parsed = ListTargetsSchema.parse(args);
        const result = await acunetix.listTargets(parsed.limit);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'list-scans': {
        const parsed = ListScansSchema.parse(args);
        const result = await acunetix.listScans(parsed.target_id, parsed.limit);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'get-vulnerability': {
        const parsed = GetVulnerabilitySchema.parse(args);
        const result = await acunetix.getVulnerability(parsed.vuln_id, parsed.target_id);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid arguments: ${error.errors.map((e) => e.message).join(', ')}`);
    }
    throw error;
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Acunetix MCP Server running on stdio');
  console.error(`Connected to: ${ACUNETIX_URL}`);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
