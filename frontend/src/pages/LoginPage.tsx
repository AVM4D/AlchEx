import React, { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import gsap from 'gsap';
import { Input } from '../components/ui/Input';
import { useAuthStore } from '../store/authStore';
import { ParticleField } from '../components/ui/ParticleField';
import { TextScramble } from '../components/ui/TextScramble';
import toast from 'react-hot-toast';

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  // GSAP entrance timeline
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      // Left panel elements
      tl.fromTo(
        '.login-logo',
        { opacity: 0, scale: 0.85, y: 30 },
        { opacity: 1, scale: 1, y: 0, duration: 1 },
        0
      )
        .fromTo(
          '.login-tagline',
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.8 },
          0.4
        )
        .fromTo(
          '.login-stats > div',
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6, stagger: 0.1 },
          0.6
        );

      // Form elements
      tl.fromTo(
        '.login-form-header',
        { opacity: 0, x: 30 },
        { opacity: 1, x: 0, duration: 0.6 },
        0.2
      )
        .fromTo(
          '.login-form-field',
          { opacity: 0, y: 20, x: 10 },
          { opacity: 1, y: 0, x: 0, duration: 0.5, stagger: 0.1 },
          0.4
        )
        .fromTo(
          '.login-form-submit',
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.5 },
          0.7
        )
        .fromTo(
          '.login-form-footer',
          { opacity: 0 },
          { opacity: 1, duration: 0.5 },
          0.9
        );

      // Subtle parallax on orbs
      gsap.to('.login-orb-1', {
        y: -30,
        x: 20,
        duration: 8,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
      gsap.to('.login-orb-2', {
        y: 25,
        x: -15,
        duration: 10,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
    });

    return () => ctx.revert();
  }, []);

  const onSubmit = async (data: LoginForm) => {
    try {
      await login(data.email, data.password, data.rememberMe);
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
      <div ref={leftPanelRef} className="hidden lg:flex flex-1 relative items-center justify-center overflow-hidden">
        <div className="grid-lines absolute inset-0" />
        <div className="login-orb-1 orb orb-primary w-[400px] h-[400px] top-1/4 left-1/4 z-0" />
        <div className="login-orb-2 orb orb-blue w-[300px] h-[300px] bottom-1/4 right-1/4 z-0" style={{ animationDelay: '-8s' }} />

        <div className="absolute inset-0 z-[1]">
          <ParticleField particleCount={60} color="255, 255, 255" maxDistance={120} speed={0.15} />
        </div>

        <div className="relative z-10 text-center px-12">
          {/* Logo image — matching RegisterPage */}
          <div className="login-logo mb-6 flex justify-center">
            <span className="font-logo text-3xl font-bold tracking-wider text-[var(--text)]">ALCHEX</span>
          </div>
          <p className="login-tagline text-[var(--text-3)] text-lg max-w-sm mx-auto">
            Your skills have value. Exchange them.
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
        <div ref={formRef} className="w-full max-w-md">
          {/* Logo mobile */}
          <Link to="/" className="lg:hidden inline-flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-[0_0_20px_var(--accent-glow)]">
              <span className="font-logo text-4xl font-bold tracking-wider text-[var(--accent)]">ALCHEX</span>
            </div>
            <span className="text-xl font-display font-bold text-gradient">AlchEx</span>
          </Link>

          <div className="login-form-header mb-8">
            <span className="text-label text-[var(--accent-2)] mb-3 block">
              <TextScramble text="/ Sign In" trigger="mount" delay={300} />
            </span>
            <h1 className="text-display text-3xl md:text-4xl text-[var(--text)] mb-2">Welcome back</h1>
            <p className="text-[var(--text-2)]">Continue your exchange journey</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="login-form-field">
              <Input
                label="Email"
                type="email"
                placeholder="you@university.edu"
                icon={<Mail size={16} />}
                error={errors.email?.message}
                {...register('email')}
              />
            </div>

            <div className="login-form-field">
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                icon={<Lock size={16} />}
                error={errors.password?.message}
                {...register('password')}
              />
            </div>

            {/* Remember Me */}
            <div className="login-form-field">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    {...register('rememberMe')}
                    className="peer sr-only"
                  />
                  <div className="w-5 h-5 rounded-md border-2 border-[var(--border)] bg-[var(--surface-2)] peer-checked:bg-[var(--accent)] peer-checked:border-[var(--accent)] transition-all duration-200" />
                  <svg
                    className="absolute top-0.5 left-0.5 w-4 h-4 text-[var(--text)] opacity-0 peer-checked:opacity-100 transition-opacity duration-200"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm text-[var(--text-2)] group-hover:text-[var(--text-1)] transition-colors">
                  Remember me for 30 days
                </span>
              </label>
            </div>

            <div className="login-form-submit">
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full mt-2"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[var(--bg)] to-[var(--surface-3)] rounded-xl blur opacity-40 group-hover:opacity-70 transition-opacity duration-500" />
                <div className="relative flex items-center justify-center gap-2 w-full px-6 py-3.5 bg-[var(--accent)] text-[var(--bg)] rounded-xl font-semibold hover:bg-[var(--accent)] transition-all duration-300 disabled:opacity-50">
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
            </div>
          </form>

          <div className="login-form-footer mt-8 text-center">
            <p className="text-sm text-[var(--text-3)]">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="text-[var(--accent-2)] hover:text-[var(--accent)] font-medium transition-colors">
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
