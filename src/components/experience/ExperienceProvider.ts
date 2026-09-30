/**
 * ExperienceProvider.ts
 * Unified Experience Layer for LESTEK.
 * Coordinates background, particles, custom cursor, smooth scroll,
 * magnetic microinteractions, text reveals, and scroll orchestration.
 */

import { TechBackground } from './TechBackground';
import { ParticleField } from './ParticleField';
import { CustomCursor } from './CustomCursor';
import { initMagneticButtons, MagneticButton } from './MagneticButton';
import { initGlowButtons, GlowButton } from './GlowButton';
import { initHoverCards, HoverCard } from './HoverCard';
import { animateHeroSequence } from './TextReveal';
import { ScrollRevealManager } from './ScrollReveal';
import { ParallaxManager } from './Parallax';
import { PageTransition } from './PageTransition';
import { initSmoothScroll, destroySmoothScroll } from '../../hooks/useSmoothScroll';
import { startPerformanceMonitor, stopPerformanceMonitor } from '../../lib/animations/performance';
import { animatePageIn } from '../../lib/animations/transitions';

export class ExperienceProvider {
  private static instance: ExperienceProvider | null = null;
  private techBg: TechBackground | null = null;
  private particleField: ParticleField | null = null;
  private customCursor: CustomCursor | null = null;
  private scrollReveal: ScrollRevealManager | null = null;
  private parallax: ParallaxManager | null = null;
  private pageTransition: PageTransition | null = null;
  private magneticButtons: MagneticButton[] = [];
  private glowButtons: GlowButton[] = [];
  private hoverCards: HoverCard[] = [];

  private constructor() {
    this.init();
  }

  public static getInstance(): ExperienceProvider {
    if (!ExperienceProvider.instance) {
      ExperienceProvider.instance = new ExperienceProvider();
    }
    return ExperienceProvider.instance;
  }

  private init(): void {
    if (typeof window === 'undefined') return;

    // 1. Hardware background and energy particles
    this.techBg = new TechBackground();
    this.particleField = new ParticleField();

    // 2. High performance desktop cursor
    this.customCursor = new CustomCursor();

    // 3. Smooth scrolling (Lenis) if eligible
    initSmoothScroll();

    // 4. Performance monitoring and adaptive quality degradation
    startPerformanceMonitor();

    // 5. Initial page in transition
    animatePageIn();

    // 6. Interactive microinteractions
    this.bindMicroInteractions();

    // 7. Scroll orchestration & Parallax
    this.scrollReveal = new ScrollRevealManager();
    this.parallax = new ParallaxManager();

    // 8. Page transition link choreography
    this.pageTransition = new PageTransition();

    // 9. Hero entrance if on hero page and not covered by loader
    const loader = document.getElementById('global-loader');
    if (!loader && document.getElementById('hero-title')) {
      this.playHeroEntrance();
    }
  }

  public playHeroEntrance(): void {
    if (document.getElementById('hero-title')) {
      animateHeroSequence();
    }
  }

  public bindMicroInteractions(): void {
    this.magneticButtons.forEach((b) => b.destroy());
    this.glowButtons.forEach((b) => b.destroy());
    this.hoverCards.forEach((c) => c.destroy());

    this.magneticButtons = initMagneticButtons();
    this.glowButtons = initGlowButtons();
    this.hoverCards = initHoverCards();

    if (this.customCursor) {
      this.customCursor.bindHoverListeners();
    }
  }

  public refresh(): void {
    // Rebind newly rendered DOM elements (e.g. dynamic services or products from Firestore)
    this.bindMicroInteractions();
    if (this.scrollReveal) {
      this.scrollReveal.refresh();
    }
  }

  public destroy(): void {
    if (this.techBg) this.techBg.destroy();
    if (this.particleField) this.particleField.destroy();
    if (this.customCursor) this.customCursor.destroy();
    if (this.scrollReveal) this.scrollReveal.destroy();
    if (this.parallax) this.parallax.destroy();

    this.magneticButtons.forEach((b) => b.destroy());
    this.glowButtons.forEach((b) => b.destroy());
    this.hoverCards.forEach((c) => c.destroy());

    destroySmoothScroll();
    stopPerformanceMonitor();

    ExperienceProvider.instance = null;
  }
}

export function initExperience(): ExperienceProvider {
  return ExperienceProvider.getInstance();
}
