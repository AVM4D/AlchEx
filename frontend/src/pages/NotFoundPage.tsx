import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative orbs */}
      <div className="orb orb-purple w-96 h-96 -top-48 -right-48" />
      <div className="orb orb-blue w-64 h-64 bottom-20 -left-32" />
      <div className="noise" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center relative z-10">
        {/* Glitchy 404 */}
        <div className="relative mb-8">
          <h1 className="font-display font-black text-[clamp(6rem,20vw,14rem)] leading-none text-transparent bg-clip-text bg-gradient-to-b from-white/20 to-transparent select-none">
            404
          </h1>
          <h1 className="font-display font-black text-[clamp(6rem,20vw,14rem)] leading-none text-gradient absolute inset-0">
            404
          </h1>
        </div>

        <h2 className="text-display text-xl md:text-2xl text-white mb-3">Page not found</h2>
        <p className="text-sm text-[var(--text-3)] max-w-md mx-auto mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link to="/" className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[var(--accent)] to-purple-400 rounded-xl blur opacity-30 group-hover:opacity-60 transition-opacity" />
            <div className="relative flex items-center gap-2 px-5 py-2.5 bg-[var(--accent)] text-white rounded-lg text-sm font-medium">
              <Home size={14} /> Go Home
            </div>
          </Link>
          <button onClick={() => window.history.back()} className="flex items-center gap-2 px-5 py-2.5 bg-[var(--surface-2)] text-[var(--text-2)] rounded-lg text-sm hover:text-white transition-colors border border-[var(--border)]">
            <ArrowLeft size={14} /> Go Back
          </button>
        </div>
      </motion.div>
    </div>
  );
}
