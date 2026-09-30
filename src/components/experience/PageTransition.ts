/**
 * PageTransition.ts
 * Subtle page exit & enter choreography without interrupting standard navigation.
 */

import { gsap } from 'gsap';
import { isReducedMotion } from '../../hooks/useReducedMotion';

export class PageTransition {
  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined' || isReducedMotion()) return;

    // Intercept internal relative links
    document.querySelectorAll<HTMLAnchorElement>('a[href^="/"], a[href^="./"]').forEach((link) => {
      const href = link.getAttribute('href');
      // Skip external, anchors, or new tabs
      if (!href || href.startsWith('#') || link.target === '_blank' || href.includes('admin')) {
        return;
      }

      link.addEventListener('click', (e) => {
        // Allow command/ctrl clicks to open in new tab
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;

        // Animate out slightly
        const main = document.querySelector('main');
        if (main) {
          e.preventDefault();
          gsap.to(main, {
            opacity: 0,
            y: -12,
            duration: 0.25,
            ease: 'power2.in',
            onComplete: () => {
              window.location.href = href;
            },
          });
        }
      });
    });
  }
}
