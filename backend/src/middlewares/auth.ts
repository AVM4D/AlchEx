import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import db from '../db/connection';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload & { isBanned?: boolean };
    }
  }
}

export async function authenticateUser(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Access token is required');
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);

    // Check if user still exists and is not banned
    const rows: any[] = await db.query`
      SELECT id, isBanned, isDeleted FROM users WHERE id = ${payload.userId}
    `;
    const user = rows[0];

    if (!user || user.isDeleted) {
      throw new UnauthorizedError('User not found');
    }

    if (user.isBanned) {
      throw new ForbiddenError('Your account has been suspended');
    }

    req.user = payload;
    next();
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      next(error);
    } else {
      next(new UnauthorizedError('Invalid or expired access token'));
    }
  }
}

/**
 * Optional authentication – sets req.user if a valid token is present,
 * but does NOT reject the request when the header is missing or invalid.
 */
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return next();

    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);

    const rows: any[] = await db.query`
      SELECT id, isBanned, isDeleted FROM users WHERE id = ${payload.userId}
    `;
    const user = rows[0];

    if (user && !user.isDeleted && !user.isBanned) {
      req.user = payload;
    }
  } catch {
    // silently ignore – unauthenticated access is fine
  }
  next();
}

export function authorizeAdmin(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    return next(new UnauthorizedError('Authentication required'));
  }

  if (req.user.role !== 'ADMIN') {
    return next(new ForbiddenError('Admin access required'));
  }

  next();
}
