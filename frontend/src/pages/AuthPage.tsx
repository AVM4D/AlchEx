import { useEffect, useRef, useCallback } from 'react';
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
import FireflySwarm, { FireflySwarmHandle } from '../components/ui/FireflySwarm';
import toast from 'react-hot-toast';

/* ─────────── Schemas ─────────── */

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
});

const registerSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required').max(50),
    lastName: z.string().min(1, 'Last name is required').max(50),
    email: z
      .string()
      .email('Invalid email')
      .refine((e) => /\.edu(\.[a-z]{2})?$/i.test(e), {
        message: 'Only .edu email addresses are allowed (e.g. .edu, .edu.pk)',
      }),
    password: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[A-Z]/, 'Needs one uppercase letter')
      .regex(/[a-z]/, 'Needs one lowercase letter')
      .regex(/[0-9]/, 'Needs one number')
      .regex(/[^A-Za-z0-9]/, 'Needs one special character'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

/* ─────────── Component ─────────── */

interface AuthPageProps {
  initialMode?: 'login' | 'register';
}

export default function AuthPage({ initialMode = 'login' }: AuthPageProps) {
  const navigate = useNavigate();
  const { login, register: registerUser, isLoading } = useAuthStore();
  const transitionRef = useRef<FireflySwarmHandle | null>(null);

  // Determine which view to show initially based on route
  const startAsRegister = initialMode === 'register';

  /* ─── Login form ─── */
  const {
    register: loginRegister,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  /* ─── Register form ─── */
  const {
    register: regRegister,
    handleSubmit: handleRegSubmit,
    formState: { errors: regErrors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  /* ─── GSAP entrance (runs once on mount) ─── */
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.fromTo(
        '.auth-logo',
        { opacity: 0, scale: 0.85, y: 30 },
        { opacity: 1, scale: 1, y: 0, duration: 1 },
        0
      ).fromTo(
        '.auth-tagline',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8 },
        0.4
      );

      // Orb parallax
      gsap.to('.auth-orb-1', {
        y: -30,
        x: 20,
        duration: 8,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
      gsap.to('.auth-orb-2', {
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

  /* ─── Submit handlers ─── */
  const onLoginSubmit = async (data: LoginForm) => {
    try {
      await login(data.email, data.password, data.rememberMe);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed');
    }
  };

  const onRegisterSubmit = async (data: RegisterForm) => {
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

  /* ─── Trigger morph curtain transition ─── */
  const triggerTransition = useCallback(
    (targetMode: 'login' | 'register') => {
      const handle = transitionRef.current;
      if (!handle) return;
      handle.trigger();
      window.history.replaceState(
        null,
        '',
        targetMode === 'login' ? '/login' : '/register'
      );
    },
    []
  );

  /* ─── Login Layout: Branding LEFT — Form RIGHT ─── */
  const loginLayout = (
    <div className="min-h-screen bg-[var(--bg)] flex relative overflow-hidden w-full h-full">
      <div className="noise" />

      {/* LEFT — branding */}
      <div className="hidden lg:flex flex-1 relative items-center justify-center overflow-hidden">
        <div className="grid-lines absolute inset-0" />
        <div className="auth-orb-1 orb orb-primary w-[400px] h-[400px] top-1/4 left-1/4 z-0" />
        <div
          className="auth-orb-2 orb orb-blue w-[300px] h-[300px] bottom-1/4 right-1/4 z-0"
          style={{ animationDelay: '-8s' }}
        />
        <div className="absolute inset-0 z-[1]">
          <ParticleField
            particleCount={60}
            color="255, 255, 255"
            maxDistance={120}
            speed={0.15}
          />
        </div>
        <div className="relative z-10 text-center px-12">
          <div className="auth-logo mb-6 flex justify-center">
            <span className="font-logo text-3xl font-bold tracking-wider text-[var(--text)]">ALCHEX</span>
          </div>
          <p className="auth-tagline text-[var(--text-3)] text-lg max-w-sm mx-auto">
            Your skills have value. Exchange them.
          </p>
        </div>
      </div>

      {/* RIGHT — login form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-md">
          <Link to="/" className="lg:hidden inline-flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-[0_0_20px_var(--accent-glow)]">
              <span className="font-logo text-4xl font-bold tracking-wider text-[var(--accent)]">ALCHEX</span>
            </div>
            <span className="text-xl font-display font-bold text-gradient">AlchEx</span>
          </Link>

          <div className="login-form-header mb-8" data-stagger>
            <span className="text-label text-[var(--accent-2)] mb-3 block">
              <TextScramble text="/ Sign In" trigger="mount" delay={300} />
            </span>
            <h1 className="text-display text-3xl md:text-4xl text-[var(--text)] mb-2">Welcome back</h1>
            <p className="text-[var(--text-2)]">Continue your exchange journey</p>
          </div>

          <form onSubmit={handleLoginSubmit(onLoginSubmit)} className="space-y-5">
            <div className="login-form-field" data-stagger>
              <Input
                label="Email"
                type="email"
                placeholder="you@university.edu"
                icon={<Mail size={16} />}
                error={loginErrors.email?.message}
                {...loginRegister('email')}
              />
            </div>

            <div className="login-form-field" data-stagger>
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                icon={<Lock size={16} />}
                error={loginErrors.password?.message}
                {...loginRegister('password')}
              />
            </div>

            <div className="login-form-field" data-stagger>
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    {...loginRegister('rememberMe')}
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

            <div className="login-form-submit" data-stagger>
              <button type="submit" disabled={isLoading} className="group relative w-full mt-2">
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

          <div className="login-form-footer mt-8 text-center" data-stagger>
            <p className="text-sm text-[var(--text-3)]">
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => triggerTransition('register')}
                className="text-[var(--accent-2)] hover:text-[var(--accent)] font-medium transition-colors cursor-pointer"
              >
                Create Account
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  /* ─── Register Layout: Form LEFT — Branding RIGHT ─── */
  const registerLayout = (
    <div className="min-h-screen bg-[var(--bg)] flex relative overflow-hidden w-full h-full">
      <div className="noise" />

      {/* LEFT — register form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-md">
          <Link to="/" className="lg:hidden inline-flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-[0_0_20px_var(--accent-glow)]">
              <span className="font-logo text-4xl font-bold tracking-wider text-[var(--accent)]">ALCHEX</span>
            </div>
            <span className="text-xl font-display font-bold text-gradient">AlchEx</span>
          </Link>

          <div className="register-form-header mb-8" data-stagger>
            <span className="text-label text-[var(--accent-2)] mb-3 block">
              <TextScramble text="/ Create Account" trigger="mount" delay={300} />
            </span>
            <h1 className="text-display text-3xl md:text-4xl text-[var(--text)] mb-2">Join AlchEx</h1>
            <p className="text-[var(--text-2)]">Start exchanging with fellow students</p>
          </div>

          <form onSubmit={handleRegSubmit(onRegisterSubmit)} className="space-y-4">
            <div className="register-form-field grid grid-cols-1 sm:grid-cols-2 gap-4" data-stagger>
              <Input
                label="First Name"
                placeholder="John"
                icon={<User size={16} />}
                error={regErrors.firstName?.message}
                {...regRegister('firstName')}
              />
              <Input
                label="Last Name"
                placeholder="Doe"
                error={regErrors.lastName?.message}
                {...regRegister('lastName')}
              />
            </div>

            <div className="register-form-field" data-stagger>
              <Input
                label="University Email"
                type="email"
                placeholder="you@university.edu"
                icon={<Mail size={16} />}
                error={regErrors.email?.message}
                {...regRegister('email')}
              />
            </div>

            <div className="register-form-field" data-stagger>
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                icon={<Lock size={16} />}
                error={regErrors.password?.message}
                {...regRegister('password')}
              />
            </div>

            <div className="register-form-field" data-stagger>
              <Input
                label="Confirm Password"
                type="password"
                placeholder="••••••••"
                icon={<Lock size={16} />}
                error={regErrors.confirmPassword?.message}
                {...regRegister('confirmPassword')}
              />
            </div>

            <div className="register-form-submit" data-stagger>
              <button type="submit" disabled={isLoading} className="group relative w-full mt-2">
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

          <div className="register-form-footer mt-8 text-center" data-stagger>
            <p className="text-sm text-[var(--text-3)]">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => triggerTransition('login')}
                className="text-[var(--accent-2)] hover:text-[var(--accent)] font-medium transition-colors cursor-pointer"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT — branding */}
      <div className="hidden lg:flex flex-1 relative items-center justify-center overflow-hidden">
        <div className="grid-lines absolute inset-0" />
        <div className="auth-orb-1 orb orb-primary w-[400px] h-[400px] bottom-1/4 left-1/4 z-0" />
        <div
          className="auth-orb-2 orb orb-secondary w-[300px] h-[300px] top-1/4 right-1/4 z-0"
          style={{ animationDelay: '-10s' }}
        />
        <div className="absolute inset-0 z-[1]">
          <ParticleField
            particleCount={60}
            color="255, 255, 255"
            maxDistance={120}
            speed={0.15}
          />
        </div>
        <div className="relative z-10 text-center px-12">
          <div className="auth-logo mb-6 flex justify-center">
            <span className="font-logo text-3xl font-bold tracking-wider text-[var(--text)]">ALCHEX</span>
          </div>
          <p className="auth-tagline text-[var(--text-3)] text-lg max-w-sm mx-auto">
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
    </div>
  );

  // Determine which layout is "first" (default) and which is "second" (active)
  const firstLayout = startAsRegister ? registerLayout : loginLayout;
  const secondLayout = startAsRegister ? loginLayout : registerLayout;

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <FireflySwarm
        firstContent={firstLayout}
        secondContent={secondLayout}
        duration={1.8}
        fireflyCount={70}
        style={{ width: '100%', height: '100%' }}
        handleRef={transitionRef}
      />
    </div>
  );
}
