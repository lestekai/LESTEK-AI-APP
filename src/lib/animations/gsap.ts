/**
 * gsap.ts
 * Centralized GSAP & ScrollTrigger configuration.
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { isReducedMotion } from '../../hooks/useReducedMotion';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({
    ease: 'power3.out',
    duration: 0.8,
  });
}

export { gsap, ScrollTrigger };

/**
 * Cleanly clean up all ScrollTriggers when switching views or unmounting
 */
export function cleanUpTriggers(): void {
  ScrollTrigger.getAll().forEach((st) => st.kill());
}

/**
 * Splits text into animated span words for staggered reveal
 */
export function splitTextIntoWords(element: HTMLElement): HTMLElement[] {
  const originalText = element.textContent || '';
  const words = originalText.trim().split(/\s+/);
  element.innerHTML = '';
  
  const spanWords: HTMLElement[] = [];
  words.forEach((word, index) => {
    const wordWrapper = document.createElement('span');
    wordWrapper.className = 'inline-block overflow-hidden align-top';
    
    const wordInner = document.createElement('span');
    wordInner.className = 'inline-block transform-gpu will-change-transform';
    wordInner.textContent = word;
    
    wordWrapper.appendChild(wordInner);
    element.appendChild(wordWrapper);
    spanWords.push(wordInner);

    if (index < words.length - 1) {
      element.appendChild(document.createTextNode(' '));
    }
  });

  return spanWords;
}

/**
 * Standard staggered reveal for cards and containers
 */
export function revealElements(
  elements: HTMLElement[] | NodeListOf<HTMLElement> | string,
  options: {
    y?: number;
    stagger?: number;
    delay?: number;
    duration?: number;
    scrollTrigger?: ScrollTrigger.Vars;
  } = {}
) {
  if (isReducedMotion()) {
    gsap.set(elements, { opacity: 1, y: 0 });
    return;
  }

  const {
    y = 30,
    stagger = 0.08,
    delay = 0,
    duration = 0.7,
    scrollTrigger,
  } = options;

  gsap.fromTo(
    elements,
    { opacity: 0, y, willChange: 'transform, opacity' },
    {
      opacity: 1,
      y: 0,
      stagger,
      delay,
      duration,
      ease: 'power3.out',
      scrollTrigger: scrollTrigger || undefined,
      clearProps: 'willChange',
    }
  );
}
