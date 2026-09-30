/**
 * particles.ts
 * LESTEK VOS9X-Grade Interactive 3D Cybernetic Core & Particle Nexus.
 *
 * Implements:
 * - 3D Wireframe Cyber-Core (Icosahedron / Hardware Node Lattice) with chromatic neon glows
 * - Dual Orbital Energy Rings (Electric Cyan #00E1FF & Deep Violet #5411FF)
 * - Dynamic Particle Swarm that reacts organically to cursor velocity and scroll
 * - Additive Blending and Specular Shaders
 * - High-speed Canvas 2D fallback for lower tiers
 * - Auto-recovery from WebGL context loss
 */

import * as THREE from 'three';
import { getPerformanceTier, PerformanceTier } from '../../hooks/usePerformanceTier';
import { isReducedMotion } from '../../hooks/useReducedMotion';

export interface ParticleEngine {
  destroy(): void;
  onResize(width: number, height: number): void;
  onMouseMove(x: number, y: number): void;
  onScroll(scrollY: number): void;
}

/**
 * Three.js WebGL High-End Cybernetic Core & Particle System (VOS9X Style)
 */
class ThreeJSParticleEngine implements ParticleEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer | null = null;
  private animFrameId: number | null = null;

  // 3D Objects
  private coreGroup: THREE.Group = new THREE.Group();
  private innerCore: THREE.Mesh | null = null;
  private outerWireframe: THREE.LineSegments | null = null;
  private ringMesh1: THREE.LineLoop | null = null;
  private ringMesh2: THREE.LineLoop | null = null;
  private points: THREE.Points | null = null;
  private lineSegments: THREE.LineSegments | null = null;

  // State & Physics
  private mouse = { x: 0, y: 0, targetX: 0, targetY: 0, vx: 0, vy: 0 };
  private scroll = { y: 0, targetY: 0 };
  private isTabVisible = true;
  private positions: Float32Array = new Float32Array();
  private basePositions: Float32Array = new Float32Array();
  private particleCount = 140;

  constructor(container: HTMLElement) {
    this.container = container;
    this.scene = new THREE.Scene();

    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(55, width / height, 1, 3000);
    this.camera.position.z = 580;

    try {
      this.renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.setClearColor(0x000000, 0);

      const canvas = this.renderer.domElement;
      canvas.className = 'absolute inset-0 w-full h-full pointer-events-none z-0';
      this.container.appendChild(canvas);

      this.scene.add(this.coreGroup);
      this.initCyberCore();
      this.initParticles();
      this.bindEvents(canvas);
      this.render();
    } catch (err) {
      console.warn('[LESTEK 3D] WebGL initiation failed:', err);
    }
  }

  private corePoints: THREE.Points | null = null;

  private initCyberCore() {
    const particleTexture = this.createParticleTexture();

    // 1. Inner Crystalline Polyhedron (Hardware Core)
    const innerGeom = new THREE.IcosahedronGeometry(95, 1);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x00e1ff,
      wireframe: true,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
    });
    this.innerCore = new THREE.Mesh(innerGeom, innerMat);
    this.coreGroup.add(this.innerCore);

    // 2. Vertex Nodes on Core (Glowing star points on each vertex of polyhedron)
    const corePointsMat = new THREE.PointsMaterial({
      size: 16,
      map: particleTexture,
      color: 0x00e1ff,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.corePoints = new THREE.Points(innerGeom, corePointsMat);
    this.coreGroup.add(this.corePoints);

    // 3. Outer Wireframe Cage (Violet / Electric Shield)
    const outerGeom = new THREE.IcosahedronGeometry(140, 0);
    const wireGeom = new THREE.WireframeGeometry(outerGeom);
    const outerMat = new THREE.LineBasicMaterial({
      color: 0x8b5cf6,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });
    this.outerWireframe = new THREE.LineSegments(wireGeom, outerMat);
    this.coreGroup.add(this.outerWireframe);

    // 4. Orbital Ring 1 (Cyan neon equator ring)
    const ringGeom1 = new THREE.BufferGeometry();
    const ringPoints1: THREE.Vector3[] = [];
    const segments = 80;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      ringPoints1.push(new THREE.Vector3(Math.cos(theta) * 190, Math.sin(theta) * 190, 0));
    }
    ringGeom1.setFromPoints(ringPoints1);
    const ringMat1 = new THREE.LineBasicMaterial({
      color: 0x00e1ff,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });
    this.ringMesh1 = new THREE.LineLoop(ringGeom1, ringMat1);
    this.ringMesh1.rotation.x = Math.PI / 3;
    this.coreGroup.add(this.ringMesh1);

    // 5. Orbital Ring 2 (Violet / Blue polar ring)
    const ringGeom2 = new THREE.BufferGeometry();
    const ringPoints2: THREE.Vector3[] = [];
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      ringPoints2.push(new THREE.Vector3(Math.cos(theta) * 230, 0, Math.sin(theta) * 230));
    }
    ringGeom2.setFromPoints(ringPoints2);
    const ringMat2 = new THREE.LineBasicMaterial({
      color: 0x5411ff,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    this.ringMesh2 = new THREE.LineLoop(ringGeom2, ringMat2);
    this.ringMesh2.rotation.z = Math.PI / 4;
    this.coreGroup.add(this.ringMesh2);

    // Position cyber core prominent in hero center
    this.coreGroup.position.set(0, 20, 0);
  }

  private initParticles() {
    this.particleCount = window.innerWidth < 768 ? 60 : 130;
    this.positions = new Float32Array(this.particleCount * 3);
    this.basePositions = new Float32Array(this.particleCount * 3);
    const colors = new Float32Array(this.particleCount * 3);

    // VOS9X Signature Palette: Neon Cyan (#00E1FF), Deep Violet (#5411FF), Electric Blue (#3B82F6)
    const cCyan = new THREE.Color(0x00e1ff);
    const cViolet = new THREE.Color(0x5411ff);
    const cBlue = new THREE.Color(0x3b82f6);

    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;
      const spreadX = 1400;
      const spreadY = 900;
      const spreadZ = 800;

      const x = (Math.random() - 0.5) * spreadX;
      const y = (Math.random() - 0.5) * spreadY;
      const z = (Math.random() - 0.5) * spreadZ;

      this.positions[i3] = x;
      this.positions[i3 + 1] = y;
      this.positions[i3 + 2] = z;

      this.basePositions[i3] = x;
      this.basePositions[i3 + 1] = y;
      this.basePositions[i3 + 2] = z;

      const rand = Math.random();
      const col = rand < 0.4 ? cCyan : rand < 0.75 ? cBlue : cViolet;
      colors[i3] = col.r;
      colors[i3 + 1] = col.g;
      colors[i3 + 2] = col.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleTexture = this.createParticleTexture();

    const material = new THREE.PointsMaterial({
      size: 9,
      map: particleTexture,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.85,
    });

    this.points = new THREE.Points(geometry, material);
    this.scene.add(this.points);

    // Interconnected dynamic cyber lines
    const maxLineSegments = 160;
    const linePositions = new Float32Array(maxLineSegments * 6);
    const lineColors = new Float32Array(maxLineSegments * 6);

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    lineGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));

    const lineMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.lineSegments = new THREE.LineSegments(lineGeometry, lineMaterial);
    this.scene.add(this.lineSegments);
  }

  private createParticleTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.3, 'rgba(0, 225, 255, 0.9)');
      gradient.addColorStop(0.7, 'rgba(84, 17, 255, 0.3)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 32, 32);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  private bindEvents(canvas: HTMLCanvasElement) {
    document.addEventListener('visibilitychange', () => {
      this.isTabVisible = !document.hidden;
    });

    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    });

    canvas.addEventListener('webglcontextrestored', () => {
      this.initCyberCore();
      this.initParticles();
      this.render();
    });
  }

  onMouseMove(x: number, y: number): void {
    const prevTargetX = this.mouse.targetX;
    const prevTargetY = this.mouse.targetY;
    this.mouse.targetX = (x / window.innerWidth) * 2 - 1;
    this.mouse.targetY = -(y / window.innerHeight) * 2 + 1;
    this.mouse.vx = this.mouse.targetX - prevTargetX;
    this.mouse.vy = this.mouse.targetY - prevTargetY;
  }

  onScroll(scrollY: number): void {
    this.scroll.targetY = scrollY;
  }

  onResize(width: number, height: number): void {
    if (!this.renderer || !this.camera) return;
    const w = width || window.innerWidth;
    const h = height || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  private render = () => {
    if (!this.renderer || !this.scene || !this.camera) return;

    if (this.isTabVisible) {
      // Lerp mouse and scroll with organic physics
      this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.06;
      this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.06;
      this.scroll.y += (this.scroll.targetY - this.scroll.y) * 0.06;

      const time = performance.now() * 0.0006;
      const scrollNorm = this.scroll.y * 0.0008;

      // 1. Cyber Core 3D Motion & Velocity Tilt
      if (this.coreGroup) {
        this.coreGroup.rotation.y = time * 0.25 + this.mouse.x * 0.7 + scrollNorm * 1.5;
        this.coreGroup.rotation.x = time * 0.15 + this.mouse.y * 0.5 + Math.sin(scrollNorm) * 0.4;
        this.coreGroup.rotation.z = Math.cos(time * 0.2) * 0.15;

        // Core transforms on scroll: scales and slides gently to frame the page
        const coreScale = Math.max(0.65, 1 - this.scroll.y * 0.0003);
        this.coreGroup.scale.set(coreScale, coreScale, coreScale);
        this.coreGroup.position.y = 40 - Math.min(220, this.scroll.y * 0.15);
      }

      if (this.innerCore) {
        this.innerCore.rotation.y = -time * 0.35;
        this.innerCore.rotation.z = time * 0.2;
      }

      if (this.ringMesh1) {
        this.ringMesh1.rotation.z = time * 0.4;
      }
      if (this.ringMesh2) {
        this.ringMesh2.rotation.y = -time * 0.3;
      }

      // 2. Camera perspective responds to depth
      this.camera.position.x = Math.sin(time * 0.3) * 30 + this.mouse.x * 40;
      this.camera.position.y = Math.cos(time * 0.2) * 25 + this.mouse.y * 30;

      // 3. Dynamic Particle Constellation
      if (this.points && this.lineSegments) {
        const linePosAttr = this.lineSegments.geometry.attributes.position as THREE.BufferAttribute;
        const lineColAttr = this.lineSegments.geometry.attributes.color as THREE.BufferAttribute;
        const linePositions = linePosAttr.array as Float32Array;
        const lineColors = lineColAttr.array as Float32Array;

        let lineIdx = 0;
        const maxLines = linePositions.length / 6;
        const connectDistSq = 150 * 150;

        for (let i = 0; i < this.particleCount; i++) {
          const i3 = i * 3;
          const x1 = this.basePositions[i3] + Math.sin(time + i) * 25;
          const y1 = this.basePositions[i3 + 1] + Math.cos(time + i * 1.3) * 25;
          const z1 = this.basePositions[i3 + 2] + Math.sin(time * 0.8 + i) * 15;

          this.positions[i3] = x1;
          this.positions[i3 + 1] = y1;
          this.positions[i3 + 2] = z1;

          for (let j = i + 1; j < this.particleCount && lineIdx < maxLines; j++) {
            const j3 = j * 3;
            const dx = x1 - this.positions[j3];
            const dy = y1 - this.positions[j3 + 1];
            const dz = z1 - this.positions[j3 + 2];
            const dSq = dx * dx + dy * dy + dz * dz;

            if (dSq < connectDistSq) {
              const alpha = Math.max(0, 1 - dSq / connectDistSq);
              const pIdx = lineIdx * 6;

              linePositions[pIdx] = x1;
              linePositions[pIdx + 1] = y1;
              linePositions[pIdx + 2] = z1;

              linePositions[pIdx + 3] = this.positions[j3];
              linePositions[pIdx + 4] = this.positions[j3 + 1];
              linePositions[pIdx + 5] = this.positions[j3 + 2];

              // Cyan to Violet electric glow lines
              lineColors[pIdx] = 0.0 * alpha;
              lineColors[pIdx + 1] = 0.88 * alpha;
              lineColors[pIdx + 2] = 1.0 * alpha;

              lineColors[pIdx + 3] = 0.33 * alpha;
              lineColors[pIdx + 4] = 0.07 * alpha;
              lineColors[pIdx + 5] = 1.0 * alpha;

              lineIdx++;
            }
          }
        }

        for (let k = lineIdx * 6; k < linePositions.length; k++) {
          linePositions[k] = 0;
          lineColors[k] = 0;
        }

        (this.points.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
        linePosAttr.needsUpdate = true;
        lineColAttr.needsUpdate = true;
      }

      this.renderer.render(this.scene, this.camera);
    }

    this.animFrameId = requestAnimationFrame(this.render);
  };

  destroy(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement && this.renderer.domElement.parentElement) {
        this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
      }
      this.renderer = null;
    }
    if (this.innerCore) {
      this.innerCore.geometry.dispose();
      (this.innerCore.material as THREE.Material).dispose();
    }
    if (this.outerWireframe) {
      this.outerWireframe.geometry.dispose();
      (this.outerWireframe.material as THREE.Material).dispose();
    }
    if (this.ringMesh1) {
      this.ringMesh1.geometry.dispose();
      (this.ringMesh1.material as THREE.Material).dispose();
    }
    if (this.ringMesh2) {
      this.ringMesh2.geometry.dispose();
      (this.ringMesh2.material as THREE.Material).dispose();
    }
    if (this.points) {
      this.points.geometry.dispose();
      (this.points.material as THREE.Material).dispose();
    }
    if (this.lineSegments) {
      this.lineSegments.geometry.dispose();
      (this.lineSegments.material as THREE.Material).dispose();
    }
  }
}

