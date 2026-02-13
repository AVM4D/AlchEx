import React, { useEffect, useState } from 'react';
import { Timer, AlertTriangle } from 'lucide-react';

interface OfferCountdownProps {
  expiresAt: string;
  /** Compact mode for marketplace cards (single line) */
  compact?: boolean;
}

function getTimeLeft(expiresAt: string) {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return { expired: true, hours: 0, minutes: 0, seconds: 0, total: 0 };
  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);
  return { expired: false, hours, minutes, seconds, total: diff };
}

export default function OfferCountdown({ expiresAt, compact = false }: OfferCountdownProps) {
  const [time, setTime] = useState(() => getTimeLeft(expiresAt));

  useEffect(() => {
    const tick = setInterval(() => {
      const t = getTimeLeft(expiresAt);
      setTime(t);
      if (t.expired) clearInterval(tick);
    }, 1000);
    return () => clearInterval(tick);
  }, [expiresAt]);

  if (time.expired) {
    return (
      <span className="flex items-center gap-1 text-red-400 text-[10px] font-medium">
        <AlertTriangle size={10} /> Expired
      </span>
    );
  }

  const isUrgent = time.total < 6 * 3_600_000; // < 6 hours
  const isWarning = time.total < 12 * 3_600_000; // < 12 hours

  const color = isUrgent
    ? 'text-red-400'
    : isWarning
    ? 'text-amber-400'
    : 'text-[var(--text-3)]';

  const pad = (n: number) => String(n).padStart(2, '0');

  if (compact) {
    return (
      <span className={`flex items-center gap-1 text-[10px] font-medium ${color}`}>
        <Timer size={10} className={isUrgent ? 'animate-pulse' : ''} />
        {time.hours > 0 ? `${time.hours}h ${pad(time.minutes)}m` : `${time.minutes}m ${pad(time.seconds)}s`}
      </span>
    );
  }

  return (
    <div className={`flex items-center gap-2 text-xs font-medium ${color}`}>
      <Timer size={12} className={isUrgent ? 'animate-pulse' : ''} />
      <div className="flex items-center gap-1">
        {time.hours > 0 && (
          <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-md px-1.5 py-0.5 text-[10px] font-mono min-w-[2rem] text-center">
            {pad(time.hours)}<span className="text-[var(--text-3)] ml-0.5">h</span>
          </div>
        )}
        <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-md px-1.5 py-0.5 text-[10px] font-mono min-w-[2rem] text-center">
          {pad(time.minutes)}<span className="text-[var(--text-3)] ml-0.5">m</span>
        </div>
        <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-md px-1.5 py-0.5 text-[10px] font-mono min-w-[2rem] text-center">
          {pad(time.seconds)}<span className="text-[var(--text-3)] ml-0.5">s</span>
        </div>
      </div>
      {isUrgent && <span className="text-[9px] opacity-75">hurry!</span>}
    </div>
  );
}
