import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { successResponse } from '../utils/helpers';
import { config } from '../utils/config';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);

      // Set refresh token as httpOnly cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: config.nodeEnv === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/api/auth',
      });

      res.status(201).json(successResponse({
        user: result.user,
        accessToken: result.accessToken,
      }, 'Registration successful'));
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body);

      // Remember Me: 30 days, otherwise: 7 days
      const cookieMaxAge = result.rememberMe
        ? 30 * 24 * 60 * 60 * 1000  // 30 days
        : 7 * 24 * 60 * 60 * 1000;  // 7 days

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: config.nodeEnv === 'production',
        sameSite: 'lax',
        maxAge: cookieMaxAge,
        path: '/api/auth',
      });

      res.json(successResponse({
        user: result.user,
        accessToken: result.accessToken,
      }, 'Login successful'));
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies?.refreshToken;
      if (!token) {
        res.status(401).json({ success: false, message: 'No refresh token' });
        return;
      }

      const result = await authService.refreshToken(token);

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: config.nodeEnv === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/api/auth',
      });

      res.json(successResponse({ accessToken: result.accessToken }, 'Token refreshed'));
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      if (req.user) {
        await authService.logout(req.user.userId);
      }

      res.clearCookie('refreshToken', { path: '/api/auth' });
      res.json(successResponse(null, 'Logged out successfully'));
    } catch (error) {
      next(error);
    }
  }

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const { userService } = await import('../services/userService');
      const profile = await userService.getProfile(req.user!.userId);
      res.json(successResponse(profile));
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
