/**
 * Parallax.ts
 * Adds subtle multi-plane depth shifts on scroll and mouse movements.
 */

import { gsap, ScrollTrigger } from '../../lib/animations/gsap';
import { isReducedMotion } from '../../hooks/useReducedMotion';

export class ParallaxManager {
  private triggers: ScrollTrigger[] = [];

  constructor() {
    if (!isReducedMotion()) {
      this.init();
    }
  }

  private init() {
    // 1. Watermark parallax in Hero
    const watermark = document.querySelector('#section-hero .tracking-widest');
    if (watermark) {
      const trigger = ScrollTrigger.create({
        trigger: '#section-hero',
        start: 'top top',
        end: 'bottom top',
        scrub: 1.2,
        onUpdate: (self) => {
          gsap.set(watermark, { y: self.progress * 150 });
        },
      });
      this.triggers.push(trigger);
    }

    // 2. Radial gradient backdrop shifts
    const heroBg = document.querySelector('#section-hero .bg-\\[radial-gradient');
    if (heroBg) {
      const trigger = ScrollTrigger.create({
        trigger: '#section-hero',
        start: 'top top',
        end: 'bottom top',
        scrub: 1.5,
        onUpdate: (self) => {
          gsap.set(heroBg, { y: self.progress * 80, opacity: 1 - self.progress * 0.8 });
        },
      });
      this.triggers.push(trigger);
    }
  }

  public destroy() {
    this.triggers.forEach((t) => t.kill());
    this.triggers = [];
  }
}
