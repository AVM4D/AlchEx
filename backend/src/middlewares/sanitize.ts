import { Request, Response, NextFunction } from 'express';
import { sanitizeObject } from '../utils/sanitize';

/**
 * Express middleware that sanitizes req.body, req.query, and req.params
 * to strip any HTML/XSS payloads before they reach controllers.
 */
export function sanitizeInput(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    // Sanitize but preserve Express query typing
    const sanitized = sanitizeObject(req.query as Record<string, unknown>);
    Object.assign(req.query, sanitized);
  }
  if (req.params && typeof req.params === 'object') {
    // Sanitize but preserve Express params typing
    const sanitized = sanitizeObject(req.params as Record<string, unknown>);
    Object.assign(req.params, sanitized);
  }
  next();
}
