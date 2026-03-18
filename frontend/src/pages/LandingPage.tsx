import React, { useEffect, useRef, useState, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, ArrowUpRight, Sparkles, ArrowLeftRight, Shield, Star, Zap, MessageCircle, Trophy, Users } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ParticleField } from '../components/ui/ParticleField';
import { TextScramble } from '../components/ui/TextScramble';
import { MouseReveal } from '../components/ui/MouseReveal';
import LiquidBlob from '../components/ui/LiquidBlob';
import DarkVeil from '../components/ui/DarkVeil';
import { RippleGrid } from '../components/ui/RippleGrid';
import '../components/ui/StickyReveal.css';

gsap.registerPlugin(ScrollTrigger);

const ScrollVideoSection = lazy(() => import('../components/landing/ScrollVideoSection'));

/* ─── helpers ─── */
const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

function MarqueeStrip({ children, speed = 30, reverse = false }: { children: React.ReactNode; speed?: number; reverse?: boolean }) {
  return (
    <div className="overflow-hidden whitespace-nowrap">
      <motion.div
        className="flex gap-8 items-center w-max"
        animate={{ x: reverse ? ['-50%', '0%'] : ['0%', '-50%'] }}
        transition={{ duration: speed, repeat: Infinity, ease: 'linear' }}
      >
        {children}
        {children}
      </motion.div>
    </div>
  );
}

function CountUp({ end, suffix = '', duration = 2, delay = 0 }: { end: number; suffix?: string; duration?: number; delay?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!started) return;
    let start = 0;
    const step = end / (duration * 60);
    const id = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(id); }
      else setCount(Math.floor(start));
    }, 1000 / 60);
    return () => clearInterval(id);
  }, [started, end, duration]);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setTimeout(() => setStarted(true), delay * 1000); observer.disconnect(); }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [delay]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ─── Sticky Scrolling Words — faithful to Jhey Tompkins' original ─── */
const SCROLL_WORDS = ['exchange.', 'tutor.', 'trade.', 'mentor.', 'learn.', 'build.', 'grow.'];

function ScrollingTextSection() {
  return (
    <div className="sticky-reveal__wrapper" style={{ '--count': SCROLL_WORDS.length } as React.CSSProperties}>
      <header className="sticky-reveal__header">
        <section className="sticky-reveal__section">
          <h1 className="sticky-reveal__h1">
            <span aria-hidden="true">you can&nbsp;</span>
            <span className="sr-only">you can exchange, tutor, trade, mentor, learn, build, grow.</span>
          </h1>
          <ul className="sticky-reveal__ul" aria-hidden="true">
            {SCROLL_WORDS.map((word, i) => (
              <li key={i} className="sticky-reveal__li">
                {word}
              </li>
            ))}
          </ul>
        </section>
      </header>
    </div>
  );
}

