import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, ArrowUpRight, Sparkles, ArrowLeftRight, Shield, Star, Zap, MessageCircle, Trophy, Users } from 'lucide-react';
import { ParticleField } from '../components/ui/ParticleField';

/* ─────────────────────── helpers ─────────────────────── */
const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

function SplitText({ text, className = '', delay = 0 }: { text: string; className?: string; delay?: number }) {
  return (
    <span className={className} aria-label={text}>
      {text.split('').map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 80, rotateX: -90 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 0.8, delay: delay + i * 0.04, ease }}
          className="inline-block"
          style={{ transformOrigin: 'bottom' }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </span>
  );
}

function MarqueeStrip({ children, speed = 30, reverse = false }: { children: React.ReactNode; speed?: number; reverse?: boolean }) {
  return (
    <div className="overflow-hidden whitespace-nowrap">
      <motion.div
        className="flex gap-8 items-center"
        animate={{ x: reverse ? ['0%', '50%'] : ['0%', '-50%'] }}
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

/* ─────────────────────── page ─────────────────────── */
export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.08], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.08], [1, 0.96]);
  const heroY = useTransform(scrollYProgress, [0, 0.08], [0, -60]);

  return (
    <div className="relative bg-[var(--bg)] text-[var(--text)] overflow-hidden">

      {/* ═══════════════════ HERO ═══════════════════ */}
      <motion.section
        style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
        className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden"
      >
        {/* Orbs */}
        <div className="orb orb-purple w-[500px] h-[500px] -top-40 -left-40 z-0" />
        <div className="orb orb-blue w-[400px] h-[400px] top-1/3 -right-32 z-0" style={{ animationDelay: '-7s' }} />
        <div className="orb orb-pink w-[300px] h-[300px] bottom-20 left-1/4 z-0" style={{ animationDelay: '-14s' }} />

        {/* Particles */}
        <div className="absolute inset-0 z-[1]">
          <ParticleField particleCount={60} color="139, 92, 246" maxDistance={120} speed={0.15} />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center max-w-6xl mx-auto">
          {/* Pill badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8, ease }}
            className="mb-8"
          >
            <span className="pill">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
              The Law of Equivalent Exchange
            </span>
          </motion.div>

          {/* ALCHEX title */}
          <h1 className="text-display leading-none mb-6">
            <div className="text-[clamp(4rem,15vw,12rem)] tracking-[-0.06em]">
              <SplitText text="ALCHEX" className="text-gradient-shine" delay={0.5} />
            </div>
          </h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.8, ease }}
            className="text-lg md:text-xl text-[var(--text-2)] max-w-2xl mx-auto mb-10 leading-relaxed font-light"
          >
            A non-monetary student exchange platform where skills, knowledge,
            and resources flow freely. <span className="text-[var(--accent-2)]">No money. Just equivalent exchange.</span>
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.8, duration: 0.6, ease }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/register" className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-[var(--accent)] to-purple-400 rounded-2xl blur-lg opacity-40 group-hover:opacity-70 transition-opacity duration-500" />
              <div className="relative flex items-center gap-3 px-8 py-4 bg-[var(--accent)] text-white rounded-xl font-semibold text-base hover:bg-purple-500 transition-all duration-300">
                Get Started
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
            <Link
              to="/marketplace"
              className="flex items-center gap-3 px-8 py-4 rounded-xl border border-[var(--border-hover)] text-[var(--text-2)] hover:text-white hover:border-[var(--accent)] transition-all duration-300 font-medium text-base"
            >
              Explore Marketplace
              <ArrowUpRight size={16} />
            </Link>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10"
        >
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
        </motion.div>
      </motion.section>

      {/* ═══════════════════ MARQUEE DIVIDER ═══════════════════ */}
      <section className="relative py-6 border-y border-[var(--border)] overflow-hidden bg-[var(--surface)]/50">
        <MarqueeStrip speed={40}>
          {['SKILL EXCHANGE', 'TUTORING', 'NOTES', 'LAB EQUIPMENT', 'TEXTBOOKS', 'PROJECTS', 'MENTORSHIP', 'RESEARCH', 'DESIGN', 'CODING'].map((t, i) => (
            <span key={i} className="text-sm font-mono uppercase tracking-[0.2em] text-[var(--text-3)] flex items-center gap-4">
              <span className="w-1 h-1 rounded-full bg-[var(--accent)] opacity-50" />
              {t}
            </span>
          ))}
        </MarqueeStrip>
      </section>

      {/* ═══════════════════ STATS ═══════════════════ */}
      <section className="relative py-32 px-6">
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
                className="bg-[var(--surface)] p-8 text-center relative group"
              >
                <div className="text-4xl md:text-5xl font-bold text-display mb-2">
                  <span className={stat.accent ? 'text-gradient' : 'text-white'}>
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
      </section>

      {/* ═══════════════════ HOW IT WORKS ═══════════════════ */}
      <section className="relative py-32 px-6">
        <div className="orb orb-purple w-[400px] h-[400px] top-0 right-0 z-0" style={{ animationDelay: '-5s' }} />

        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease }}
            className="mb-20"
          >
            <span className="text-label text-[var(--accent-2)] mb-4 block">/ Process</span>
            <h2 className="text-display text-4xl md:text-6xl text-white">
              How it <span className="text-gradient">works</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '01', icon: Zap, title: 'Create Request', desc: 'Post what you need and what you can offer. Be specific—great posts attract great offers.' },
              { step: '02', icon: MessageCircle, title: 'Get Proposals', desc: 'Students browse and submit proposals. Chat in real-time to negotiate the exchange.' },
              { step: '03', icon: ArrowLeftRight, title: 'Exchange', desc: 'Accept the best offer. Both parties complete their side of the exchange.' },
              { step: '04', icon: Trophy, title: 'Build Reputation', desc: 'Rate each other. Climb the leaderboard. Become a top alchemist.' },
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

                <span className="absolute -top-2 -right-1 text-[7rem] font-bold text-white/[0.02] group-hover:text-[rgba(139,92,246,0.05)] transition-colors duration-700 text-display leading-none pointer-events-none">
                  {item.step}
                </span>

                <div className="w-10 h-10 rounded-lg bg-[rgba(139,92,246,0.08)] border border-[rgba(139,92,246,0.2)] flex items-center justify-center mb-4 group-hover:bg-[rgba(139,92,246,0.2)] group-hover:shadow-[0_0_20px_rgba(139,92,246,0.2)] transition-all duration-500">
                  <item.icon size={18} className="text-[var(--accent-2)]" />
                </div>

                <h3 className="font-display font-bold text-white text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-[var(--text-2)] leading-relaxed">{item.desc}</p>

                {i < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-px bg-gradient-to-r from-[rgba(139,92,246,0.4)] to-transparent" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ FEATURES BENTO GRID ═══════════════════ */}
      <section className="relative py-32 px-6">
        <div className="section-line mb-20" />

        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <span className="text-label text-[var(--accent-2)] mb-4 block">/ Features</span>
            <h2 className="text-display text-4xl md:text-6xl text-white mb-4">
              Built for <span className="text-gradient">excellence</span>
            </h2>
            <p className="text-[var(--text-2)] max-w-lg text-lg">Every feature designed to make exchanging seamless, safe, and rewarding.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: Shield, title: 'Verified .edu Only', desc: 'Only university students with verified .edu emails can join the community. Safe by design.', span: 'md:col-span-2' },
              { icon: ArrowLeftRight, title: 'Fair Exchange', desc: 'Strict transaction lifecycle ensures both parties are satisfied before completion.', span: '' },
              { icon: MessageCircle, title: 'Real-Time Chat', desc: 'Built-in messaging with typing indicators. Negotiate exchanges instantly.', span: '' },
              { icon: Star, title: 'Reputation System', desc: 'Weighted rating algorithm builds trust. Your reputation is your currency.', span: '' },
              { icon: Trophy, title: 'Leaderboard', desc: 'Top exchangers get recognition. Compete to be the best alchemist on campus.', span: '' },
              { icon: Users, title: 'Multi-University', desc: 'Connect with students across different campuses and programs. Exchange knows no bounds.', span: 'md:col-span-2' },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5, ease }}
                className={`glass-card gradient-border p-6 group ${feature.span}`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[rgba(139,92,246,0.08)] border border-[rgba(139,92,246,0.1)] flex items-center justify-center shrink-0 group-hover:bg-[rgba(139,92,246,0.2)] transition-all duration-500">
                    <feature.icon size={18} className="text-[var(--accent-2)]" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-white mb-1.5">{feature.title}</h3>
                    <p className="text-sm text-[var(--text-2)] leading-relaxed">{feature.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ TOP ALCHEMISTS ═══════════════════ */}
      <section className="relative py-32 px-6 overflow-hidden">
        <div className="orb orb-purple w-[500px] h-[500px] top-1/4 left-1/2 -translate-x-1/2 z-0" />

        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease }}
            className="text-center mb-16"
          >
            <span className="text-label text-[var(--accent-2)] mb-4 block">/ Leaderboard</span>
            <h2 className="text-display text-4xl md:text-6xl text-white">
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
                  <div className={`glass-card p-6 text-center relative ${isFirst ? 'glow-strong border-[rgba(139,92,246,0.2)]' : ''}`}>
                    {isFirst && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="pill text-[var(--accent)]">
                          <Sparkles size={12} /> #1
                        </span>
                      </div>
                    )}

                    <div className={`mx-auto mb-3 rounded-full bg-gradient-to-br from-[var(--accent)] to-purple-400 flex items-center justify-center font-bold text-white ${isFirst ? 'w-20 h-20 text-2xl shadow-[0_0_40px_rgba(139,92,246,0.3)]' : 'w-14 h-14 text-lg'}`}>
                      {user.name.charAt(0)}
                    </div>

                    <h3 className="font-display font-bold text-white text-lg">{user.name}</h3>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <Star size={14} className="text-[var(--accent)] fill-[var(--accent)]" />
                      <span className="text-[var(--accent-2)] font-semibold">{user.score}</span>
                    </div>
                    <p className="text-label mt-2">{user.exchanges} exchanges</p>

                    <div className={`mt-4 rounded-t-lg bg-gradient-to-t from-[rgba(139,92,246,0.1)] to-transparent ${isFirst ? 'h-16' : user.rank === 2 ? 'h-10' : 'h-6'}`} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════ MARQUEE CTA ═══════════════════ */}
      <section className="py-8 border-y border-[var(--border)] bg-[rgba(10,10,15,0.3)]">
        <MarqueeStrip speed={25} reverse>
          {Array(6).fill(null).map((_, i) => (
            <span key={i} className="text-display text-4xl md:text-5xl text-white/[0.04] tracking-tight flex items-center gap-8">
              EQUIVALENT EXCHANGE
              <span className="w-2 h-2 rounded-full bg-[var(--accent)] opacity-30" />
            </span>
          ))}
        </MarqueeStrip>
      </section>

      {/* ═══════════════════ FINAL CTA ═══════════════════ */}
      <section className="relative py-40 px-6 overflow-hidden">
        <div className="orb orb-purple w-[600px] h-[600px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0" />

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease }}
          className="relative z-10 max-w-3xl mx-auto text-center"
        >
          <h2 className="text-display text-5xl md:text-7xl text-white mb-6">
            Ready to{' '}
            <span className="text-gradient-shine">exchange?</span>
          </h2>
          <p className="text-lg text-[var(--text-2)] mb-12 max-w-xl mx-auto leading-relaxed">
            Join thousands of students already exchanging skills, knowledge, and help.
            Start your alchemy today.
          </p>
          <Link to="/register" className="group relative inline-flex">
            <div className="absolute -inset-2 bg-gradient-to-r from-[var(--accent)] via-purple-500 to-pink-500 rounded-2xl blur-xl opacity-30 group-hover:opacity-60 transition-opacity duration-700" />
            <div className="relative flex items-center gap-3 px-10 py-5 bg-[var(--accent)] text-white rounded-xl font-bold text-lg hover:bg-purple-500 transition-all duration-300 shadow-[0_0_40px_rgba(139,92,246,0.3)]">
              Begin Your Journey
              <Sparkles size={20} className="group-hover:rotate-12 transition-transform" />
            </div>
          </Link>
        </motion.div>
      </section>

      {/* ═══════════════════ FOOTER ═══════════════════ */}
      <footer className="border-t border-[var(--border)] py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-start justify-between gap-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent)] to-purple-400 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.3)]">
                  <span className="text-lg">🔮</span>
                </div>
                <span className="text-xl font-display font-bold text-gradient">AlchEx</span>
              </div>
              <p className="text-sm text-[var(--text-3)] max-w-xs">
                The student exchange platform built on the principle of equivalent exchange.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-12 text-sm">
              <div>
                <h4 className="text-label mb-4">Platform</h4>
                <div className="space-y-3">
                  <Link to="/marketplace" className="block text-[var(--text-2)] hover:text-white transition-colors">Marketplace</Link>
                  <Link to="/leaderboard" className="block text-[var(--text-2)] hover:text-white transition-colors">Leaderboard</Link>
                  <Link to="/register" className="block text-[var(--text-2)] hover:text-white transition-colors">Get Started</Link>
                </div>
              </div>
              <div>
                <h4 className="text-label mb-4">Legal</h4>
                <div className="space-y-3">
                  <a href="#" className="block text-[var(--text-2)] hover:text-white transition-colors">Privacy</a>
                  <a href="#" className="block text-[var(--text-2)] hover:text-white transition-colors">Terms</a>
                  <a href="#" className="block text-[var(--text-2)] hover:text-white transition-colors">Contact</a>
                </div>
              </div>
              <div>
                <h4 className="text-label mb-4">Community</h4>
                <div className="space-y-3">
                  <a href="#" className="block text-[var(--text-2)] hover:text-white transition-colors">Discord</a>
                  <a href="#" className="block text-[var(--text-2)] hover:text-white transition-colors">Twitter</a>
                  <a href="#" className="block text-[var(--text-2)] hover:text-white transition-colors">GitHub</a>
                </div>
              </div>
            </div>
          </div>

          <div className="section-line mt-12 mb-8" />

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[var(--text-3)]">
            <p>&copy; 2026 AlchEx. Built with equivalent exchange in mind.</p>
            <p className="text-mono">v1.0.0</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
