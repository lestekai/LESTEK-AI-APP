/**
 * GlowButton.ts
 * Illuminates button perimeters and backgrounds with dynamic hardware specular glare.
 */

import { isReducedMotion } from '../../hooks/useReducedMotion';

export class GlowButton {
  private element: HTMLElement;
  private boundMove: (e: MouseEvent) => void;

  constructor(element: HTMLElement) {
    this.element = element;
    this.boundMove = this.onMouseMove.bind(this);
    if (!isReducedMotion()) {
      this.init();
    }
  }

  private init() {
    this.element.classList.add('glow-button-target');
    this.element.addEventListener('mousemove', this.boundMove);
  }

  private onMouseMove(e: MouseEvent) {
    const rect = this.element.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    this.element.style.setProperty('--glow-x', `${x}px`);
    this.element.style.setProperty('--glow-y', `${y}px`);
  }

  public destroy() {
    this.element.removeEventListener('mousemove', this.boundMove);
  }
}

export function initGlowButtons(selector = '.btn-tech, .btn-blue, .btn-outline, #search-form button'): GlowButton[] {
  const elements = document.querySelectorAll<HTMLElement>(selector);
  const instances: GlowButton[] = [];
  elements.forEach((el) => instances.push(new GlowButton(el)));
  return instances;
}