/**
 * 2D Canvas Constellation Particle Engine (MEDIUM Tier Fallback)
 */
class Canvas2DParticleEngine implements ParticleEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private animId: number | null = null;
  private particles: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    alpha: number;
    color: string;
  }> = [];
  private mouse = { x: -1000, y: -1000 };
  private scrollY = 0;

  constructor(container: HTMLElement) {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'absolute inset-0 w-full h-full pointer-events-none z-0';
    container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');

    this.init();
    this.loop();
  }

  private init() {
    const width = (this.canvas.width = window.innerWidth);
    const height = (this.canvas.height = window.innerHeight);
    const count = Math.floor(Math.min(50, width / 25));
    this.particles = [];

    const colors = ['#00e1ff', '#5411ff', '#3b82f6'];

    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2 + 1,
        alpha: Math.random() * 0.6 + 0.3,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
  }

  onMouseMove(x: number, y: number): void {
    this.mouse.x = x;
    this.mouse.y = y;
  }

  onScroll(scrollY: number): void {
    this.scrollY = scrollY;
  }

  onResize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.init();
  }

  private loop = () => {
    if (!this.ctx) return;
    const width = this.canvas.width;
    const height = this.canvas.height;

    this.ctx.clearRect(0, 0, width, height);

    const connectDist = 120;
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const p1 = this.particles[i];
        const p2 = this.particles[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < connectDist) {
          const alpha = (1 - dist / connectDist) * 0.25;
          this.ctx.strokeStyle = `rgba(0, 225, 255, ${alpha})`;
          this.ctx.lineWidth = 0.8;
          this.ctx.beginPath();
          this.ctx.moveTo(p1.x, p1.y);
          this.ctx.lineTo(p2.x, p2.y);
          this.ctx.stroke();
        }
      }
    }

    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      const mdx = p.x - this.mouse.x;
      const mdy = p.y - this.mouse.y;
      const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
      if (mDist < 100) {
        const force = (100 - mDist) / 100;
        p.x += (mdx / mDist) * force * 2;
        p.y += (mdy / mDist) * force * 2;
      }

      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.alpha;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.globalAlpha = 1;

    this.animId = requestAnimationFrame(this.loop);
  };

  destroy(): void {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    if (this.canvas && this.canvas.parentElement) {
      this.canvas.parentElement.removeChild(this.canvas);
    }
  }
}

