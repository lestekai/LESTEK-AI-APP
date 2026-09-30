/**
 * ScrollReveal.ts
 * Progressive, un-intrusive viewport reveals triggered by GSAP ScrollTrigger.
 * Clean initial states without pop-in glitches.
 */

import { gsap, ScrollTrigger } from '../../lib/animations/gsap';
import { isReducedMotion } from '../../hooks/useReducedMotion';

export class ScrollRevealManager {
  private triggers: ScrollTrigger[] = [];

  constructor() {
    if (!isReducedMotion()) {
      this.init();
    }
  }

  private init() {
    // 1. Solutions Section Cards
    const solutionsSection = document.getElementById('section-solutions');
    if (solutionsSection) {
      const cards = solutionsSection.querySelectorAll('.hover-card');
      if (cards.length > 0) {
        gsap.set(cards, { opacity: 0, y: 30 });
        const trigger = ScrollTrigger.create({
          trigger: solutionsSection,
          start: 'top 82%',
          once: true,
          onEnter: () => {
            gsap.to(cards, {
              opacity: 1,
              y: 0,
              duration: 0.7,
              stagger: 0.15,
              ease: 'power3.out',
              clearProps: 'transform',
            });
          },
        });
        this.triggers.push(trigger);
      }
    }

    // 2. Services Section Cards
    const servicesSection = document.getElementById('section-services');
    if (servicesSection) {
      const trigger = ScrollTrigger.create({
        trigger: servicesSection,
        start: 'top 80%',
        once: true,
        onEnter: () => {
          const cards = servicesSection.querySelectorAll('#services-grid > div');
          if (cards.length > 0) {
            gsap.fromTo(
              cards,
              { opacity: 0, y: 25 },
              {
                opacity: 1,
                y: 0,
                duration: 0.6,
                stagger: 0.08,
                ease: 'power2.out',
                clearProps: 'transform',
              }
            );
          }
        },
      });
      this.triggers.push(trigger);
    }

    // 3. CTA Section - Scale & Glow Focus
    const ctaSection = document.getElementById('section-cta');
    if (ctaSection) {
      const ctaBox = ctaSection.firstElementChild;
      if (ctaBox) {
        gsap.set(ctaBox, { opacity: 0, y: 30 });
        const trigger = ScrollTrigger.create({
          trigger: ctaSection,
          start: 'top 85%',
          once: true,
          onEnter: () => {
            gsap.to(ctaBox, {
              opacity: 1,
              y: 0,
              duration: 0.7,
              ease: 'power3.out',
              clearProps: 'transform',
            });
          },
        });
        this.triggers.push(trigger);
      }
    }

    // 4. Trust & Warranty Section
    const warrantySection = document.getElementById('section-warranty');
    if (warrantySection) {
      const items = warrantySection.querySelectorAll('.hover-card');
      if (items.length > 0) {
        gsap.set(items, { opacity: 0, y: 20 });
        const trigger = ScrollTrigger.create({
          trigger: warrantySection,
          start: 'top 88%',
          once: true,
          onEnter: () => {
            gsap.to(items, {
              opacity: 1,
              y: 0,
              duration: 0.55,
              stagger: 0.1,
              ease: 'power2.out',
              clearProps: 'transform',
            });
          },
        });
        this.triggers.push(trigger);
      }
    }

    // 5. Products Grid on produtos.html
    const ebooksGrid = document.getElementById('ebooks-grid');
    if (ebooksGrid) {
      const trigger = ScrollTrigger.create({
        trigger: ebooksGrid,
        start: 'top 85%',
        once: true,
        onEnter: () => {
          const cards = ebooksGrid.querySelectorAll(':scope > div');
          if (cards.length > 0) {
            gsap.fromTo(
              cards,
              { opacity: 0, y: 30 },
              {
                opacity: 1,
                y: 0,
                duration: 0.65,
                stagger: 0.1,
                ease: 'power3.out',
                clearProps: 'transform',
              }
            );
          }
        },
      });
      this.triggers.push(trigger);
    }
  }

  public refresh() {
    ScrollTrigger.refresh();
  }

  public destroy() {
    this.triggers.forEach((t) => t.kill());
    this.triggers = [];
  }
}
