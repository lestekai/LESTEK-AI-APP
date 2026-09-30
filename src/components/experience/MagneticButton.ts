/**
 * MagneticButton.ts
 * Luxury physics-based magnetic attraction using GSAP spring kinematics.
 * Matches VOS9X / Awwwards magnetic button feel with zero jitter.
 */

import { gsap } from '../../lib/animations/gsap';
import { isReducedMotion } from '../../hooks/useReducedMotion';

export class MagneticButton {
  private element: HTMLElement;
  private strength: number;
  private boundMove: (e: MouseEvent) => void;
  private boundLeave: () => void;
  private isDestroyed = false;

  constructor(element: HTMLElement, strength = 0.35) {
    this.element = element;
    this.strength = strength;
    this.boundMove = this.onMouseMove.bind(this);
    this.boundLeave = this.onMouseLeave.bind(this);

    if (this.canInit()) {
      this.init();
    }
  }

  private canInit(): boolean {
    if (typeof window === 'undefined') return false;
    if (isReducedMotion()) return false;
    const isTouch = window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
    return !isTouch;
  }

  private init() {
    this.element.addEventListener('mousemove', this.boundMove, { passive: true });
    this.element.addEventListener('mouseleave', this.boundLeave);
  }

  private onMouseMove(e: MouseEvent) {
    if (this.isDestroyed) return;
    const rect = this.element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = (e.clientX - centerX) * this.strength;
    const deltaY = (e.clientY - centerY) * this.strength;

    gsap.to(this.element, {
      x: deltaX,
      y: deltaY,
      duration: 0.35,
      ease: 'power2.out',
      overwrite: 'auto',
    });
  }

  private onMouseLeave() {
    if (this.isDestroyed) return;
    gsap.to(this.element, {
      x: 0,
      y: 0,
      duration: 0.7,
      ease: 'elastic.out(1.1, 0.4)',
      overwrite: 'auto',
    });
  }

  public destroy() {
    this.isDestroyed = true;
    this.element.removeEventListener('mousemove', this.boundMove);
    this.element.removeEventListener('mouseleave', this.boundLeave);
    gsap.set(this.element, { x: 0, y: 0, clearProps: 'transform' });
    (this.element as unknown as { __magneticActive?: boolean }).__magneticActive = false;
  }
}

export function initMagneticButtons(selector = '.btn-tech, .btn-outline, .btn-magnetic, [data-magnetic]'): MagneticButton[] {
  const elements = document.querySelectorAll<HTMLElement>(selector);
  const instances: MagneticButton[] = [];
  elements.forEach((el) => {
    if ((el as unknown as { __magneticActive?: boolean }).__magneticActive) return;
    (el as unknown as { __magneticActive?: boolean }).__magneticActive = true;
    instances.push(new MagneticButton(el));
  });
  return instances;
}
