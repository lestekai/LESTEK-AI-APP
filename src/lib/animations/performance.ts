/**
 * performance.ts
 * Real-time framerate tracker and adaptive quality controller.
 */

import { getPerformanceTier, setPerformanceTier } from '../../hooks/usePerformanceTier';

let frameCount = 0;
let lastTime = performance.now();
let lowFpsCount = 0;
let monitorRaf: number | null = null;
let isPaused = false;

export function startPerformanceMonitor(): void {
  if (typeof window === 'undefined') return;

  document.addEventListener('visibilitychange', () => {
    isPaused = document.hidden;
  });

  function checkFrame(now: number) {
    if (!isPaused) {
      frameCount++;
      const delta = now - lastTime;

      if (delta >= 1000) {
        const fps = (frameCount * 1000) / delta;
        frameCount = 0;
        lastTime = now;

        const currentTier = getPerformanceTier();
        if (fps < 28 && currentTier === 'HIGH') {
          lowFpsCount++;
          if (lowFpsCount >= 2) {
            console.info('[LESTEK Performance] Adaptive fallback: downgrading to MEDIUM tier for optimal fluidity.');
            setPerformanceTier('MEDIUM');
            lowFpsCount = 0;
          }
        } else if (fps < 24 && currentTier === 'MEDIUM') {
          lowFpsCount++;
          if (lowFpsCount >= 2) {
            console.info('[LESTEK Performance] Adaptive fallback: downgrading to LOW tier.');
            setPerformanceTier('LOW');
            lowFpsCount = 0;
          }
        } else {
          lowFpsCount = Math.max(0, lowFpsCount - 1);
        }
      }
    }

    monitorRaf = requestAnimationFrame(checkFrame);
  }

  monitorRaf = requestAnimationFrame(checkFrame);
}

export function stopPerformanceMonitor(): void {
  if (monitorRaf) {
    cancelAnimationFrame(monitorRaf);
    monitorRaf = null;
  }
}
