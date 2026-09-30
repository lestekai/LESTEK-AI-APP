/**
 * Aether Flow Interactive Canvas Background
 * Tailored for LESTEK: High Performance Computing
 * Features:
 * - Electric Blue & Cyber Cyan palette matching LESTEK branding
 * - Smooth physics with mouse repulsion and touch support
 * - Dynamic constellation link rendering with mouse proximity glow
 * - High-DPI (Retina) support
 * - Battery-friendly auto-pause when tab is hidden
 * - Zero interference with user interactions (pointer-events-none)
 */

export function initAetherBackground(customOptions = {}) {
    // Check if canvas already exists or if we need to mount one
    let canvas = document.getElementById('aether-flow-canvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'aether-flow-canvas';
        canvas.className = 'fixed inset-0 w-full h-full pointer-events-none -z-10 select-none';
        canvas.setAttribute('aria-hidden', 'true');
        document.body.prepend(canvas);
    }

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return null;

    const options = {
        // App brand colors (Electric blue: #3b82f6, Cyan highlights: #60a5fa, White glow)
        particleColor: 'rgba(59, 130, 246, 0.75)',
        secondaryColor: 'rgba(96, 165, 250, 0.85)',
        accentColor: 'rgba(147, 197, 253, 0.9)',
        lineBaseColor: '59, 130, 246', // RGB format for dynamic alpha
        lineHighlightColor: '191, 219, 254', // Bright ice blue for cursor proximity
        mouseRadius: 180,
        speedMultiplier: 0.35,
        ...customOptions
    };

    let animationFrameId = null;
    let particles = [];
    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2 for performance

    const mouse = {
        x: null,
        y: null,
        radius: options.mouseRadius
    };

    class Particle {
        constructor() {
            this.reset(true);
        }

        reset(initial = false) {
            this.size = Math.random() * 2.2 + 0.8;
            this.x = initial ? Math.random() * width : (Math.random() < 0.5 ? -10 : width + 10);
            this.y = initial ? Math.random() * height : Math.random() * height;
            
            const speed = (Math.random() * 0.4 + 0.15) * options.speedMultiplier;
            const angle = Math.random() * Math.PI * 2;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;

            // Varied blue shades for a living electric feel
            const rand = Math.random();
            if (rand > 0.85) {
                this.color = options.accentColor;
                this.glow = true;
            } else if (rand > 0.5) {
                this.color = options.secondaryColor;
                this.glow = false;
            } else {
                this.color = options.particleColor;
                this.glow = false;
            }
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
            ctx.fillStyle = this.color;
            if (this.glow) {
                ctx.shadowBlur = 8;
                ctx.shadowColor = 'rgba(59, 130, 246, 0.8)';
            } else {
                ctx.shadowBlur = 0;
            }
            ctx.fill();
        }

        update() {
            // Screen boundary check with wrap/bounce
            if (this.x > width + 20) this.x = -10;
            else if (this.x < -20) this.x = width + 10;
            if (this.y > height + 20) this.y = -10;
            else if (this.y < -20) this.y = height + 10;

            // Interactive mouse & touch repulsion
            if (mouse.x !== null && mouse.y !== null) {
                const dx = mouse.x - this.x;
                const dy = mouse.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < mouse.radius + this.size) {
                    const force = (mouse.radius - dist) / mouse.radius;
                    const forceDirX = dx / dist;
                    const forceDirY = dy / dist;
                    this.x -= forceDirX * force * 4.5;
                    this.y -= forceDirY * force * 4.5;
                }
            }

            this.x += this.vx;
            this.y += this.vy;
            this.draw();
        }
    }

    function initParticles() {
        particles = [];
        const isMobile = width < 768;
        mouse.radius = isMobile ? 120 : options.mouseRadius;
        
        // Dynamically balance particle count: mobile gets fewer particles for 60fps & battery preservation
        const area = width * height;
        const particleCount = isMobile 
            ? Math.max(20, Math.min(42, Math.floor(area / 18000)))
            : Math.max(35, Math.min(85, Math.floor(area / 13000)));

        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }
    }

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        dpr = Math.min(window.devicePixelRatio || 1, 2);

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        ctx.scale(dpr, dpr);
        initParticles();
    }

    function connectLines() {
        ctx.shadowBlur = 0;
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
                    // Calibrated opacity: subtle ambient lines that don't obscure text readability
                    const opacity = (1 - dist / maxDist) * 0.22;

                    let nearMouse = false;
                    if (mouse.x !== null && mouse.y !== null) {
                        const mdx = pA.x - mouse.x;
                        const mdy = pA.y - mouse.y;
                        if ((mdx * mdx + mdy * mdy) < (mouse.radius * mouse.radius)) {
                            nearMouse = true;
                        }
                    }

                    ctx.lineWidth = nearMouse ? 1.1 : 0.7;
                    if (nearMouse) {
                        ctx.strokeStyle = `rgba(${options.lineHighlightColor}, ${Math.min(0.8, opacity * 2.8).toFixed(3)})`;
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

        // Clear transparently so the body's #050505 and tech-grid are preserved
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
    };

    const handleMouseLeave = () => {
        mouse.x = null;
        mouse.y = null;
    };

    const handleTouchStart = (e) => {
        if (e.touches && e.touches[0]) {
            mouse.x = e.touches[0].clientX;
            mouse.y = e.touches[0].clientY;
        }
    };

    const handleTouchMove = (e) => {
        if (e.touches && e.touches[0]) {
            mouse.x = e.touches[0].clientX;
            mouse.y = e.touches[0].clientY;
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
        resizeTimeout = setTimeout(resize, 150);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseout', handleMouseLeave);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    resize();
    animate();

    return {
        destroy: () => {
            isRunning = false;
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', handleResize);
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
