import api from './api';
import type { ApiResponse, Post, Offer, Transaction, LeaderboardEntry, RatingStats, Notification, PublicProfile, DashboardStats, Report } from '../types';

// ─── Posts ───
export const postsApi = {
  getMarketplace: (params?: Record<string, string>) =>
    api.get<ApiResponse<{ posts: Post[]; pagination: any }>>('/posts/marketplace', { params }),
  
  getById: (id: string) => api.get<ApiResponse<Post>>(`/posts/${id}`),
  
  create: (data: any) => api.post<ApiResponse<Post>>('/posts', data),
  
  update: (id: string, data: any) => api.put<ApiResponse<Post>>(`/posts/${id}`, data),
  
  delete: (id: string) => api.delete(`/posts/${id}`),
  
  getMyPosts: (params?: Record<string, string>) =>
    api.get<ApiResponse<{ posts: Post[]; pagination: any }>>('/posts/my', { params }),
  
  getCategories: () => api.get<ApiResponse<string[]>>('/posts/categories'),
};

// ─── Offers ───
export const offersApi = {
  create: (data: { postId: string; proposalDescription: string; counterExchange?: string }) =>
    api.post<ApiResponse<Offer>>('/offers', data),
  
  update: (id: string, data: { proposalDescription?: string; counterExchange?: string }) =>
    api.put<ApiResponse<Offer>>(`/offers/${id}`, data),
  
  accept: (id: string) => api.post<ApiResponse<Transaction>>(`/offers/${id}/accept`),
  
  withdraw: (id: string) => api.post(`/offers/${id}/withdraw`),
  
  getByPost: (postId: string) => api.get<ApiResponse<Offer[]>>(`/offers/post/${postId}`),
  
  getMyOffers: (params?: Record<string, string>) =>
    api.get<ApiResponse<{ offers: Offer[]; total: number }>>('/offers/my', { params }),
};

// ─── Transactions ───
export const transactionsApi = {
  getById: (id: string) => api.get<ApiResponse<Transaction>>(`/transactions/${id}`),
  
  markComplete: (id: string) => api.post(`/transactions/${id}/complete`),
  
  cancel: (id: string) => api.post(`/transactions/${id}/cancel`),
  
  getMyTransactions: (params?: Record<string, string>) =>
    api.get<ApiResponse<{ transactions: Transaction[]; pagination: any }>>('/transactions/my', { params }),
};

// ─── Chat ───
export const chatApi = {
  getMessages: (transactionId: string, params?: Record<string, string>) =>
    api.get<ApiResponse<{ messages: any[]; total: number }>>(`/chat/${transactionId}`, { params }),
  
  sendMessage: (data: { transactionId: string; content: string }) =>
    api.post('/chat', data),
  
  getUnreadCount: () => api.get<ApiResponse<{ count: number }>>('/chat/unread'),
};

// ─── Users ───
export const usersApi = {
  getProfile: () => api.get<ApiResponse<any>>('/users/profile'),
  
  updateProfile: (data: any) => api.put('/users/profile', data),
  
  getPublicProfile: (id: string) => api.get<ApiResponse<PublicProfile>>(`/users/${id}`),
  
  getRatingStats: (id: string) => api.get<ApiResponse<RatingStats>>(`/users/${id}/rating-stats`),
  
  getRatings: (id: string, params?: Record<string, string>) =>
    api.get<ApiResponse<any>>(`/users/${id}/ratings`, { params }),
  
  getLeaderboard: (params?: Record<string, string>) =>
    api.get<ApiResponse<LeaderboardEntry[]>>('/users/leaderboard', { params }),
};

// ─── Ratings ───
export const ratingsApi = {
  create: (data: { transactionId: string; score: number; review?: string }) =>
    api.post('/users/ratings', data),
};

// ─── Reports ───
export const reportsApi = {
  create: (data: { transactionId: string; targetUserId: string; reason: string; description: string }) =>
    api.post('/reports', data),
};

// ─── Notifications ───
export const notificationsApi = {
  getAll: (params?: Record<string, string>) =>
    api.get<ApiResponse<{ notifications: Notification[]; total: number; unreadCount: number }>>('/notifications', { params }),
  
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
  
  markAllAsRead: () => api.patch('/notifications/read-all'),
};

// ─── Admin ───
export const adminApi = {
  getDashboard: () => api.get<ApiResponse<DashboardStats>>('/admin/dashboard'),
  
  getUsers: (params?: Record<string, string>) =>
    api.get<ApiResponse<{ users: any[]; pagination: any }>>('/admin/users', { params }),
  
  banUser: (data: { userId: string; reason: string }) => api.post('/admin/users/ban', data),
  
  unbanUser: (id: string) => api.post(`/admin/users/${id}/unban`),
  
  getReports: (params?: Record<string, string>) =>
    api.get<ApiResponse<{ reports: Report[]; pagination: any }>>('/admin/reports', { params }),
  
  resolveReport: (data: { reportId: string; status: 'RESOLVED' | 'DISMISSED'; adminNotes?: string }) =>
    api.post('/admin/reports/resolve', data),
  
  forceCancel: (id: string) => api.post(`/admin/transactions/${id}/force-cancel`),
};
