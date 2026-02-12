import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { verifyAccessToken } from '../utils/jwt';
import { chatService } from '../services/chatService';
import { messageRepository } from '../repositories/messageRepository';
import { config } from '../utils/config';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export function initializeSocket(httpServer: HttpServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: config.cors.origin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
  });

  // Authentication middleware
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const payload = verifyAccessToken(token);
      socket.userId = payload.userId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  // Track online users
  const onlineUsers = new Map<string, Set<string>>(); // userId -> Set of socketIds

  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    console.log(`[Socket] User connected: ${userId}`);

    // Track user's sockets
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId)!.add(socket.id);

    // Join user's personal room
    socket.join(`user:${userId}`);

    // ─── Join Transaction Chat ───
    socket.on('join:transaction', (transactionId: string) => {
      socket.join(`transaction:${transactionId}`);
      console.log(`[Socket] User ${userId} joined transaction ${transactionId}`);
    });

    socket.on('leave:transaction', (transactionId: string) => {
      socket.leave(`transaction:${transactionId}`);
    });

    // ─── Send Message ───
    socket.on('message:send', async (data: { transactionId: string; content: string }) => {
      try {
        const message = await chatService.sendMessage(userId, data.transactionId, data.content);

        // Broadcast to transaction room
        io.to(`transaction:${data.transactionId}`).emit('message:new', message);
      } catch (error: any) {
        socket.emit('error', { message: error.message });
      }
    });

    // ─── Typing Indicator ───
    socket.on('typing:start', (transactionId: string) => {
      socket.to(`transaction:${transactionId}`).emit('typing:start', { userId });
    });

    socket.on('typing:stop', (transactionId: string) => {
      socket.to(`transaction:${transactionId}`).emit('typing:stop', { userId });
    });

    // ─── Message Read Receipt ───
    socket.on('message:read', async (transactionId: string) => {
      try {
        await messageRepository.markAsRead(transactionId, userId);
        socket.to(`transaction:${transactionId}`).emit('message:seen', {
          userId,
          transactionId,
        });
      } catch (error: any) {
        socket.emit('error', { message: error.message });
      }
    });

    // ─── Disconnect ───
    socket.on('disconnect', () => {
      console.log(`[Socket] User disconnected: ${userId}`);
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
        }
      }
    });
  });

  // Helper to send notification to specific user
  (io as any).sendNotification = (userId: string, notification: any) => {
    io.to(`user:${userId}`).emit('notification', notification);
  };

  return io;
}
