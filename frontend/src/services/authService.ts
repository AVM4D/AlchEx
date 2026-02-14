import api from './api';
import type { ApiResponse, User } from '../types';

export const authApi = {
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => api.post<ApiResponse<{ user: User; accessToken: string }>>('/auth/register', data),

  login: (data: { email: string; password: string; rememberMe?: boolean }) =>
    api.post<ApiResponse<{ user: User; accessToken: string }>>('/auth/login', data),

  refresh: () => api.post<ApiResponse<{ accessToken: string }>>('/auth/refresh'),

  logout: () => api.post('/auth/logout'),

  me: () => api.get<ApiResponse<User>>('/auth/me'),
};
