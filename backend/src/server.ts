import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { config } from './utils/config';
import routes from './routes';
import { errorHandler } from './middlewares/errorHandler';
import { initializeSocket } from './sockets';
import { initializeCronJobs } from './jobs/cronJobs';

const app = express();
const server = http.createServer(app);

// ─── Security ───
app.use(helmet());
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Rate Limiting (disabled in development) ───
if (config.nodeEnv === 'production') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { success: false, message: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/', limiter);

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { success: false, message: 'Too many auth attempts' },
  });
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);
}

// ─── Body Parsing ───
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Static Files ───
app.use('/uploads', express.static('uploads'));

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
  ║  🔮 AlchEx Backend Server             ║
  ║  Running on port ${config.port}                ║
  ║  Environment: ${config.nodeEnv}          ║
  ╚════════════════════════════════════════╝
  `);
});

export { app, server, io };
