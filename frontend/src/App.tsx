import React, { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from './store/authStore';
import AppLayout from './components/layout/AppLayout';
import SmoothScroller from './components/SmoothScroller';

// Lazy-loaded pages for code splitting
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const MarketplacePage = lazy(() => import('./pages/MarketplacePage'));
const PostDetailPage = lazy(() => import('./pages/PostDetailPage'));
const CreatePostPage = lazy(() => import('./pages/CreatePostPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const TransactionsPage = lazy(() => import('./pages/TransactionsPage'));
const MyPostsPage = lazy(() => import('./pages/MyPostsPage'));
const MyOffersPage = lazy(() => import('./pages/MyOffersPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function PageLoader() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) return <PageLoader />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  const { refreshAuth } = useAuthStore();

  // Initialize theme from localStorage (default dark)
  useEffect(() => {
    const saved = localStorage.getItem('alchex-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  // Attempt to restore session on mount — run only once
  useEffect(() => {
    refreshAuth().catch(() => { });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          className: '!bg-surface-light !text-white !border !border-white/10 !shadow-lg',
          duration: 4000,
          style: {
            background: '#1F2937',
            color: '#F9FAFB',
            border: '1px solid rgba(255,255,255,0.1)',
          },
        }}
      />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<SmoothScroller><LandingPage /></SmoothScroller>} />
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <LoginPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <RegisterPage />
              </PublicOnlyRoute>
            }
          />

          {/* Protected Routes (with AppLayout) */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/marketplace" element={<MarketplacePage />} />
            <Route path="/posts/new" element={<CreatePostPage />} />
            <Route path="/posts/:id" element={<PostDetailPage />} />
            <Route path="/posts/:id/edit" element={<CreatePostPage />} />
            <Route path="/my-posts" element={<MyPostsPage />} />
            <Route path="/my-offers" element={<MyOffersPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/transactions/:id" element={<TransactionsPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/chat/:transactionId" element={<ChatPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/users/:userId" element={<ProfilePage />} />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminPage />
                </AdminRoute>
              }
            />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </>
  );
}
