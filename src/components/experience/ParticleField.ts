/**
 * ParticleField.ts
 * Manages the background particle matrix lifecycle and responsive adapters.
 */

import { createParticleEngine, ParticleEngine } from '../../lib/animations/particles';

export class ParticleField {
  private container: HTMLElement | null = null;
  private engine: ParticleEngine | null = null;
  private boundResize: () => void;
  private boundMouseMove: (e: MouseEvent) => void;
  private boundScroll: () => void;

  constructor(targetElement?: HTMLElement | string) {
    this.boundResize = this.onResize.bind(this);
    this.boundMouseMove = this.onMouseMove.bind(this);
    this.boundScroll = this.onScroll.bind(this);

    this.mount(targetElement);
  }

  private mount(target?: HTMLElement | string) {
    if (typeof window === 'undefined') return;

    if (typeof target === 'string') {
      this.container = document.querySelector<HTMLElement>(target);
    } else if (target instanceof HTMLElement) {
      this.container = target;
    } else {
      // Auto-create global particle canvas layer
      let autoContainer = document.getElementById('lestek-particle-layer');
      if (!autoContainer) {
        autoContainer = document.createElement('div');
        autoContainer.id = 'lestek-particle-layer';
        autoContainer.className =
          'fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden';
        document.body.insertBefore(autoContainer, document.body.firstChild);
      }
      this.container = autoContainer;
    }

    if (this.container) {
      this.engine = createParticleEngine(this.container);
      this.bindEvents();
    }
  }

  private bindEvents() {
    window.addEventListener('resize', this.boundResize, { passive: true });
    window.addEventListener('mousemove', this.boundMouseMove, { passive: true });
    window.addEventListener('scroll', this.boundScroll, { passive: true });
  }

  private onResize() {
    if (this.engine) {
      this.engine.onResize(window.innerWidth, window.innerHeight);
    }
  }

  private onMouseMove(e: MouseEvent) {
    if (this.engine) {
      this.engine.onMouseMove(e.clientX, e.clientY);
    }
  }

  private onScroll() {
    if (this.engine) {
      this.engine.onScroll(window.scrollY);
    }
  }

  public destroy() {
    window.removeEventListener('resize', this.boundResize);
    window.removeEventListener('mousemove', this.boundMouseMove);
    window.removeEventListener('scroll', this.boundScroll);

    if (this.engine) {
      this.engine.destroy();
      this.engine = null;
    }
  }
}
