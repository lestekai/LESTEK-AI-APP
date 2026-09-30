/**
 * Aether Flow Interactive Canvas Background
 * Tailored for LESTEK: High Performance Computing
 * Features:
 * - Electric Blue & Cyber Cyan palette matching LESTEK branding
 * - Smooth physics with mobile scroll stabilization (no stutter or resets on mobile viewport change)
 * - Dynamic constellation link rendering with mouse proximity glow
 * - High-DPI (Retina) support without performance lag
 * - Battery-friendly auto-pause when tab is hidden
 * - Zero interference with user interactions (pointer-events-none)
 */

export function initAetherBackground(customOptions = {}) {
    let canvas = document.getElementById('aether-flow-canvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'aether-flow-canvas';
        canvas.className = 'fixed inset-0 w-full h-full pointer-events-none select-none';
        canvas.setAttribute('aria-hidden', 'true');
        canvas.style.zIndex = '0';
        document.body.prepend(canvas);
    }

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return null;

    const options = {
        particleColor: 'rgba(59, 130, 246, 0.75)',
        secondaryColor: 'rgba(96, 165, 250, 0.85)',
        accentColor: 'rgba(147, 197, 253, 0.95)',
        lineBaseColor: '59, 130, 246',
        lineHighlightColor: '191, 219, 254',
        mouseRadius: 160,
        speedMultiplier: 0.35,
        ...customOptions
    };

    let animationFrameId = null;
    let particles = [];
    let width = window.innerWidth;
    let height = window.innerHeight;
    let lastWidth = width;
    let lastHeight = height;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const mouse = {
        x: null,
        y: null,
        radius: options.mouseRadius,
        isTouch: false
    };

    class Particle {
        constructor(initial = true) {
            this.reset(initial);
        }

        reset(initial = false) {
            this.size = Math.random() * 2.0 + 0.8;
            this.x = initial ? Math.random() * width : (Math.random() < 0.5 ? -10 : width + 10);
            this.y = initial ? Math.random() * height : Math.random() * height;
            
            const speed = (Math.random() * 0.35 + 0.12) * options.speedMultiplier;
            const angle = Math.random() * Math.PI * 2;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;

            const rand = Math.random();
            if (rand > 0.82) {
                this.color = options.accentColor;
                this.glow = true;
            } else if (rand > 0.45) {
                this.color = options.secondaryColor;
                this.glow = false;
            } else {
                this.color = options.particleColor;
                this.glow = false;
            }
        }

        draw() {
            // Highly optimized draw without costly shadowBlur to guarantee 60fps on mobile
            if (this.glow) {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * 2.2, 0, Math.PI * 2, false);
                ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
                ctx.fill();
            }

            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
            ctx.fillStyle = this.color;
            ctx.fill();
        }

        update() {
            // Screen boundary check with seamless wrap
            if (this.x > width + 20) this.x = -15;
            else if (this.x < -20) this.x = width + 15;
            if (this.y > height + 20) this.y = -15;
            else if (this.y < -20) this.y = height + 15;

            // Interactive mouse & touch repulsion with smoothed response
            if (mouse.x !== null && mouse.y !== null) {
                const dx = mouse.x - this.x;
                const dy = mouse.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const currentRadius = mouse.isTouch ? 80 : mouse.radius;

                if (dist < currentRadius + this.size && dist > 0.1) {
                    const force = (currentRadius - dist) / currentRadius;
                    const forceDirX = dx / dist;
                    const forceDirY = dy / dist;
                    const repulsionStrength = mouse.isTouch ? 1.5 : 3.5;
                    this.x -= forceDirX * force * repulsionStrength;
                    this.y -= forceDirY * force * repulsionStrength;
                }
            }

            this.x += this.vx;
            this.y += this.vy;
            this.draw();
        }
    }

    function getTargetParticleCount() {
        const isMobile = width < 768;
        const area = width * height;
        return isMobile 
            ? Math.max(22, Math.min(45, Math.floor(area / 18000)))
            : Math.max(35, Math.min(85, Math.floor(area / 13000)));
    }

    function initParticles() {
        particles = [];
        const count = getTargetParticleCount();
        for (let i = 0; i < count; i++) {
            particles.push(new Particle(true));
        }
    }

    function applyCanvasDimensions() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
    }

    function resize(forceRebuild = false) {
        const newWidth = window.innerWidth;
        const newHeight = window.innerHeight;

        // Mobile Scroll Protection:
        // On mobile devices, scrolling causes the address bar to show/hide, firing resize events.
        // If the width is unchanged and height change is small (under 160px), ignore to prevent restarts!
        const widthDelta = Math.abs(newWidth - lastWidth);
        const heightDelta = Math.abs(newHeight - lastHeight);

        if (!forceRebuild && widthDelta < 5 && heightDelta < 160) {
            return;
        }

        const oldWidth = width || 1;
        const oldHeight = height || 1;

        width = newWidth;
        height = newHeight;
        lastWidth = newWidth;
        lastHeight = newHeight;

        applyCanvasDimensions();

        if (forceRebuild || particles.length === 0) {
            initParticles();
        } else {
            // Smoothly adapt existing particles to new dimensions without resetting or flickering
            const scaleX = width / oldWidth;
            const scaleY = height / oldHeight;

            particles.forEach(p => {
                p.x = Math.max(0, Math.min(width, p.x * scaleX));
                p.y = Math.max(0, Math.min(height, p.y * scaleY));
            });

            // Adjust count smoothly
            const targetCount = getTargetParticleCount();
            while (particles.length < targetCount) {
                particles.push(new Particle(true));
            }
            if (particles.length > targetCount) {
                particles.length = targetCount;
            }
        }
    }

    function connectLines() {
        const isMobile = width < 768;
        const maxDist = isMobile ? 100 : 135;
        const maxDistSq = maxDist * maxDist;

        for (let a = 0; a < particles.length; a++) {
            const pA = particles[a];
            for (let b = a + 1; b < particles.length; b++) {
                const pB = particles[b];
                const dx = pA.x - pB.x;
                const dy = pA.y - pB.y;
                const distSq = dx * dx + dy * dy;

                if (distSq < maxDistSq) {
                    const dist = Math.sqrt(distSq);
                    const opacity = (1 - dist / maxDist) * 0.24;

                    let nearMouse = false;
                    if (mouse.x !== null && mouse.y !== null) {
                        const mdx = pA.x - mouse.x;
                        const mdy = pA.y - mouse.y;
                        const r = mouse.isTouch ? 80 : mouse.radius;
                        if ((mdx * mdx + mdy * mdy) < (r * r)) {
                            nearMouse = true;
                        }
                    }

                    ctx.lineWidth = nearMouse ? 1.1 : 0.7;
                    if (nearMouse) {
                        ctx.strokeStyle = `rgba(${options.lineHighlightColor}, ${Math.min(0.85, opacity * 2.8).toFixed(3)})`;
                    } else {
                        ctx.strokeStyle = `rgba(${options.lineBaseColor}, ${opacity.toFixed(3)})`;
                    }

                    ctx.beginPath();
                    ctx.moveTo(pA.x, pA.y);
                    ctx.lineTo(pB.x, pB.y);
                    ctx.stroke();
                }
            }
        }
    }

    let isRunning = true;

    function animate() {
        if (!isRunning) return;
        animationFrameId = requestAnimationFrame(animate);

        ctx.clearRect(0, 0, width, height);

        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
        }
        connectLines();
    }

    // Event listeners
    const handleMouseMove = (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        mouse.isTouch = false;
    };

    const handleMouseLeave = () => {
        mouse.x = null;
        mouse.y = null;
    };

    const handleTouchStart = (e) => {
        if (e.touches && e.touches[0]) {
            mouse.x = e.touches[0].clientX;
            mouse.y = e.touches[0].clientY;
            mouse.isTouch = true;
        }
    };

    const handleTouchMove = (e) => {
        if (e.touches && e.touches[0]) {
            mouse.x = e.touches[0].clientX;
            mouse.y = e.touches[0].clientY;
            mouse.isTouch = true;
        }
    };

    const handleTouchEnd = () => {
        mouse.x = null;
        mouse.y = null;
    };

    const handleVisibilityChange = () => {
        if (document.hidden) {
            isRunning = false;
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        } else {
            if (!isRunning) {
                isRunning = true;
                animate();
            }
        }
    };

    let resizeTimeout;
    const handleResize = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => resize(false), 120);
    };

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', () => resize(true), { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseout', handleMouseLeave);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    resize(true);
    animate();

    return {
        destroy: () => {
            isRunning = false;
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', () => resize(true));
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseout', handleMouseLeave);
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (canvas && canvas.parentNode) {
                canvas.parentNode.removeChild(canvas);
            }
        }
    };
}
