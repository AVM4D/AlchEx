import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../utils/errors';
import { errorResponse } from '../utils/helpers';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error(`[ERROR] ${err.message}`, err.stack);

  if (err instanceof ValidationError) {
    res.status(err.statusCode).json(errorResponse(err.message, err.code, err.errors));
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json(errorResponse(err.message, err.code));
    return;
  }

  // Prisma errors
  if (err.constructor.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;
    if (prismaError.code === 'P2002') {
      res.status(409).json(errorResponse('A record with this value already exists', 'DUPLICATE'));
      return;
    }
    if (prismaError.code === 'P2025') {
      res.status(404).json(errorResponse('Record not found', 'NOT_FOUND'));
      return;
    }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    res.status(401).json(errorResponse('Invalid or expired token', 'UNAUTHORIZED'));
    return;
  }

  // Default
  const statusCode = 500;
  const message = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
  res.status(statusCode).json(errorResponse(message, 'INTERNAL_ERROR'));
}