/* ─── page ─── */
export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.08], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.08], [1, 0.96]);
  const heroY = useTransform(scrollYProgress, [0, 0.08], [0, -60]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.fromTo('.hero-logo', { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, duration: 0.9 }, 0.2)
        .fromTo('.hero-tagline', { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.6 }, 0.7)
        .fromTo('.hero-cta', { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.5 }, 1.0)
        .fromTo('.hero-scroll', { opacity: 0 }, { opacity: 1, duration: 0.4 }, 1.3);
    });

    // Refresh ScrollTrigger after Lenis initialises so all trigger positions
    // are computed against the correct scroll geometry.
    const rafId = requestAnimationFrame(() => {
      ScrollTrigger.refresh();
    });

    return () => {
      cancelAnimationFrame(rafId);
      ctx.revert();
    };
  }, []);

  return (
    <div className="relative bg-[var(--bg)] text-[var(--text)]" style={{ overflowX: 'clip' }}>

      {/* ═══ HERO ═══ */}
      <motion.section
        style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
        className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden"
      >
        {/* DarkVeil base layer */}
        <div className="absolute inset-0 z-0" style={{ opacity: 0.5 }}>
          <DarkVeil
            hueShift={0}
            noiseIntensity={0}
            scanlineIntensity={0}
            speed={0.4}
            scanlineFrequency={0}
            warpAmount={0}
            primaryColor="var(--primary)"
            secondaryColor="var(--surface-3)"
          />
        </div>

        <div className="absolute inset-0 z-[2]">
          <ParticleField particleCount={40} color="var(--text)" maxDistance={120} speed={0.15} />
        </div>

        {/* LiquidBlob — LiquidEther fluid sim with color inversion */}
        <LiquidBlob
          mouseForce={10}
          cursorSize={150}
          resolution={0.5}
          dt={0.016}
          BFECC
          showCursorDot
          cursorDotSize={12}
          className="z-20"
        />

        <div className="relative z-10 text-center max-w-6xl mx-auto">
          <div className="hero-logo mb-6 flex justify-center opacity-0">
            <span className="font-logo text-[15vw] lg:text-[20vw] leading-none font-bold tracking-wider text-[var(--text)]">ALCHEX</span>
          </div>

          <p className="hero-tagline text-lg md:text-xl text-[var(--text-2)] max-w-2xl mx-auto mb-10 leading-relaxed font-light opacity-0">
            Trade skills, share knowledge, grow together — all without spending a dime.{' '}
            <span className="font-quote text-2xl text-[var(--accent-2)] tracking-wide">"Zero money. Pure exchange."</span>
          </p>

          <div className="hero-cta flex items-center justify-center opacity-0">
            <Link to="/register" className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-[var(--bg)] to-[var(--surface-3)] rounded-2xl blur-lg opacity-40 group-hover:opacity-70 transition-opacity duration-500" />
              <div className="relative flex items-center gap-3 px-8 py-4 bg-[var(--accent)] text-[var(--bg)] rounded-xl font-semibold text-base hover:bg-[var(--accent-2)] transition-all duration-300">
                Get Started
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </div>

        <div className="hero-scroll absolute bottom-10 left-1/2 -translate-x-1/2 z-10 opacity-0">
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className="flex flex-col items-center gap-2"
          >
            <span className="text-label">Scroll</span>
            <div className="w-5 h-8 rounded-full border border-[var(--border-hover)] flex items-start justify-center p-1.5">
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-1 h-1.5 rounded-full bg-[var(--accent)]"
              />
            </div>
          </motion.div>
        </div>
      </motion.section >

      {/* ═══ SCROLL VIDEO ═══ */}
      < Suspense fallback={null} >
        <ScrollVideoSection />
      </Suspense >

      {/* ═══ SCROLLING "YOU CAN ___" ═══ */}
      < ScrollingTextSection />


      {/* ═══ MARQUEE DIVIDER ═══ */}
      < section className="relative py-6 border-y border-[var(--border)] overflow-hidden" >
        <MarqueeStrip speed={40}>
          {['SKILL EXCHANGE', 'TUTORING', 'NOTES', 'LAB EQUIPMENT', 'TEXTBOOKS', 'PROJECTS', 'MENTORSHIP', 'RESEARCH', 'DESIGN', 'CODING'].map((t, i) => (
            <span key={i} className="text-sm font-mono uppercase tracking-[0.2em] text-[var(--text-3)] flex items-center gap-4">
              <span className="w-1 h-1 rounded-full bg-[var(--accent)] opacity-50" />
              {t}
            </span>
          ))}
        </MarqueeStrip>
      </section >

      {/* ═══ STATS ═══ */}
      < section className="relative py-16 sm:py-24 md:py-32 px-4 sm:px-6" >
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[var(--border)] rounded-2xl overflow-hidden">
            {[
              { value: 10000, suffix: '+', label: 'Active Students', accent: true },
              { value: 25000, suffix: '+', label: 'Exchanges Made', accent: false },
              { value: 50, suffix: '+', label: 'Universities', accent: false },
              { value: 4.9, suffix: '', label: 'Avg Rating', accent: true },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6, ease }}
                className="bg-[var(--surface)] p-5 sm:p-8 text-center relative group"
              >
                <div className="font-bold text-display mb-2" style={{ fontSize: 'clamp(1.5rem, 4vw, 3rem)' }}>
                  <span className={stat.accent ? 'text-gradient' : 'text-[var(--text)]'}>
                    {typeof stat.value === 'number' && stat.value >= 100
                      ? <CountUp end={stat.value} suffix={stat.suffix} delay={i * 0.15} />
                      : <>{stat.value}{stat.suffix}</>
                    }
                  </span>
                </div>
                <p className="text-label">{stat.label}</p>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-[var(--accent)] group-hover:w-full transition-all duration-500" />
              </motion.div>
            ))}
          </div>
        </div>
      </section >

      {/* ═══ HOW IT WORKS (with Mouse Reveal) ═══ */}
      < section className="relative py-16 sm:py-24 md:py-32 px-4 sm:px-6" >
        <div className="orb orb-primary w-[400px] h-[400px] top-0 right-0 z-0" style={{ animationDelay: '-5s' }} />

        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease }}
            className="mb-20"
          >
            <span className="text-label text-[var(--accent-2)] mb-4 block">
              <TextScramble text="/ Process" trigger="inView" />
            </span>
            <MouseReveal
              className="text-display"
              style={{ fontSize: 'clamp(1.75rem, 5vw, 3.75rem)' }}
              frontText="How it works"
              backText="How it works"
              revealSize={150}
            />
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: '01', icon: Zap, title: 'Create Request', desc: 'Post what you need and what you can offer in return.' },
              { step: '02', icon: MessageCircle, title: 'Get Proposals', desc: 'Students browse and submit proposals. Chat to negotiate.' },
              { step: '03', icon: ArrowLeftRight, title: 'Exchange', desc: 'Accept the best offer. Both sides deliver.' },
              { step: '04', icon: Trophy, title: 'Build Reputation', desc: 'Rate each other. Climb the leaderboard.' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.6, ease }}
                className="glass-card p-6 group relative"
              >
                <span className="text-mono text-[var(--accent)] mb-6 block">{item.step}</span>
                <span className="absolute -top-2 -right-1 text-[7rem] font-bold text-[var(--text)]/[0.015] group-hover:text-[var(--accent)]/[0.08] transition-colors duration-700 text-display leading-none pointer-events-none">
                  {item.step}
                </span>
                <div className="w-10 h-10 rounded-lg bg-[var(--accent-sub)] border border-[var(--accent-sub)] flex items-center justify-center mb-4 group-hover:bg-[var(--accent-sub)] group-hover:shadow-[0_0_20px_var(--accent-sub)] transition-all duration-500">
                  <item.icon size={18} className="text-[var(--accent-2)]" />
                </div>
                <h3 className="font-display font-bold text-[var(--text)] text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-[var(--text-2)] leading-relaxed">{item.desc}</p>
                {i < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-px bg-gradient-to-r from-[var(--accent-glow)] to-transparent" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section >

      {/* ═══ FEATURES ═══ */}
      < section className="relative py-16 sm:py-24 md:py-32 px-4 sm:px-6" >
        <div className="section-line mb-20" />
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <span className="text-label text-[var(--accent-2)] mb-4 block">
              <TextScramble text="/ Features" trigger="inView" />
            </span>
            <h2 className="text-display text-[var(--text)] mb-4" style={{ fontSize: 'clamp(1.75rem, 5vw, 3.75rem)' }}>
              Built for <span className="text-gradient">excellence</span>
            </h2>
            <p className="text-[var(--text-2)] max-w-lg text-lg">Every feature crafted to make exchanging seamless, safe, and rewarding.</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { icon: Shield, title: 'Verified .edu Only', desc: 'Only university students with verified .edu emails can join. Safe by design.', span: 'sm:col-span-2 md:col-span-2' },
              { icon: ArrowLeftRight, title: 'Fair Exchange', desc: 'Structured transaction lifecycle ensures both sides are satisfied.', span: '' },
              { icon: MessageCircle, title: 'Real-Time Chat', desc: 'Built-in messaging with typing indicators. Negotiate instantly.', span: '' },
              { icon: Star, title: 'Reputation System', desc: 'Weighted ratings build trust. Your reputation is your currency.', span: '' },
              { icon: Trophy, title: 'Leaderboard', desc: 'Top exchangers get recognition. Compete to be the best.', span: '' },
              { icon: Users, title: 'Multi-University', desc: 'Connect with students across campuses and programs.', span: 'sm:col-span-2 md:col-span-2' },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5, ease }}
                className={`glass-card p-6 group ${feature.span}`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[var(--accent-sub)] border border-[var(--accent-sub)] flex items-center justify-center shrink-0 group-hover:bg-[var(--accent-sub)] transition-all duration-500">
                    <feature.icon size={18} className="text-[var(--accent-2)]" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-[var(--text)] mb-1.5">{feature.title}</h3>
                    <p className="text-sm text-[var(--text-2)] leading-relaxed">{feature.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section >

      {/* ═══ TOP ALCHEMISTS ═══ */}
      < section className="relative py-16 sm:py-24 md:py-32 px-4 sm:px-6 overflow-hidden" >
        <div className="orb orb-primary w-[500px] h-[500px] top-1/4 left-1/2 -translate-x-1/2 z-0" />
        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease }}
            className="text-center mb-16"
          >
            <span className="text-label text-[var(--accent-2)] mb-4 block">
              <TextScramble text="/ Leaderboard" trigger="inView" />
            </span>
            <h2 className="text-display text-[var(--text)]" style={{ fontSize: 'clamp(1.75rem, 5vw, 3.75rem)' }}>
              Top <span className="text-gradient">alchemists</span>
            </h2>
          </motion.div>

          <div className="flex flex-col sm:flex-row items-end justify-center gap-6">
            {[
              { rank: 2, name: 'Sarah C.', score: 4.8, exchanges: 42 },
              { rank: 1, name: 'Alex M.', score: 4.9, exchanges: 67 },
              { rank: 3, name: 'Jordan K.', score: 4.7, exchanges: 38 },
            ].map((user, i) => {
              const isFirst = user.rank === 1;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.6, ease }}
                  className={`flex-1 ${isFirst ? 'order-first sm:order-none' : ''}`}
                >
                  <div className={`glass-card p-6 text-center relative ${isFirst ? 'glow-strong border-[var(--accent-sub)]' : ''}`}>
                    {isFirst && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="pill text-[var(--accent)]">
                          <Sparkles size={12} /> #1
                        </span>
                      </div>
                    )}
                    <div className={`mx-auto mb-3 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] flex items-center justify-center font-bold text-[var(--avatar-initials)] ${isFirst ? 'w-20 h-20 text-2xl shadow-[0_0_40px_var(--accent-glow)]' : 'w-14 h-14 text-lg'}`}>
                      {user.name.charAt(0)}
                    </div>
                    <h3 className="font-display font-bold text-[var(--text)] text-lg">{user.name}</h3>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <Star size={14} className="text-[var(--accent)] fill-[var(--accent)]" />
                      <span className="text-[var(--accent-2)] font-semibold">{user.score}</span>
                    </div>
                    <p className="text-label mt-2">{user.exchanges} exchanges</p>
                    <div className={`mt-4 rounded-t-lg bg-gradient-to-t from-[var(--accent-sub)] to-transparent ${isFirst ? 'h-16' : user.rank === 2 ? 'h-10' : 'h-6'}`} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section >

      {/* ═══ MARQUEE CTA ═══ */}
      < section className="py-8 border-y border-[var(--border)]" >
        <MarqueeStrip speed={60} reverse>
          {Array(8).fill(null).map((_, i) => (
            <span key={i} className="text-display tracking-tight flex items-center gap-8" style={{ fontSize: 'clamp(1.5rem, 4vw, 3rem)', color: 'rgba(255,255,255,0.15)' }}>
              EQUIVALENT EXCHANGE
              <span className="w-2 h-2 rounded-full bg-[var(--accent)] opacity-10" />
            </span>
          ))}
        </MarqueeStrip>
      </section >

      {/* ═══ FINAL CTA ═══ */}
      < section className="relative py-16 sm:py-24 md:py-32 px-4 sm:px-6" >
        {/* RippleGrid background — replaces the previous light beam effect */}
        < div className="absolute z-0" style={{ top: '0%', bottom: '0%', left: '-20%', right: '-20%' }} >
          <RippleGrid
            gridSize={62}
            gridLineColor="rgba(255, 255, 255, 0.08)"
            rippleColor="var(--accent-glow)"
            rippleDuration={8.5}
            style={{ width: '100%', height: '100%' }}
          />
        </div >
        <div className="orb orb-primary w-[600px] h-[600px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0" />

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease }}
          className="relative z-10 max-w-3xl mx-auto text-center"
        >
          <h2 className="text-display text-[var(--text)] mb-6" style={{ fontSize: 'clamp(1.75rem, 5vw, 4.5rem)' }}>
            Ready to{' '}
            <span className="text-[var(--text)]">exchange?</span>
          </h2>
          <p className="text-3xl font-quote text-[var(--accent-2)] tracking-wide mb-12 max-w-xl mx-auto leading-relaxed">
            "Thousands of students. One community. Zero cost."
          </p>
          <Link to="/register" className="group relative inline-flex">
            <div className="absolute -inset-2 bg-gradient-to-r from-[var(--accent)] via-[var(--accent)] to-[var(--accent-2)] rounded-2xl blur-xl opacity-30 group-hover:opacity-60 transition-opacity duration-700" />
            <div className="relative flex items-center gap-3 px-10 py-5 bg-[var(--accent)] text-[var(--bg)] rounded-xl font-bold text-lg hover:bg-[var(--accent)] transition-all duration-300 shadow-[0_0_40px_var(--accent-glow)]">
              Begin Your Journey
              <Sparkles size={20} className="group-hover:rotate-12 transition-transform" />
            </div>
          </Link>
        </motion.div>
      </section >

      {/* ═══ FOOTER ═══ */}
      < footer className="border-t border-[var(--border)] py-16 px-6 bg-[var(--surface)]" >
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-start justify-between gap-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl overflow-hidden shadow-[0_0_20px_var(--accent-glow)]">
                  <span className="font-logo text-2xl font-bold tracking-wider text-[var(--accent)]">ALCHEX</span>
                </div>
                <span className="font-logo text-3xl font-bold tracking-wider text-[var(--text)]">ALCHEX</span>
              </div>
              <p className="text-sm text-[var(--text-3)] max-w-xs">
                Where every skill finds its match.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-12 text-sm">
              <div>
                <h4 className="text-label mb-4">Platform</h4>
                <div className="space-y-3">
                  <Link to="/marketplace" className="block text-[var(--text-2)] hover:text-[var(--text)] transition-colors">Marketplace</Link>
                  <Link to="/leaderboard" className="block text-[var(--text-2)] hover:text-[var(--text)] transition-colors">Leaderboard</Link>
                  <Link to="/register" className="block text-[var(--text-2)] hover:text-[var(--text)] transition-colors">Get Started</Link>
                </div>
              </div>
              <div>
                <h4 className="text-label mb-4">Legal</h4>
                <div className="space-y-3">
                  <a href="#" className="block text-[var(--text-2)] hover:text-[var(--text)] transition-colors">Privacy</a>
                  <a href="#" className="block text-[var(--text-2)] hover:text-[var(--text)] transition-colors">Terms</a>
                  <a href="#" className="block text-[var(--text-2)] hover:text-[var(--text)] transition-colors">Contact</a>
                </div>
              </div>
              <div>
                <h4 className="text-label mb-4">Community</h4>
                <div className="space-y-3">
                  <a href="#" className="block text-[var(--text-2)] hover:text-[var(--text)] transition-colors">Discord</a>
                  <a href="#" className="block text-[var(--text-2)] hover:text-[var(--text)] transition-colors">Twitter</a>
                  <a href="#" className="block text-[var(--text-2)] hover:text-[var(--text)] transition-colors">GitHub</a>
                </div>
              </div>
            </div>
          </div>
          <div className="section-line mt-12 mb-8" />
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[var(--text-3)]">
            <p>&copy; 2026 AlchEx. Where every skill finds its match.</p>
            <p className="text-mono">v1.0.0</p>
          </div>
        </div>
      </footer >
    </div >
  );
}
