/**
 * Next.js Version Vulnerability Check
 * Based on CVE-2025-66478 and CVE-2025-55182 patched versions
 */

export interface VersionInfo {
  version: string;
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
  prereleaseNum?: number;
}

// Patched versions that are NOT vulnerable
const PATCHED_VERSIONS = {
  "15": ["15.0.5", "15.1.9", "15.2.6", "15.3.6", "15.4.8", "15.5.7"],
  "16": ["16.0.7"] // 16.0.7 and above are patched
};

/**
 * Parse a semantic version string into components
 */
export function parseVersion(version: string): VersionInfo | null {
  // Handle versions like "15.0.1", "14.3.0-canary.77", "16.0.7"
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z]+)\.?(\d+))?/);
  if (!match) return null;

  return {
    version,
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    prerelease: match[4],
    prereleaseNum: match[5] ? parseInt(match[5], 10) : undefined
  };
}

/**
 * Compare two semantic versions
 * Returns: -1 if a < b, 0 if a == b, 1 if a > b
 */
export function compareVersions(a: string, b: string): number {
  const vA = parseVersion(a);
  const vB = parseVersion(b);

  if (!vA || !vB) return 0;

  if (vA.major !== vB.major) return vA.major - vB.major;
  if (vA.minor !== vB.minor) return vA.minor - vB.minor;
  if (vA.patch !== vB.patch) return vA.patch - vB.patch;

  // Handle prerelease versions (canary, etc.)
  if (vA.prerelease && !vB.prerelease) return -1; // prerelease < stable
  if (!vA.prerelease && vB.prerelease) return 1;  // stable > prerelease
  if (vA.prereleaseNum && vB.prereleaseNum) {
    return vA.prereleaseNum - vB.prereleaseNum;
  }

  return 0;
}

/**
 * Check if a Next.js version is vulnerable to CVE-2025-66478 / CVE-2025-55182
 */
export function isVulnerable(version: string): { vulnerable: boolean; reason: string } {
  const parsed = parseVersion(version);

  if (!parsed) {
    return { vulnerable: false, reason: `Unable to parse version: ${version}` };
  }

  // Next.js 16.x - vulnerable if < 16.0.7
  if (parsed.major === 16) {
    if (compareVersions(version, "16.0.7") < 0) {
      return {
        vulnerable: true,
        reason: `Next.js ${version} is vulnerable. Upgrade to 16.0.7 or later.`
      };
    }
    return {
      vulnerable: false,
      reason: `Next.js ${version} is patched (>= 16.0.7)`
    };
  }

  // Next.js 15.x - check against patched versions
  if (parsed.major === 15) {
    const patchedV15 = PATCHED_VERSIONS["15"];
    if (patchedV15.includes(version)) {
      return {
        vulnerable: false,
        reason: `Next.js ${version} is a patched release`
      };
    }
    // Any 15.x not in patched list is vulnerable
    return {
      vulnerable: true,
      reason: `Next.js ${version} is vulnerable. Upgrade to one of: ${patchedV15.join(", ")}`
    };
  }

  // Next.js 14.x canary versions - vulnerable if canary >= 77
  if (parsed.major === 14 && parsed.prerelease === "canary") {
    if (parsed.prereleaseNum && parsed.prereleaseNum >= 77) {
      return {
        vulnerable: true,
        reason: `Next.js ${version} (canary >= 77) is vulnerable`
      };
    }
    return {
      vulnerable: false,
      reason: `Next.js ${version} (canary < 77) is not affected`
    };
  }

  // Next.js 14.x stable - not affected
  if (parsed.major === 14 && !parsed.prerelease) {
    return {
      vulnerable: false,
      reason: `Next.js ${version} stable is not affected by this CVE`
    };
  }

  // Next.js 13.x and below - not affected
  if (parsed.major <= 13) {
    return {
      vulnerable: false,
      reason: `Next.js ${version} is not affected by this CVE`
    };
  }

  // Unknown major version (future versions)
  return {
    vulnerable: false,
    reason: `Next.js ${version} - unknown version, manual verification recommended`
  };
}

/**
 * Get vulnerability summary for reporting
 */
export function getVulnerabilitySummary(): string {
  return `
CVE-2025-66478 & CVE-2025-55182 - Next.js React Server Components RCE

VULNERABLE VERSIONS:
- Next.js 16.x < 16.0.7
- Next.js 15.x (except: ${PATCHED_VERSIONS["15"].join(", ")})
- Next.js 14.3.0-canary.77 and later canary builds

NOT AFFECTED:
- Next.js 14.x stable releases
- Next.js 13.x and earlier
- Applications not using React Server Components

PATCHED VERSIONS:
- 16.0.7+
- 15.5.7, 15.4.8, 15.3.6, 15.2.6, 15.1.9, 15.0.5
`.trim();
}
