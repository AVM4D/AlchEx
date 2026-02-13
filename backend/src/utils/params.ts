import { Request } from 'express';

/**
 * Safely extract a route param as a string.
 * Express 5 types params as string | string[] — this helper
 * ensures we always get a single string value, preventing
 * parameter pollution attacks.
 */
export function param(req: Request, name: string): string {
  const value = req.params[name];
  if (Array.isArray(value)) {
    return value[0] || '';
  }
  return value || '';
}
