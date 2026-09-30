/**
 * TechBackground.ts
 * Subtle cybernetic atmospheric ambient layer with circuit lines and hardware depth.
 */

export class TechBackground {
  private element: HTMLElement | null = null;

  constructor() {
    this.init();
  }

  private init() {
    if (typeof document === 'undefined') return;

    let bg = document.getElementById('lestek-tech-bg');
    if (!bg) {
      bg = document.createElement('div');
      bg.id = 'lestek-tech-bg';
      bg.className = 'fixed inset-0 pointer-events-none z-[-1] overflow-hidden select-none';
      bg.innerHTML = `
        <div class="absolute inset-0 bg-[#050508]"></div>
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(37,99,235,0.12),transparent_60%)]"></div>
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_85%_70%,rgba(6,182,212,0.06),transparent_50%)]"></div>
        <div class="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:60px_60px]"></div>
      `;
      document.body.insertBefore(bg, document.body.firstChild);
    }
    this.element = bg;
  }

  public destroy() {
    if (this.element && this.element.parentElement) {
      this.element.parentElement.removeChild(this.element);
      this.element = null;
    }
  }
}
