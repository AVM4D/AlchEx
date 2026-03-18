import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';
import gsap from 'gsap';
import { Input } from '../components/ui/Input';
import { useAuthStore } from '../store/authStore';
import { ParticleField } from '../components/ui/ParticleField';
import { TextScramble } from '../components/ui/TextScramble';
import toast from 'react-hot-toast';

const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Invalid email').refine((e) => /\.edu(\.[a-z]{2})?$/i.test(e), {
    message: 'Only .edu email addresses are allowed (e.g. .edu, .edu.pk)',
  }),
  password: z.string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Needs one uppercase letter')
    .regex(/[a-z]/, 'Needs one lowercase letter')
    .regex(/[0-9]/, 'Needs one number')
    .regex(/[^A-Za-z0-9]/, 'Needs one special character'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register: registerUser, isLoading } = useAuthStore();

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  // GSAP entrance timeline
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      // Left panel
      tl.fromTo(
        '.register-logo',
        { opacity: 0, scale: 0.85, y: 30 },
        { opacity: 1, scale: 1, y: 0, duration: 1 },
        0
      )
        .fromTo(
          '.register-tagline',
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.8 },
          0.4
        )
        .fromTo(
          '.register-stats > div',
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6, stagger: 0.1 },
          0.6
        );

      // Form
      tl.fromTo(
        '.register-form-header',
        { opacity: 0, x: 30 },
        { opacity: 1, x: 0, duration: 0.6 },
        0.2
      )
        .fromTo(
          '.register-form-field',
          { opacity: 0, y: 20, x: 10 },
          { opacity: 1, y: 0, x: 0, duration: 0.5, stagger: 0.08 },
          0.35
        )
        .fromTo(
          '.register-form-submit',
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.5 },
          0.7
        )
        .fromTo(
          '.register-form-footer',
          { opacity: 0 },
          { opacity: 1, duration: 0.5 },
          0.85
        );

      // Orb parallax
      gsap.to('.register-orb-1', {
        y: -25,
        x: 15,
        duration: 9,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
      gsap.to('.register-orb-2', {
        y: 20,
        x: -20,
        duration: 11,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
    });

    return () => ctx.revert();
  }, []);

  const onSubmit = async (data: RegisterForm) => {
    try {
      await registerUser({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
      });
      toast.success('Account created! Welcome to AlchEx.');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] flex relative overflow-hidden">
      {/* Noise */}
      <div className="noise" />

      {/* Left panel — decorative */}
      <div className="hidden lg:flex flex-1 relative items-center justify-center overflow-hidden">
        <div className="grid-lines absolute inset-0" />
        <div className="register-orb-1 orb orb-primary w-[400px] h-[400px] bottom-1/4 left-1/4 z-0" />
        <div className="register-orb-2 orb orb-secondary w-[300px] h-[300px] top-1/4 right-1/4 z-0" style={{ animationDelay: '-10s' }} />

        <div className="absolute inset-0 z-[1]">
          <ParticleField particleCount={60} color="var(--text)" maxDistance={120} speed={0.15} />
        </div>

        <div className="relative z-10 text-center px-12">
          <div className="register-logo mb-6 flex justify-center">
            <span className="font-logo text-3xl font-bold tracking-wider text-[var(--text)]">ALCHEX</span>
          </div>
          <p className="register-tagline text-[var(--text-3)] text-lg max-w-sm mx-auto">
            Your next exchange starts here.
          </p>

          <div className="register-stats mt-12 flex justify-center gap-6">
            {[
              { val: '10K+', lbl: 'Students' },
              { val: '50+', lbl: 'Universities' },
              { val: '4.9', lbl: 'Rating' },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl font-bold text-gradient">{s.val}</div>
                <div className="text-label mt-1">{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-md">
          {/* Logo (mobile) */}
          <Link to="/" className="lg:hidden inline-flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-[0_0_20px_var(--accent-glow)]">
              <span className="font-logo text-4xl font-bold tracking-wider text-[var(--accent)]">ALCHEX</span>
            </div>
            <span className="text-xl font-display font-bold text-gradient">AlchEx</span>
          </Link>

          <div className="register-form-header mb-8">
            <span className="text-label text-[var(--accent-2)] mb-3 block">
              <TextScramble text="/ Create Account" trigger="mount" delay={300} />
            </span>
            <h1 className="text-display text-3xl md:text-4xl text-[var(--text)] mb-2">Join AlchEx</h1>
            <p className="text-[var(--text-2)]">Start exchanging with fellow students</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="register-form-field grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="First Name"
                placeholder="John"
                icon={<User size={16} />}
                error={errors.firstName?.message}
                {...register('firstName')}
              />
              <Input
                label="Last Name"
                placeholder="Doe"
                error={errors.lastName?.message}
                {...register('lastName')}
              />
            </div>

            <div className="register-form-field">
              <Input
                label="University Email"
                type="email"
                placeholder="you@university.edu"
                icon={<Mail size={16} />}
                error={errors.email?.message}
                {...register('email')}
              />
            </div>

            <div className="register-form-field">
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                icon={<Lock size={16} />}
                error={errors.password?.message}
                {...register('password')}
              />
            </div>

            <div className="register-form-field">
              <Input
                label="Confirm Password"
                type="password"
                placeholder="••••••••"
                icon={<Lock size={16} />}
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />
            </div>

            <div className="register-form-submit">
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
                      Create Account
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </div>
              </button>
            </div>
          </form>

          <div className="register-form-footer mt-8 text-center">
            <p className="text-sm text-[var(--text-3)]">
              Already have an account?{' '}
              <Link to="/login" className="text-[var(--accent-2)] hover:text-[var(--accent)] font-medium transition-colors">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
