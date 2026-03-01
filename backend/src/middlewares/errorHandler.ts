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

  // Don't spam console with expected auth/client errors
  const isExpectedError = err instanceof AppError && err.statusCode < 500;

  if (!isExpectedError) {
    if (isProduction) {
      console.error(`[ERROR] ${err.message}`);
    } else {
      console.error(`[ERROR] ${err.message}`, err.stack);
    }
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

  // ─── SQL Server errors (generic messages — never expose DB details) ───
  if (err.constructor.name === 'RequestError' || err.constructor.name === 'ConnectionError') {
    const sqlErr = err as any;
    // Unique constraint violation (SQL Server error 2627 / 2601)
    if (sqlErr.number === 2627 || sqlErr.number === 2601) {
      res.status(409).json(errorResponse('A record with this value already exists', 'DUPLICATE'));
      return;
    }
    // FK constraint violation
    if (sqlErr.number === 547) {
      res.status(400).json(errorResponse('Invalid reference — related record not found', 'FK_VIOLATION'));
      return;
    }
    // Catch-all for other SQL errors — NEVER expose raw messages
    res.status(500).json(errorResponse('A database error occurred', 'DATABASE_ERROR'));
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
