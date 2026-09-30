/**
 * useReducedMotion.ts
 * Respects user preferences for reduced motion (accessibility).
 */

let prefersReduced = false;
const listeners = new Set<(reduced: boolean) => void>();

if (typeof window !== 'undefined' && window.matchMedia) {
  const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
  prefersReduced = mql.matches;

  mql.addEventListener('change', (e) => {
    prefersReduced = e.matches;
    listeners.forEach((fn) => fn(prefersReduced));
  });
}

export function isReducedMotion(): boolean {
  return prefersReduced;
}

export function onReducedMotionChange(callback: (reduced: boolean) => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}
