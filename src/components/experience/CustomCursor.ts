/**
 * CustomCursor.ts
 * Precision hardware-grade custom cursor for desktop viewports.
 * Subtle, non-intrusive, disabled on mobile/touch and reduced motion.
 */

import { isReducedMotion } from '../../hooks/useReducedMotion';
import { playHoverSound, playClickSound } from '../../lib/audio/soundFx';

export class CustomCursor {
  private dot: HTMLElement | null = null;
  private ring: HTMLElement | null = null;
  private mouse = { x: -100, y: -100 };
  private ringPos = { x: -100, y: -100 };
  private rafId: number | null = null;
  private isHovered = false;
  private isButton = false;
  private isCard = false;
  private isDown = false;
  private lastHoverTarget: HTMLElement | null = null;
  private boundMove: (e: MouseEvent) => void;
  private boundDown: () => void;
  private boundUp: () => void;
  private boundLeave: () => void;
  private boundOver: (e: MouseEvent) => void;
  private isDestroyed = false;

  constructor() {
    this.boundMove = this.onMouseMove.bind(this);
    this.boundDown = this.onMouseDown.bind(this);
    this.boundUp = this.onMouseUp.bind(this);
    this.boundLeave = this.onMouseLeave.bind(this);
    this.boundOver = this.onMouseOver.bind(this);

    if (this.canInit()) {
      this.createCursorElements();
      this.bindEvents();
      this.loop();
    }
  }

  private canInit(): boolean {
    if (typeof window === 'undefined') return false;
    if (isReducedMotion()) return false;
    const isTouch = window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
    const isNarrow = window.innerWidth < 1024;
    return !isTouch && !isNarrow;
  }

  private createCursorElements(): void {
    const existing = document.getElementById('lestek-custom-cursor-container');
    if (existing) existing.remove();

    const container = document.createElement('div');
    container.id = 'lestek-custom-cursor-container';
    container.className = 'pointer-events-none fixed inset-0 z-[99999] overflow-hidden select-none';

    this.dot = document.createElement('div');
    this.dot.className =
      'fixed top-0 left-0 w-2 h-2 -ml-1 -mt-1 bg-[#00e1ff] rounded-full pointer-events-none z-20 transition-transform duration-75 shadow-[0_0_12px_#00e1ff]';

    this.ring = document.createElement('div');
    this.ring.className =
      'fixed top-0 left-0 w-8 h-8 -ml-4 -mt-4 rounded-full border border-[#00e1ff]/40 pointer-events-none z-10 transition-[border-color,background-color] duration-200';

    container.appendChild(this.dot);
    container.appendChild(this.ring);
    document.body.appendChild(container);
    document.body.classList.add('has-custom-cursor');
  }

  private bindEvents(): void {
    window.addEventListener('mousemove', this.boundMove, { passive: true });
    window.addEventListener('mousedown', this.boundDown);
    window.addEventListener('mouseup', this.boundUp);
    document.documentElement.addEventListener('mouseleave', this.boundLeave);
    document.addEventListener('mouseover', this.boundOver, { passive: true });
  }

  public bindHoverListeners(): void {
    // Kept for backward compatibility
  }

  private onMouseOver(e: MouseEvent): void {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    const interactive = target.closest<HTMLElement>(
      'a, button, [role="button"], input, textarea, select, .cursor-pointer, .btn-tech, .btn-outline, .btn-blue'
    );

    if (interactive) {
      if (this.lastHoverTarget !== interactive) {
        this.lastHoverTarget = interactive;
        playHoverSound();
      }
      this.isHovered = true;
      this.isButton =
        interactive.tagName === 'BUTTON' ||
        interactive.classList.contains('btn-tech') ||
        interactive.classList.contains('btn-blue') ||
        interactive.classList.contains('btn-outline');
    } else {
      this.isHovered = false;
      this.isButton = false;
      this.lastHoverTarget = null;
    }

    const card = target.closest('.glass-card, [id^="section-"] a, .group');
    this.isCard = !!card;
  }

  private onMouseMove(e: MouseEvent): void {
    this.mouse.x = e.clientX;
    this.mouse.y = e.clientY;
    if (this.dot) {
      this.dot.style.opacity = '1';
    }
    if (this.ring) {
      this.ring.style.opacity = '1';
    }
  }

  private onMouseDown(): void {
    this.isDown = true;
    playClickSound();
  }

  private onMouseUp(): void {
    this.isDown = false;
  }

  private onMouseLeave(): void {
    if (this.dot) this.dot.style.opacity = '0';
    if (this.ring) this.ring.style.opacity = '0';
  }

  private loop = (): void => {
    if (this.isDestroyed) return;

    // Follow dot directly
    if (this.dot) {
      const scale = this.isDown ? 0.7 : this.isButton ? 1.4 : 1;
      this.dot.style.transform = `translate3d(${this.mouse.x}px, ${this.mouse.y}px, 0) scale(${scale})`;
    }

    // Follow ring with smooth lerp
    if (this.ring) {
      this.ringPos.x += (this.mouse.x - this.ringPos.x) * 0.18;
      this.ringPos.y += (this.mouse.y - this.ringPos.y) * 0.18;

      let scale = 1;
      let borderColor = 'rgba(59, 130, 246, 0.4)';
      let bgColor = 'transparent';

      if (this.isButton) {
        scale = 1.6;
        borderColor = 'rgba(59, 130, 246, 0.8)';
        bgColor = 'rgba(59, 130, 246, 0.12)';
      } else if (this.isHovered) {
        scale = 1.35;
        borderColor = 'rgba(6, 182, 212, 0.6)';
        bgColor = 'rgba(6, 182, 212, 0.08)';
      } else if (this.isCard) {
        scale = 1.2;
        borderColor = 'rgba(255, 255, 255, 0.25)';
      } else if (this.isDown) {
        scale = 0.85;
      }

      this.ring.style.transform = `translate3d(${this.ringPos.x}px, ${this.ringPos.y}px, 0) scale(${scale})`;
      this.ring.style.borderColor = borderColor;
      this.ring.style.backgroundColor = bgColor;
    }

    this.rafId = requestAnimationFrame(this.loop);
  };

  public destroy(): void {
    this.isDestroyed = true;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    window.removeEventListener('mousemove', this.boundMove);
    window.removeEventListener('mousedown', this.boundDown);
    window.removeEventListener('mouseup', this.boundUp);
    document.documentElement.removeEventListener('mouseleave', this.boundLeave);
    document.removeEventListener('mouseover', this.boundOver);

    const container = document.getElementById('lestek-custom-cursor-container');
    if (container) container.remove();
    document.body.classList.remove('has-custom-cursor');
  }
}