/**
 * CSS Static Atmospheric Fallback (LOW Tier)
 */
class CSSFallbackParticleEngine implements ParticleEngine {
  private element: HTMLElement | null = null;

  constructor(container: HTMLElement) {
    const el = document.createElement('div');
    el.className = 'absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(0,225,255,0.06),transparent_60%)] pointer-events-none z-0';
    container.appendChild(el);
    this.element = el;
  }

  destroy(): void {
    if (this.element && this.element.parentElement) {
      this.element.parentElement.removeChild(this.element);
      this.element = null;
    }
  }

  onResize(): void {}
  onMouseMove(): void {}
  onScroll(): void {}
}

/**
 * Factory creating the optimal particle engine based on capability
 */
export function createParticleEngine(container: HTMLElement): ParticleEngine {
  if (isReducedMotion()) {
    return new CSSFallbackParticleEngine(container);
  }

  const tier = getPerformanceTier();
  if (tier === 'LOW') {
    return new CSSFallbackParticleEngine(container);
  }

  if (tier === 'MEDIUM') {
    return new Canvas2DParticleEngine(container);
  }

  try {
    return new ThreeJSParticleEngine(container);
  } catch (err) {
    console.warn('[LESTEK 3D] Three.js failed, falling back to 2D:', err);
    return new Canvas2DParticleEngine(container);
  }
}
