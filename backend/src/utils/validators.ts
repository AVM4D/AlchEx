import { z } from 'zod';

// ─── Reusable safe-string: trims whitespace, enforces length ───
const safeString = (min: number, max: number) =>
  z.string().trim().min(min).max(max);

// ─── UUID validator for route params ───
export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

// ─── Auth Schemas ───
export const registerSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Invalid email address')
    .max(255)
    .refine((email) => /\.edu(\.[a-z]{2})?$/.test(email), {
      message: 'Only .edu email addresses are allowed (e.g. .edu, .edu.pk)',
    }),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  firstName: safeString(1, 50),
  lastName: safeString(1, 50),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address').max(255),
  password: z.string().min(1, 'Password is required').max(128),
  rememberMe: z.boolean().optional().default(false),
});

// ─── Post Schemas ───
export const createPostSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().min(20, 'Description must be at least 20 characters').max(2000),
  whatINeed: z.string().min(5).max(500),
  whatIOffer: z.string().min(5).max(500),
  category: z.string().min(1, 'Category is required'),
  tags: z.union([
    z.array(z.string()).max(10),
    z.string().transform((s) => s.split(',').map((t) => t.trim()).filter(Boolean)),
  ]).optional(),
  expiresAt: z.string().refine((date) => new Date(date) > new Date(), {
    message: 'Expiry date must be in the future',
  }).optional(),
  notifyOnOffers: z.boolean().default(true),
});

export const updatePostSchema = createPostSchema.partial();

// ─── Offer Schemas ───
export const createOfferSchema = z.object({
  postId: z.string().uuid(),
  proposalDescription: z.string().min(10).max(1000),
  counterExchange: z.string().max(500).optional(),
});

export const updateOfferSchema = z.object({
  proposalDescription: z.string().min(10).max(1000).optional(),
  counterExchange: z.string().max(500).optional(),
});

// ─── Rating Schema ───
export const createRatingSchema = z.object({
  transactionId: z.string().uuid(),
  score: z.number().int().min(1).max(5),
  review: z.string().max(1000).optional(),
});

// ─── Report Schema ───
export const createReportSchema = z.object({
  transactionId: z.string().uuid(),
  targetUserId: z.string().uuid(),
  reason: z.string().min(1, 'Reason is required'),
  description: z.string().min(10).max(2000),
});

// ─── Profile Schema ───
export const updateProfileSchema = z.object({
  firstName: safeString(1, 50).optional(),
  lastName: safeString(1, 50).optional(),
  bio: safeString(0, 500).optional(),
  batch: safeString(0, 20).optional(),
  program: safeString(0, 100).optional(),
  section: safeString(0, 20).optional(),
  university: safeString(0, 200).optional(),
  campus: safeString(0, 200).optional(),
  socialLinks: z.string().max(2000).optional(), // JSON string, sanitized by middleware
});

// ─── Message Schema ───
export const sendMessageSchema = z.object({
  transactionId: z.string().uuid(),
  content: z.string().min(1).max(2000),
});

// ─── Admin Schemas ───
export const banUserSchema = z.object({
  userId: z.string().uuid(),
  reason: z.string().min(1).max(500),
});

export const resolveReportSchema = z.object({
  reportId: z.string().uuid(),
  status: z.enum(['RESOLVED', 'DISMISSED']),
  adminNotes: z.string().max(1000).optional(),
});

// ─── Query Schemas ───
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const marketplaceQuerySchema = paginationSchema.extend({
  category: z.string().optional(),
  search: z.string().optional(),
  status: z.string().optional(),
  sortBy: z.enum(['createdAt', 'expiresAt', 'title']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const leaderboardQuerySchema = z.object({
  period: z.enum(['TODAY', 'WEEK', 'MONTH', 'ALL_TIME']).default('ALL_TIME'),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

// Export types
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type CreateOfferInput = z.infer<typeof createOfferSchema>;
export type CreateRatingInput = z.infer<typeof createRatingSchema>;
export type CreateReportInput = z.infer<typeof createReportSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type MarketplaceQuery = z.infer<typeof marketplaceQuerySchema>;
export type LeaderboardQuery = z.infer<typeof leaderboardQuerySchema>;
