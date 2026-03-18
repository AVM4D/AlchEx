import React, { useRef, useEffect, useCallback } from 'react';

interface ParticleFieldProps {
  className?: string;
  particleCount?: number;
  color?: string;
  maxDistance?: number;
  speed?: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
}

export const ParticleField: React.FC<ParticleFieldProps> = ({
  className = '',
  particleCount = 80,
  color = 'var(--text, 255, 255, 255)', // defaulting to variable
  maxDistance = 120,
  speed = 0.3,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const animRef = useRef<number>(0);
  const rgbColorRef = useRef<string>('255, 255, 255');

  useEffect(() => {
    // Attempt to parse CSS variables
    let c = color;
    if (c.includes('var(')) {
        const match = c.match(/var\(([^),]+)/);
        if (match) {
            const val = getComputedStyle(document.documentElement).getPropertyValue(match[1].trim()).trim();
            if (val) c = val;
        }
    }
    // If it's hex, convert to RGB string
    if (c.startsWith('#')) {
      const hex = c.replace('#', '');
      if (hex.length === 6) {
        rgbColorRef.current = `${parseInt(hex.substring(0, 2), 16)}, ${parseInt(hex.substring(2, 4), 16)}, ${parseInt(hex.substring(4, 6), 16)}`;
      } else if (hex.length === 3) {
        rgbColorRef.current = `${parseInt(hex[0]+hex[0], 16)}, ${parseInt(hex[1]+hex[1], 16)}, ${parseInt(hex[2]+hex[2], 16)}`;
      }
    } else {
      // Hope it's an RGB string or fallback to generic
      rgbColorRef.current = c || '255, 255, 255';
    }
  }, [color]);

  const init = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * speed,
        vy: (Math.random() - 0.5) * speed,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.5 + 0.2,
      });
    }
    particlesRef.current = particles;
  }, [particleCount, speed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      init();
    };

    const handleMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    resize();
    window.addEventListener('resize', resize);
    canvas.addEventListener('mousemove', handleMouse);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    // Re-init when container becomes visible (e.g. after display:none → block)
    const ro = new ResizeObserver(() => {
      if (canvas.offsetWidth > 0 && canvas.offsetHeight > 0) {
        resize();
      }
    });
    ro.observe(canvas);

    // Pause when completely off-screen — saves GPU when hero is scrolled past
    let inView = true;
    const io = new IntersectionObserver(
      (entries) => { inView = entries[0]?.isIntersecting ?? true; },
      { threshold: 0 }
    );
    io.observe(canvas);

    const animate = () => {
      animRef.current = requestAnimationFrame(animate);
      if (!inView) return;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      const particles = particlesRef.current;
      const mouse = mouseRef.current;

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;

        // Mouse repulsion
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100) {
          const force = (100 - dist) / 100;
          p.x += (dx / dist) * force * 2;
          p.y += (dy / dist) * force * 2;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgbColorRef.current}, ${p.opacity})`;
        ctx.fill();
      }

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < maxDistance) {
            const opacity = (1 - dist / maxDistance) * 0.15;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(${rgbColorRef.current}, ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

    };

    animate();

    return () => {
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', handleMouse);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [color, maxDistance, init]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full ${className}`}
      style={{ pointerEvents: 'all' }}
    />
  );
};
