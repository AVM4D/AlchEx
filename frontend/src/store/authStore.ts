import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import { authApi } from '../services/authService';
import { connectSocket, disconnectSocket } from '../services/socket';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setUser: (user: User | null) => void;
  setAccessToken: (token: string) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; firstName: string; lastName: string }) => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: true, // start true so ProtectedRoute shows loader until refreshAuth completes

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      setAccessToken: (token) => set({ accessToken: token }),

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const response = await authApi.login({ email, password });
          const { user, accessToken } = response.data.data;
          set({ user, accessToken, isAuthenticated: true, isLoading: false });
          connectSocket();
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          const response = await authApi.register(data);
          const { user, accessToken } = response.data.data;
          set({ user, accessToken, isAuthenticated: true, isLoading: false });
          connectSocket();
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        authApi.logout().catch(() => {});
        disconnectSocket();
        set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
      },

      refreshAuth: async () => {
        set({ isLoading: true });
        try {
          const response = await authApi.refresh();
          const { accessToken } = response.data.data;
          set({ accessToken, isLoading: false });
          // If we got a new token, also fetch user profile
          if (accessToken && !get().user) {
            await get().fetchUser();
          }
        } catch {
          // Silently clear auth state — no hard redirect
          set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
        }
      },

      fetchUser: async () => {
        try {
          const response = await authApi.me();
          set({ user: response.data.data, isAuthenticated: true });
        } catch {
          get().logout();
        }
      },
    }),
    {
      name: 'alchex-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
