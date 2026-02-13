import xss from 'xss';

/**
 * XSS Sanitizer — strips dangerous HTML/JS from user-supplied strings.
 * Uses an allowlist approach: by default NO tags are allowed.
 */
const xssOptions = {
  whiteList: {},          // No HTML tags allowed
  stripIgnoreTag: true,   // Strip all non-whitelisted tags
  stripIgnoreTagBody: ['script', 'style', 'iframe', 'object', 'embed', 'form'],
};

/**
 * Sanitize a single string value (strip all HTML/XSS)
 */
export function sanitize(input: string): string {
  return xss(input, xssOptions).trim();
}

/**
 * Deep-sanitize all string values in an object.
 * Recursively walks through nested objects and arrays.
 */
export function sanitizeObject<T>(obj: T): T {
  if (typeof obj === 'string') {
    return sanitize(obj) as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item)) as unknown as T;
  }

  if (obj !== null && typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized as T;
  }

  return obj; // numbers, booleans, null, etc. pass through
}
