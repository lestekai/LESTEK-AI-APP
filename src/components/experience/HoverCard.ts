/**
 * HoverCard.ts
 * Subtle 3D perspective tilt and dynamic specular light sheen for cards.
 * Calibrated to be sophisticated and premium without warping or jitter.
 */

import { isReducedMotion } from '../../hooks/useReducedMotion';

export class HoverCard {
  private element: HTMLElement;
  private boundMove: (e: MouseEvent) => void;
  private boundLeave: () => void;
  private boundEnter: () => void;
  private isDestroyed = false;

  constructor(element: HTMLElement) {
    this.element = element;
    this.boundMove = this.onMouseMove.bind(this);
    this.boundLeave = this.onMouseLeave.bind(this);
    this.boundEnter = this.onMouseEnter.bind(this);

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
    this.element.style.transformStyle = 'preserve-3d';
    this.element.style.transition = 'transform 0.25s ease-out, border-color 0.3s ease, box-shadow 0.3s ease';

    this.element.addEventListener('mouseenter', this.boundEnter);
    this.element.addEventListener('mousemove', this.boundMove, { passive: true });
    this.element.addEventListener('mouseleave', this.boundLeave);
  }

  private onMouseEnter() {
    if (this.isDestroyed) return;
    this.element.style.transition = 'none';
  }

  private onMouseMove(e: MouseEvent) {
    if (this.isDestroyed) return;
    const rect = this.element.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Subtle tilt: max 2.5 degrees for razor-sharp precision
    const rotateX = ((y - centerY) / centerY) * -2.5;
    const rotateY = ((x - centerX) / centerX) * 2.5;

    this.element.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateZ(3px)`;
    this.element.style.setProperty('--card-mouse-x', `${x}px`);
    this.element.style.setProperty('--card-mouse-y', `${y}px`);
  }

  private onMouseLeave() {
    if (this.isDestroyed) return;
    this.element.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease';
    this.element.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
  }

  public destroy() {
    this.isDestroyed = true;
    this.element.removeEventListener('mouseenter', this.boundEnter);
    this.element.removeEventListener('mousemove', this.boundMove);
    this.element.removeEventListener('mouseleave', this.boundLeave);
    this.element.style.transform = '';
    (this.element as unknown as { __hoverCardActive?: boolean }).__hoverCardActive = false;
  }
}

export function initHoverCards(selector = '.hover-card'): HoverCard[] {
  const elements = document.querySelectorAll<HTMLElement>(selector);
  const instances: HoverCard[] = [];
  elements.forEach((el) => {
    if ((el as unknown as { __hoverCardActive?: boolean }).__hoverCardActive) return;
    (el as unknown as { __hoverCardActive?: boolean }).__hoverCardActive = true;
    instances.push(new HoverCard(el));
  });
  return instances;
}
