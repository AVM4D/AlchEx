import { z } from 'zod';

// ─── Auth Schemas ───
export const registerSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .refine((email) => email.endsWith('.edu'), {
      message: 'Only .edu email addresses are allowed',
    }),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// ─── Post Schemas ───
export const createPostSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().min(20, 'Description must be at least 20 characters').max(2000),
  whatINeed: z.string().min(5).max(500),
  whatIOffer: z.string().min(5).max(500),
  category: z.string().min(1, 'Category is required'),
  tags: z.array(z.string()).max(10).optional(),
  expiresAt: z.string().refine((date) => new Date(date) > new Date(), {
    message: 'Expiry date must be in the future',
  }),
});

export const updatePostSchema = createPostSchema.partial();

// ─── Offer Schemas ───
export const createOfferSchema = z.object({
  postId: z.string().uuid(),
  proposalDescription: z.string().min(10).max(1000),
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
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  bio: z.string().max(500).optional(),
  batch: z.string().max(20).optional(),
  program: z.string().max(100).optional(),
  section: z.string().max(20).optional(),
  university: z.string().max(200).optional(),
  campus: z.string().max(200).optional(),
  socialLinks: z.string().optional(),
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
