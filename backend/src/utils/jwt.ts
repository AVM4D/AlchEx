import jwt from 'jsonwebtoken';
import { config } from './config';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn,
  } as jwt.SignOptions);
}

export function generateRefreshToken(payload: TokenPayload, rememberMe: boolean = false): string {
  // Remember Me: 30 days, otherwise: 7 days (default)
  const expiresIn = rememberMe ? '30d' : config.jwt.refreshExpiresIn;
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn,
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, config.jwt.accessSecret) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, config.jwt.refreshSecret) as TokenPayload;
}

export function generateVerificationToken(): string {
  return jwt.sign({ purpose: 'email-verification' }, config.jwt.accessSecret, {
    expiresIn: '24h',
  } as jwt.SignOptions);
}
