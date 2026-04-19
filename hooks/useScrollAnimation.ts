'use client';

import { useEffect, useRef, useCallback } from 'react';

type AnimationType = 
  | 'fade-up' 
  | 'fade-down' 
  | 'fade-left' 
  | 'fade-right' 
  | 'scale-up' 
  | 'blur-in'
  | 'glitch-in'
  | 'counter'
  | 'clip-reveal'
  | 'stagger';

interface ScrollAnimationOptions {
  type?: AnimationType;
  delay?: number;       // ms delay before animation starts
  threshold?: number;   // 0-1 visibility threshold
  once?: boolean;       // animate only once (default: true)
  staggerDelay?: number; // ms between staggered children
}

export function useScrollAnimation(options: ScrollAnimationOptions = {}) {
  const {
    type = 'fade-up',
    delay = 0,
    threshold = 0.12,
    once = true,
    staggerDelay = 80,
  } = options;

  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Set initial hidden state + animation type
    element.setAttribute('data-scroll', type);
    element.setAttribute('data-scroll-delay', String(delay));
    if (type === 'stagger') {
      element.setAttribute('data-stagger-delay', String(staggerDelay));
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Apply delay then animate
          setTimeout(() => {
            element.classList.add('scroll-visible');

            // For stagger type, animate children sequentially
            if (type === 'stagger') {
              const children = element.querySelectorAll('[data-stagger-child]');
              children.forEach((child, i) => {
                setTimeout(() => {
                  (child as HTMLElement).classList.add('stagger-child-visible');
                }, i * staggerDelay);
              });
            }

            // For counter type, animate number counting
            if (type === 'counter') {
              animateCounter(element);
            }
          }, delay);

          if (once) observer.unobserve(element);
        } else if (!once) {
          element.classList.remove('scroll-visible');
        }
      },
      {
        threshold,
        rootMargin: '0px 0px -60px 0px',
      }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [type, delay, threshold, once, staggerDelay]);

  return ref;
}

/** Parallax scroll hook — element moves at different speed */
export function useParallax(speed: number = 0.3) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const rect = element.getBoundingClientRect();
          const viewH = window.innerHeight;
          const center = rect.top + rect.height / 2 - viewH / 2;
          const offset = center * speed;
          element.style.transform = `translate3d(0, ${offset}px, 0)`;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [speed]);

  return ref;
}

/** Scroll progress hook — returns 0-1 progress as element traverses viewport */
export function useScrollProgress() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const rect = element.getBoundingClientRect();
          const viewH = window.innerHeight;
          const progress = Math.min(Math.max((viewH - rect.top) / (viewH + rect.height), 0), 1);
          element.style.setProperty('--scroll-progress', String(progress));
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return ref;
}

/** Animate a number counting up from 0 */
function animateCounter(element: HTMLElement) {
  const target = element.getAttribute('data-counter-target');
  if (!target) return;

  const isNumber = !isNaN(Number(target));
  if (!isNumber) {
    element.textContent = target;
    return;
  }

  const end = parseFloat(target);
  const duration = 1600;
  const start = performance.now();
  const hasDecimal = target.includes('.');
  const suffix = element.getAttribute('data-counter-suffix') || '';

  const tick = (now: number) => {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = eased * end;
    element.textContent = (hasDecimal ? current.toFixed(1) : Math.round(current).toString()) + suffix;
    if (progress < 1) requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
}
