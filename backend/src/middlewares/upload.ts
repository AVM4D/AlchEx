import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';
import { config } from '../utils/config';

/**
 * Allowed MIME types — strict allowlist approach
 */
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
]);

const ALLOWED_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf',
]);

/**
 * Storage engine:
 *  - Renames every file to a random UUID (prevents path traversal & name collisions)
 *  - Stores in a directory WITHOUT execute permissions (just data files)
 */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, config.upload.dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const randomName = uuidv4() + ext;
    cb(null, randomName);
  },
});

/**
 * File filter — validates MIME type AND extension (double-check)
 */
function fileFilter(_req: Request, file: Express.Multer.File, cb: FileFilterCallback): void {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(new Error(`File type '${file.mimetype}' is not allowed`));
    return;
  }

  if (!ALLOWED_EXTENSIONS.has(ext)) {
    cb(new Error(`File extension '${ext}' is not allowed`));
    return;
  }

  cb(null, true);
}

/**
 * Configured multer instance for secure file uploads:
 *  ✅ Random UUID filenames (prevents path traversal)
 *  ✅ MIME type + extension allowlist (prevents executable uploads)
 *  ✅ File size limit from config (default 5MB)
 */
export const secureUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxFileSize,
    files: 5, // max 5 files per request
  },
});
