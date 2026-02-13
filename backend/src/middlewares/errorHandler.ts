import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../utils/errors';
import { errorResponse } from '../utils/helpers';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // ─── Log full error server-side (never exposed to client) ───
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction) {
    console.error(`[ERROR] ${err.message}`);  // no stack traces in prod logs
  } else {
    console.error(`[ERROR] ${err.message}`, err.stack);
  }

  // ─── Known application errors (safe to show message) ───
  if (err instanceof ValidationError) {
    res.status(err.statusCode).json(errorResponse(err.message, err.code, err.errors));
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json(errorResponse(err.message, err.code));
    return;
  }

  // ─── Prisma errors (generic messages — never expose DB details) ───
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
    // Catch-all for other Prisma errors — NEVER expose raw Prisma messages
    res.status(500).json(errorResponse('A database error occurred', 'DATABASE_ERROR'));
    return;
  }

  if (err.constructor.name === 'PrismaClientValidationError') {
    res.status(400).json(errorResponse('Invalid data provided', 'VALIDATION_ERROR'));
    return;
  }

  // ─── JWT errors ───
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    res.status(401).json(errorResponse('Invalid or expired token', 'UNAUTHORIZED'));
    return;
  }

  // ─── Multer file upload errors ───
  if (err.constructor.name === 'MulterError') {
    const multerErr = err as any;
    if (multerErr.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json(errorResponse('File is too large', 'FILE_TOO_LARGE'));
      return;
    }
    res.status(400).json(errorResponse('File upload error', 'UPLOAD_ERROR'));
    return;
  }

  // ─── Default: NEVER expose internal details ───
  const message = isProduction
    ? 'Something went wrong. Please try again later.'
    : err.message;

  res.status(500).json(errorResponse(message, 'INTERNAL_ERROR'));
}
