// ─── User Types ───
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
  bio?: string;
  batch?: string;
  program?: string;
  section?: string;
  university?: string;
  campus?: string;
  socialLinks?: string;
  role: 'STUDENT' | 'ADMIN';
  emailVerified: boolean;
  isBanned: boolean;
  reputationScore: number;
  totalExchanges: number;
  createdAt: string;
}

export interface PublicProfile {
  id: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
  bio?: string;
  batch?: string;
  program?: string;
  section?: string;
  university?: string;
  campus?: string;
  socialLinks?: string;
  reputationScore: number;
  totalExchanges: number;
  createdAt: string;
}

// ─── Post Types ───
export type PostStatus = 'ACTIVE' | 'IN_PROGRESS' | 'SUCCESSFUL' | 'CANCELLED' | 'EXPIRED';

export interface Post {
  id: string;
  userId: string;
  title: string;
  description: string;
  whatINeed: string;
  whatIOffer: string;
  category: string;
  tags?: string;
  status: PostStatus;
  expiresAt: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
    university?: string;
    reputationScore: number;
  };
  _count?: { offers: number };
  offers?: Offer[];
}

// ─── Offer Types ───
export type OfferStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';

export interface Offer {
  id: string;
  postId: string;
  userId: string;
  proposalDescription: string;
  counterExchange?: string;
  status: OfferStatus;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
    reputationScore: number;
  };
  post?: {
    id: string;
    title: string;
    status: string;
    userId: string;
  };
}

// ─── Transaction Types ───
export type TransactionStatus = 'IN_PROGRESS' | 'SUCCESSFUL' | 'CANCELLED' | 'EXPIRED' | 'DISPUTED';

export interface Transaction {
  id: string;
  postId: string;
  offerId: string;
  requesterId: string;
  offererId: string;
  status: TransactionStatus;
  requesterDone: boolean;
  offererDone: boolean;
  requesterCancel: boolean;
  offererCancel: boolean;
  completedAt?: string;
  cancelledAt?: string;
  expiresAt: string;
  createdAt: string;
  post: { id: string; title: string; description?: string };
  offer?: { id: string; proposalDescription: string; counterExchange?: string };
  requester: { id: string; firstName: string; lastName: string; profilePicture?: string; reputationScore?: number };
  offerer: { id: string; firstName: string; lastName: string; profilePicture?: string; reputationScore?: number };
  ratings?: Rating[];
}

// ─── Message Types ───
export interface Message {
  id: string;
  transactionId: string;
  senderId: string;
  content: string;
  messageType: 'TEXT' | 'SYSTEM' | 'ACTION';
  isRead: boolean;
  createdAt: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
  };
}

// ─── Rating Types ───
export interface Rating {
  id: string;
  transactionId: string;
  giverId: string;
  receiverId: string;
  score: number;
  review?: string;
  createdAt: string;
  giver?: { id: string; firstName: string; lastName: string; profilePicture?: string };
}

export interface RatingStats {
  averageRating: number;
  totalRatings: number;
  distribution: { score: number; count: number }[];
}

// ─── Report Types ───
export interface Report {
  id: string;
  transactionId: string;
  reporterId: string;
  targetUserId: string;
  reason: string;
  description: string;
  evidence?: string;
  status: 'PENDING' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';
  adminNotes?: string;
  createdAt: string;
  reporter?: { id: string; firstName: string; lastName: string };
  targetUser?: { id: string; firstName: string; lastName: string };
  transaction?: { id: string; status: string };
}

// ─── Notification Types ───
export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: string;
  isRead: boolean;
  createdAt: string;
}

// ─── Leaderboard ───
export interface LeaderboardEntry {
  id: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
  university?: string;
  reputationScore: number;
  totalExchanges: number;
}

// ─── API Response ───
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  code?: string;
  errors?: Record<string, string[]>;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

// ─── Dashboard Stats ───
export interface DashboardStats {
  totalUsers: number;
  totalPosts: number;
  totalTransactions: number;
  activeTransactions: number;
  successfulTransactions: number;
  pendingReports: number;
}
