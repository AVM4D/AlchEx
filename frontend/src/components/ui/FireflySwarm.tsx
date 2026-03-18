import { useRef, useEffect, useCallback, ReactNode, MutableRefObject } from 'react';
import gsap from 'gsap';

export interface FireflySwarmHandle {
  trigger: () => void;
  isActive: boolean;
}

interface FireflySwarmProps {
  firstContent: ReactNode;
  secondContent: ReactNode;
  duration?: number;
  fireflyCount?: number;
  className?: string;
  style?: React.CSSProperties;
  handleRef?: MutableRefObject<FireflySwarmHandle | null>;
}

export default function FireflySwarm({
  firstContent,
  secondContent,
  duration = 1.8,
  fireflyCount = 70,
  className = '',
  style = {},
  handleRef,
}: FireflySwarmProps) {
  const defaultRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isActiveRef = useRef(false);
  const isAnimatingRef = useRef(false);

  // Build firefly elements
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = '';

    for (let i = 0; i < fireflyCount; i++) {
      const fly = document.createElement('div');
      const size = 2 + Math.random() * 5;
      const hue = 0; 
      const lightness = 60 + Math.random() * 40;
      fly.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: hsl(${hue}, 0%, ${lightness}%);
        opacity: 0;
        pointer-events: none;
        box-shadow: 0 0 ${size * 4}px hsl(${hue}, 0%, ${lightness}%),
                    0 0 ${size * 8}px hsla(${hue}, 0%, ${lightness}%, 0.4);        
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
      `;
      container.appendChild(fly);
    }
  }, [fireflyCount]);

  const trigger = useCallback(() => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;

    const defaultEl = defaultRef.current;
    const activeEl = activeRef.current;
    const container = containerRef.current;
    if (!defaultEl || !activeEl || !container) return;

    const goingActive = !isActiveRef.current;
    isActiveRef.current = goingActive;

    const outgoing = goingActive ? defaultEl : activeEl;
    const incoming = goingActive ? activeEl : defaultEl;
    const flies = container.children;

    const tl = gsap.timeline({
      onComplete: () => {
        isAnimatingRef.current = false;
      },
    });

    // Reset flies to random positions
    for (let i = 0; i < flies.length; i++) {
      gsap.set(flies[i], {
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        opacity: 0,
        scale: 0,
      });
    }

    // Phase 1: Fireflies fade in and drift organically, building density
    tl.to(flies, {
      opacity: () => 0.4 + Math.random() * 0.6,
      scale: () => 0.6 + Math.random() * 1.4,
      x: () => (Math.random() - 0.5) * 150,
      y: () => (Math.random() - 0.5) * 150,
      duration: duration * 0.3,
      stagger: {
        each: 0.008,
        from: 'random',
      },
      ease: 'power1.out',
    }, 0);

    // Outgoing fades
    tl.to(outgoing, {
      opacity: 0,
      duration: duration * 0.3,
      ease: 'power2.in',
    }, 0.1);

    // Fireflies pulse/flicker while fully visible
    tl.to(flies, {
      x: () => (Math.random() - 0.5) * 200,
      y: () => (Math.random() - 0.5) * 200,
      opacity: () => 0.2 + Math.random() * 0.8,
      duration: duration * 0.2,
      stagger: {
        each: 0.005,
        from: 'random',
      },
      ease: 'sine.inOut',
    });

    // Swap at midpoint
    tl.call(() => {
      outgoing.style.display = 'none';
      outgoing.style.pointerEvents = 'none';
      gsap.set(outgoing, { zIndex: 1, opacity: 1 });

      incoming.style.display = 'block';
      incoming.style.pointerEvents = 'auto';
      gsap.set(incoming, { zIndex: 2, opacity: 0 });
    });

    // Phase 2: Fireflies drift apart and fade
    tl.to(flies, {
      opacity: 0,
      scale: 0,
      x: () => (Math.random() - 0.5) * 400,
      y: () => (Math.random() - 0.5) * 400,
      duration: duration * 0.3,
      stagger: {
        each: 0.008,
        from: 'random',
      },
      ease: 'power2.in',
    });

    // Incoming fades in
    tl.to(incoming, {
      opacity: 1,
      duration: duration * 0.3,
      ease: 'power2.out',
    }, `-=${duration * 0.25}`);
  }, [duration]);

  // Expose handle
  useEffect(() => {
    if (handleRef) {
      handleRef.current = {
        trigger,
        get isActive() {
          return isActiveRef.current;
        },
      };
    }
  }, [handleRef, trigger]);

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        height: '100%',
        ...style,
      }}
    >
      <div
        ref={defaultRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 2,
          pointerEvents: 'auto',
        }}
      >
        {firstContent}
      </div>

      <div
        ref={activeRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          display: 'none',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      >
        {secondContent}
      </div>

      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 10,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
