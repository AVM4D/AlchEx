import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { config } from './utils/config';
import routes from './routes';
import { errorHandler } from './middlewares/errorHandler';
import { sanitizeInput } from './middlewares/sanitize';
import { initializeSocket } from './sockets';
import { initializeCronJobs } from './jobs/cronJobs';

const app = express();
const server = http.createServer(app);

// ─── Ensure upload directory exists ───
const uploadDir = path.resolve(config.upload.dir);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ─── Security: Helmet with hardened CSP & HSTS ───
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],  // needed for inline styles
      imgSrc: ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'", config.cors.origin],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
  hsts: {
    maxAge: 31536000,           // 1 year
    includeSubDomains: true,
    preload: true,
  },
  crossOriginEmbedderPolicy: false, // allow loading images
}));

// ─── CORS ───
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Rate Limiting (always active — protects against brute force) ───
const isProduction = config.nodeEnv === 'production';

// Global API limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProduction ? 100 : 1000,  // stricter in production
  message: { success: false, message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', globalLimiter);

// Strict auth limiter (login, register, forgot-password)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 10 : 50,  // very strict on login attempts
  message: { success: false, message: 'Too many authentication attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/refresh', authLimiter);

// ─── Body Parsing ───
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── XSS Sanitization (strips HTML from all inputs) ───
app.use(sanitizeInput);

// ─── Static Files (uploads served without execute permissions) ───
app.use('/uploads', express.static(uploadDir, {
  dotfiles: 'deny',           // block hidden files (.htaccess etc)
  index: false,               // no directory listings
  setHeaders: (res) => {
    res.set('X-Content-Type-Options', 'nosniff');       // prevent MIME sniffing
    res.set('Content-Disposition', 'inline');            // display, don't execute
    res.set('Cache-Control', 'public, max-age=86400');  // 1 day cache
  },
}));

// ─── Health Check ───
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── API Routes ───
app.use('/api', routes);

// ─── Error Handler ───
app.use(errorHandler);

// ─── Socket.IO ───
const io = initializeSocket(server);

// ─── Cron Jobs ───
initializeCronJobs();

// ─── Start Server ───
server.listen(config.port, () => {
  console.log(`
  ╔════════════════════════════════════════╗
  ║  🔮 AlchEx Backend Server              ║
  ║  Running on port ${config.port}        ║
  ║  Environment: ${config.nodeEnv}        ║
  ╚════════════════════════════════════════╝
  `);
});

export { app, server, io };
