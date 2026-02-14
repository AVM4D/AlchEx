import bcrypt from 'bcrypt';
import { userRepository } from '../repositories/userRepository';
import {
  generateAccessToken, generateRefreshToken, verifyRefreshToken,
  generateVerificationToken, TokenPayload
} from '../utils/jwt';
import {
  BadRequestError, UnauthorizedError, ConflictError, NotFoundError
} from '../utils/errors';
import { RegisterInput, LoginInput } from '../utils/validators';
import { sendWelcomeEmail } from './emailService';

export class AuthService {
  async register(input: RegisterInput) {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictError('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const verificationToken = generateVerificationToken();

    const user = await userRepository.create({
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      verificationToken,
    });

    // Send welcome email (non-blocking – won't fail registration)
    sendWelcomeEmail(user.email, user.firstName);

    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await userRepository.update(user.id, { refreshToken });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        emailVerified: user.emailVerified,
      },
      accessToken,
      refreshToken,
    };
  }

  async login(input: LoginInput) {
    const user = await userRepository.findByEmail(input.email);
    if (!user || user.isDeleted) {
      throw new UnauthorizedError('No account found with this email');
    }

    if (user.isBanned) {
      throw new UnauthorizedError('Your account has been suspended');
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Incorrect password');
    }

    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload, input.rememberMe);

    await userRepository.update(user.id, { refreshToken });

    return {
      rememberMe: input.rememberMe ?? false,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        emailVerified: user.emailVerified,
        profilePicture: user.profilePicture,
      },
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(token: string) {
    try {
      const payload = verifyRefreshToken(token);
      const user = await userRepository.findById(payload.userId);

      if (!user || user.isDeleted || user.isBanned) {
        throw new UnauthorizedError('Invalid refresh token');
      }

      if (user.refreshToken !== token) {
        throw new UnauthorizedError('Refresh token has been revoked');
      }

      const newPayload: TokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
      };

      const accessToken = generateAccessToken(newPayload);
      const refreshToken = generateRefreshToken(newPayload);

      await userRepository.update(user.id, { refreshToken });

      return { accessToken, refreshToken };
    } catch {
      throw new UnauthorizedError('Invalid refresh token');
    }
  }

  async logout(userId: string) {
    await userRepository.update(userId, { refreshToken: null });
  }

  async verifyEmail(token: string) {
    // In production, decode and verify the token, look up user
    // For now, simplified
    throw new BadRequestError('Email verification not fully implemented');
  }
}

export const authService = new AuthService();
