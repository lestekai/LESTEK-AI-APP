/**
 * useSmoothScroll.ts
 * Integrates Lenis smooth scroll while protecting forms, inputs, and accessibility.
 */

import Lenis from 'lenis';
import { gsap, ScrollTrigger } from '../lib/animations/gsap';
import { isReducedMotion } from './useReducedMotion';
import { isLowTier } from './usePerformanceTier';

let lenisInstance: Lenis | null = null;
let tickerCallback: ((time: number) => void) | null = null;

export function initSmoothScroll(): Lenis | null {
  if (typeof window === 'undefined') return null;

  // Do not activate smooth scroll on low tier, mobile touch, or reduced motion
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (isReducedMotion() || isLowTier() || isTouch || window.innerWidth < 1024) {
    return null;
  }

  if (lenisInstance) {
    return lenisInstance;
  }

  try {
    lenisInstance = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      touchMultiplier: 1.25,
    });

    // Synchronize Lenis scroll position with GSAP ScrollTrigger
    lenisInstance.on('scroll', ScrollTrigger.update);

    tickerCallback = (time: number) => {
      lenisInstance?.raf(time * 1000);
    };

    gsap.ticker.add(tickerCallback);
    gsap.ticker.lagSmoothing(0);

    // Make sure form elements and modal areas are not interrupted
    document.querySelectorAll('form, textarea, input, select, [data-lenis-prevent]').forEach((el) => {
      el.setAttribute('data-lenis-prevent', 'true');
    });

    return lenisInstance;
  } catch (err) {
    console.warn('[LESTEK Experience] Lenis initialization skipped:', err);
    return null;
  }
}

export function getSmoothScroll(): Lenis | null {
  return lenisInstance;
}

export function destroySmoothScroll(): void {
  if (tickerCallback) {
    gsap.ticker.remove(tickerCallback);
    tickerCallback = null;
  }
  if (lenisInstance) {
    lenisInstance.destroy();
    lenisInstance = null;
  }
}
