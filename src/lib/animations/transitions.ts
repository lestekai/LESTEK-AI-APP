/**
 * transitions.ts
 * Elegant hardware-inspired screen transitions and confirmation states.
 */

import { gsap } from 'gsap';
import { isReducedMotion } from '../../hooks/useReducedMotion';

export function animatePageIn(): void {
  if (isReducedMotion()) return;

  const main = document.querySelector('main');
  if (main) {
    gsap.fromTo(
      main,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
    );
  }
}

export function playFormSubmissionConfirmation(
  formContainer: HTMLElement,
  successContainer: HTMLElement
): Promise<void> {
  return new Promise((resolve) => {
    if (isReducedMotion()) {
      formContainer.classList.add('hidden');
      successContainer.classList.remove('hidden');
      resolve();
      return;
    }

    const tl = gsap.timeline({
      onComplete: () => {
        formContainer.classList.add('hidden');
        successContainer.classList.remove('hidden');

        gsap.fromTo(
          successContainer,
          { opacity: 0, scale: 0.95, y: 15 },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.5,
            ease: 'back.out(1.4)',
            onComplete: resolve,
          }
        );
      },
    });

    tl.to(formContainer, {
      opacity: 0,
      scale: 0.98,
      y: -10,
      duration: 0.35,
      ease: 'power2.in',
    });
  });
}
