/**
 * usePerformanceTier.ts
 * Determines system performance capability for adaptive graphics.
 * HIGH: Full Three.js WebGL particle field & full effects.
 * MEDIUM: Optimized Canvas 2D particle mesh / reduced particle count.
 * LOW: CSS lightweight background / zero heavy GPU load (for low-end devices or battery saving).
 */

export type PerformanceTier = 'HIGH' | 'MEDIUM' | 'LOW';

let currentTier: PerformanceTier = 'HIGH';
const listeners = new Set<(tier: PerformanceTier) => void>();

function detectPerformanceTier(): PerformanceTier {
  if (typeof window === 'undefined') return 'MEDIUM';

  // 1. Check if user prefers reduced motion
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return 'LOW';
  }

  // 2. Mobile / small touch screens should default to MEDIUM or LOW to preserve battery & thermals
  const isMobile = window.innerWidth < 768 || (navigator.maxTouchPoints && navigator.maxTouchPoints > 1);

  // 3. Hardware concurrency & memory checks
  const cores = navigator.hardwareConcurrency || 4;
  const memory = (navigator as unknown as { deviceMemory?: number }).deviceMemory || 8;

  // 4. Test WebGL availability
  let hasWebGL = false;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    hasWebGL = !!gl;
  } catch {
    hasWebGL = false;
  }

  if (!hasWebGL) {
    return 'LOW';
  }

  if (isMobile) {
    return cores >= 8 && memory >= 6 ? 'MEDIUM' : 'LOW';
  }

  if (cores <= 2 || memory <= 2) {
    return 'LOW';
  }

  if (cores <= 4 || memory <= 4) {
    return 'MEDIUM';
  }

  return 'HIGH';
}

currentTier = detectPerformanceTier();

export function getPerformanceTier(): PerformanceTier {
  return currentTier;
}

export function setPerformanceTier(tier: PerformanceTier): void {
  if (currentTier !== tier) {
    currentTier = tier;
    listeners.forEach((fn) => fn(currentTier));
  }
}

export function onPerformanceTierChange(callback: (tier: PerformanceTier) => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function isLowTier(): boolean {
  return currentTier === 'LOW';
}

export function isHighTier(): boolean {
  return currentTier === 'HIGH';
}
