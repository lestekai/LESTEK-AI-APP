/**
 * TextReveal.ts
 * Cinematic typography reveal sequence using GSAP.
 * Snappy, precise, hardware-inspired pacing matching VOS9X.
 *
 * Sequence order:
 * 1. Background & 3D Core Layer
 * 2. Kicker & Marca / Badge Group
 * 3. Título Principal (POTENCIALIZANDO O SEU FUTURO) with masked glide
 * 4. Subtítulo (Hardware & Performance)
 * 5. CTA Buttons & Technical Matrix
 */

import { gsap } from 'gsap';
import { isReducedMotion } from '../../hooks/useReducedMotion';

export function animateHeroSequence(options: {
  onComplete?: () => void;
} = {}): gsap.core.Timeline | null {
  if (isReducedMotion()) {
    return null;
  }

  const tl = gsap.timeline({
    defaults: { ease: 'power3.out' },
    onComplete: options.onComplete,
  });

  // 1. Background & Particle Layer entrance
  const particleLayer = document.getElementById('lestek-particle-layer');
  const techBg = document.getElementById('lestek-tech-bg');
  const bgElements = [particleLayer, techBg].filter(Boolean);
  if (bgElements.length > 0) {
    tl.fromTo(
      bgElements,
      { opacity: 0, scale: 0.98 },
      { opacity: 1, scale: 1, duration: 1.0, ease: 'power2.out' },
      0
    );
  }

  // 2. Kicker Tag & Badge Group
  const kicker = document.getElementById('hero-kicker');
  const badgeGroup = document.getElementById('hero-badge-group');
  if (kicker || badgeGroup) {
    tl.fromTo(
      [kicker, badgeGroup].filter(Boolean),
      { opacity: 0, y: -24, filter: 'blur(6px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.7, stagger: 0.08, ease: 'power3.out' },
      0.15
    );
  }

  // 3. Título Principal (POTENCIALIZANDO O SEU FUTURO)
  // Check if lines are wrapped in .hero-line or target title directly
  const title = document.getElementById('hero-title');
  if (title) {
    const lines = title.querySelectorAll('.hero-line');
    if (lines.length > 0) {
      tl.fromTo(
        lines,
        { y: '110%', opacity: 0, rotateX: -15 },
        {
          y: '0%',
          opacity: 1,
          rotateX: 0,
          duration: 0.9,
          stagger: 0.12,
          ease: 'power4.out',
        },
        0.35
      );
    } else {
      tl.fromTo(
        title,
        { opacity: 0, y: 35, filter: 'blur(10px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.85, ease: 'power4.out' },
        0.35
      );
    }
  }

  // 4. Subtitle Description
  const desc = document.getElementById('hero-subtitle');
  if (desc) {
    tl.fromTo(
      desc,
      { opacity: 0, y: 20, filter: 'blur(4px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.65, ease: 'power3.out' },
      0.55
    );
  }

  // 5. CTA Buttons
  const cta = document.getElementById('hero-cta');
  if (cta) {
    tl.fromTo(
      cta,
      { opacity: 0, y: 25, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.65, ease: 'back.out(1.2)' },
      0.7
    );
  }

  // 6. Specs HUD Grid
  const specs = document.getElementById('hero-specs-hud');
  if (specs) {
    const specItems = specs.querySelectorAll('.spec-item');
    tl.fromTo(
      specItems.length > 0 ? specItems : specs,
      { opacity: 0, y: 15 },
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.06, ease: 'power2.out' },
      0.85
    );
  }

  return tl;
}
