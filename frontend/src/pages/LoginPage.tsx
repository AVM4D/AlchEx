import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { useAuthStore } from '../store/authStore';
import { ParticleField } from '../components/ui/ParticleField';
import toast from 'react-hot-toast';

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      await login(data.email, data.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] flex relative overflow-hidden">
      {/* Noise */}
      <div className="noise" />

      {/* Left panel — decorative */}
      <div className="hidden lg:flex flex-1 relative items-center justify-center overflow-hidden">
        <div className="grid-lines absolute inset-0" />
        <div className="orb orb-purple w-[400px] h-[400px] top-1/4 left-1/4 z-0" />
        <div className="orb orb-blue w-[300px] h-[300px] bottom-1/4 right-1/4 z-0" style={{ animationDelay: '-8s' }} />

        <div className="absolute inset-0 z-[1]">
          <ParticleField particleCount={60} color="139, 92, 246" maxDistance={120} speed={0.15} />
        </div>

        <div className="relative z-10 text-center px-12">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease }}
            className="text-display text-6xl xl:text-7xl text-gradient-shine mb-6"
          >
            ALCHEX
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8, ease }}
            className="text-[var(--text-3)] text-lg max-w-sm mx-auto"
          >
            To gain something, give something of equal value.
          </motion.p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease }}
          className="w-full max-w-md"
        >
          {/* Logo (mobile) */}
          <Link to="/" className="lg:hidden inline-flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent)] to-purple-400 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.3)]">
              <span className="text-lg">🔮</span>
            </div>
            <span className="text-xl font-display font-bold text-gradient">AlchEx</span>
          </Link>

          <div className="mb-8">
            <span className="text-label text-[var(--accent-2)] mb-3 block">/ Sign In</span>
            <h1 className="text-display text-3xl md:text-4xl text-white mb-2">Welcome back</h1>
            <p className="text-[var(--text-2)]">Continue your exchange journey</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Email"
              type="email"
              placeholder="you@university.edu"
              icon={<Mail size={16} />}
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              icon={<Lock size={16} />}
              error={errors.password?.message}
              {...register('password')}
            />

            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full mt-2"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[var(--accent)] to-purple-400 rounded-xl blur opacity-40 group-hover:opacity-70 transition-opacity duration-500" />
              <div className="relative flex items-center justify-center gap-2 w-full px-6 py-3.5 bg-[var(--accent)] text-white rounded-xl font-semibold hover:bg-purple-500 transition-all duration-300 disabled:opacity-50">
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <>
                    Sign In
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </div>
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-[var(--text-3)]">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="text-[var(--accent-2)] hover:text-[var(--accent)] font-medium transition-colors">
                Create Account
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
