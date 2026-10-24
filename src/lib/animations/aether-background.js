/**
 * Aether Flow Interactive Canvas Background
 * Tailored for LESTEK: High Performance Computing
 * Features:
 * - 1:1 Page Scroll Sync: Particles map directly to document coordinates,
 *   scrolling seamlessly in absolute lockstep with page content.
 * - Gentle, fluid cosmic gathering towards mouse cursor / mobile touch.
 * - Smooth outward dispersion and separation when pointer/touch moves away.
 * - Delicate, short-range constellation geometry (< 65px).
 * - Luminous, high-visibility neon aesthetic with subtle glowing accents.
 * - Ultra-efficient rendering: only visible on-screen particles are computed for line connections.
 * - Dynamic document height adaptation for asynchronous content loading.
 * - Mobile URL bar scroll stabilization and zero interference (pointer-events-none).
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
        // High visibility luminous palette
        particleColor: 'rgba(96, 165, 250, 0.95)',
        secondaryColor: 'rgba(147, 197, 253, 0.98)',
        accentColor: 'rgba(255, 255, 255, 1.0)',
        lineBaseColor: '96, 165, 250',
        lineHighlightColor: '224, 242, 254',
        mouseRadius: 200,
        speedMultiplier: 0.32,
        ...customOptions
    };

    let animationFrameId = null;
    let particles = [];
    let width = window.innerWidth;
    let height = window.innerHeight;
    let lastWidth = width;
    let lastHeight = height;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    function getDocHeight() {
        return Math.max(
            document.documentElement.scrollHeight,
            document.body ? document.body.scrollHeight : 0,
            window.innerHeight
        );
    }

    let docHeight = getDocHeight();

    const mouse = {
        x: null,
        y: null,
        radius: options.mouseRadius,
        isTouch: false
    };

    class Particle {
        constructor(initial = true, minY = 0, maxY = docHeight) {
            this.reset(initial, minY, maxY);
        }

        reset(initial = false, minY = 0, maxY = docHeight) {
            this.size = Math.random() * 2.5 + 1.1;
            this.x = initial ? Math.random() * width : (Math.random() < 0.5 ? -10 : width + 10);
            const range = Math.max(100, maxY - minY);
            this.y = initial ? minY + Math.random() * range : Math.random() * docHeight;
            
            const speed = (Math.random() * 0.28 + 0.10) * options.speedMultiplier;
            const angle = Math.random() * Math.PI * 2;
            this.baseVx = Math.cos(angle) * speed;
            this.baseVy = Math.sin(angle) * speed;
            this.vx = this.baseVx;
            this.vy = this.baseVy;

            // Gathering and separation tracking
            this.wasGathered = false;
            this.gatherCenterX = this.x;
            this.gatherCenterY = this.y;

            // Swirl inclination direction (+1 or -1)
            this.orbitDir = Math.random() < 0.5 ? 1 : -1;

            // Screen space projections (computed during update)
            this.screenX = this.x;
            this.screenY = this.y;
            this.isVisible = false;

            const rand = Math.random();
            if (rand > 0.72) {
                this.color = options.accentColor;
                this.glow = true;
            } else if (rand > 0.32) {
                this.color = options.secondaryColor;
                this.glow = false;
            } else {
                this.color = options.particleColor;
                this.glow = false;
            }
        }

        draw() {
            if (!this.isVisible) return;

            // Enhanced luminous glow for high visibility
            if (this.glow) {
                ctx.beginPath();
                ctx.arc(this.screenX, this.screenY, this.size * 3.0, 0, Math.PI * 2, false);
                ctx.fillStyle = 'rgba(59, 130, 246, 0.35)';
                ctx.fill();
            }

            ctx.beginPath();
            ctx.arc(this.screenX, this.screenY, this.size, 0, Math.PI * 2, false);
            ctx.fillStyle = this.color;
            ctx.fill();
        }

        update(currentScrollY) {
            // Ambient natural drift
            this.x += this.vx;
            this.y += this.vy;

            // Seamless boundary wrap in document space
            if (this.x > width + 25) {
                this.x = -15;
            } else if (this.x < -25) {
                this.x = width + 15;
            }

            if (this.y > docHeight + 25) {
                this.y = -15;
            } else if (this.y < -25) {
                this.y = docHeight + 15;
            }

            // 1:1 SCROLL SYNCHRONIZATION
            // The particle's viewport screen position is exactly offset by page scroll
            this.screenX = this.x;
            this.screenY = this.y - currentScrollY;

            // Fast viewport clipping check with generous margin
            this.isVisible = (
                this.screenY >= -70 &&
                this.screenY <= height + 70 &&
                this.screenX >= -70 &&
                this.screenX <= width + 70
            );

            // Pointer attraction operates on the visible viewport coordinate space
            const hasPointer = mouse.x !== null && mouse.y !== null;
            const attractionRadius = mouse.isTouch ? 140 : mouse.radius;
            let inAttractionField = false;

            if (hasPointer && this.isVisible) {
                const dx = mouse.x - this.screenX;
                const dy = mouse.y - this.screenY;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < attractionRadius && dist > 1) {
                    inAttractionField = true;
                    this.wasGathered = true;
                    this.gatherCenterX = mouse.x;
                    this.gatherCenterY = mouse.y;

                    const normalized = dist / attractionRadius;
                    // Gentle power curve so gathering is soft, fluid, and non-abrupt
                    const force = Math.pow(1 - normalized, 1.6);
                    const forceDirX = dx / dist;
                    const forceDirY = dy / dist;

                    // Smooth, relaxed pull strength
                    const pullStrength = mouse.isTouch ? 0.30 : 0.38;

                    if (dist < 26) {
                        // Gentle hovering/orbit around pointer center
                        this.vx = this.vx * 0.93 + (-forceDirY * this.orbitDir) * 0.32;
                        this.vy = this.vy * 0.93 + (forceDirX * this.orbitDir) * 0.32;
                    } else {
                        // Silky smooth acceleration toward pointer
                        this.vx = this.vx * 0.92 + forceDirX * force * pullStrength;
                        this.vy = this.vy * 0.92 + forceDirY * force * pullStrength;
                    }
                }
            }

            // SEPARATION LOGIC: When pointer moves away or scrolls past, gently disperse outward
            if (!inAttractionField) {
                if (this.wasGathered) {
                    // Soft outward dispersion burst away from the previous cluster
                    const disperseAngle = Math.atan2(this.screenY - this.gatherCenterY, this.screenX - this.gatherCenterX) + (Math.random() - 0.5) * 0.6;
                    const disperseSpeed = Math.random() * 0.45 + 0.22;
                    this.vx = Math.cos(disperseAngle) * disperseSpeed;
                    this.vy = Math.sin(disperseAngle) * disperseSpeed;
                    this.wasGathered = false;
                } else {
                    // Smoothly blend back to ambient natural drift
                    this.vx = this.vx * 0.96 + this.baseVx * 0.04;
                    this.vy = this.vy * 0.96 + this.baseVy * 0.04;
                }
            }

            // Speed limiter to preserve silky fluid elegance
            const maxSpeed = inAttractionField ? 2.0 : 1.1;
            const speedSq = this.vx * this.vx + this.vy * this.vy;
            if (speedSq > maxSpeed * maxSpeed) {
                const spd = Math.sqrt(speedSq);
                this.vx = (this.vx / spd) * maxSpeed;
                this.vy = (this.vy / spd) * maxSpeed;
            }

            this.draw();
        }
    }

    function applySeparation(visibleParticles) {
        // Inter-particle soft repulsion: prevents clumps when clustered
        const minDistance = 36;
        const minDistanceSq = minDistance * minDistance;

        for (let i = 0; i < visibleParticles.length; i++) {
            const pA = visibleParticles[i];
            for (let j = i + 1; j < visibleParticles.length; j++) {
                const pB = visibleParticles[j];
                const dx = pB.screenX - pA.screenX;
                const dy = pB.screenY - pA.screenY;
                const distSq = dx * dx + dy * dy;

                if (distSq < minDistanceSq && distSq > 0.5) {
                    const dist = Math.sqrt(distSq);
                    let mouseDist = 999;
                    if (mouse.x !== null && mouse.y !== null) {
                        const mdx = mouse.x - pA.screenX;
                        const mdy = mouse.y - pA.screenY;
                        mouseDist = Math.sqrt(mdx * mdx + mdy * mdy);
                    }

                    if (mouseDist > 20) {
                        const overlap = (minDistance - dist) / minDistance;
                        const sepX = (dx / dist) * overlap * 0.38;
                        const sepY = (dy / dist) * overlap * 0.38;

                        pA.x -= sepX;
                        pA.y -= sepY;
                        pB.x += sepX;
                        pB.y += sepY;
                    }
                }
            }
        }
    }

    function getTargetParticleCount() {
        const isMobile = width < 768;
        const viewports = Math.max(1, docHeight / Math.max(height, 1));
        const densityPerViewport = isMobile ? 32 : 55;
        const maxParticles = isMobile ? 120 : 220;
        const minParticles = isMobile ? 28 : 50;
        return Math.max(minParticles, Math.min(maxParticles, Math.floor(viewports * densityPerViewport)));
    }

    function initParticles() {
        particles = [];
        docHeight = getDocHeight();
        const count = getTargetParticleCount();
        for (let i = 0; i < count; i++) {
            particles.push(new Particle(true, 0, docHeight));
        }
    }

    function handleDocHeightChange(newDocHeight) {
        const oldDocHeight = docHeight;
        docHeight = newDocHeight;
        const targetCount = getTargetParticleCount();

        if (newDocHeight > oldDocHeight && particles.length < targetCount) {
            // Document grew (e.g., dynamic services/products loaded): seed lower area
            const needed = targetCount - particles.length;
            for (let i = 0; i < needed; i++) {
                particles.push(new Particle(true, oldDocHeight, newDocHeight));
            }
        } else if (newDocHeight < oldDocHeight) {
            // Document shrank: clamp particles into current range
            particles.forEach(p => {
                if (p.y > newDocHeight) {
                    p.y = Math.random() * newDocHeight;
                }
            });
            if (particles.length > targetCount) {
                particles.length = targetCount;
            }
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
        const newDocHeight = getDocHeight();

        const widthDelta = Math.abs(newWidth - lastWidth);
        const heightDelta = Math.abs(newHeight - lastHeight);

        // Mobile scroll bar / address bar protection
        if (!forceRebuild && widthDelta < 5 && heightDelta < 160) {
            // Just update height without resetting particles
            height = newHeight;
            applyCanvasDimensions();
            return;
        }

        const oldWidth = width || 1;
        const oldDocHeight = docHeight || 1;

        width = newWidth;
        height = newHeight;
        docHeight = newDocHeight;
        lastWidth = newWidth;
        lastHeight = newHeight;

        applyCanvasDimensions();

        if (forceRebuild || particles.length === 0) {
            initParticles();
        } else {
            const scaleX = width / oldWidth;
            const scaleY = docHeight / oldDocHeight;

            particles.forEach(p => {
                p.x = Math.max(0, Math.min(width, p.x * scaleX));
                p.y = Math.max(0, Math.min(docHeight, p.y * scaleY));
            });

            const targetCount = getTargetParticleCount();
            while (particles.length < targetCount) {
                particles.push(new Particle(true, 0, docHeight));
            }
            if (particles.length > targetCount) {
                particles.length = targetCount;
            }
        }
    }

    function connectLines(visibleParticles) {
        const isMobile = width < 768;
        // SHORTER CONNECTION DISTANCE: clean, delicate, close-range constellation links
        const maxDist = isMobile ? 48 : 65;
        const maxDistSq = maxDist * maxDist;

        // Draw connections strictly between visible on-screen particles
        const len = visibleParticles.length;
        for (let a = 0; a < len; a++) {
            const pA = visibleParticles[a];
            for (let b = a + 1; b < len; b++) {
                const pB = visibleParticles[b];
                const dx = pA.screenX - pB.screenX;
                const dy = pA.screenY - pB.screenY;
                const distSq = dx * dx + dy * dy;

                if (distSq < maxDistSq) {
                    const dist = Math.sqrt(distSq);
                    // Elevated line visibility
                    const opacity = (1 - dist / maxDist) * 0.40;

                    let nearMouse = false;
                    if (mouse.x !== null && mouse.y !== null) {
                        const mdx = pA.screenX - mouse.x;
                        const mdy = pA.screenY - mouse.y;
                        const r = mouse.isTouch ? 70 : 90;
                        if ((mdx * mdx + mdy * mdy) < (r * r)) {
                            nearMouse = true;
                        }
                    }

                    ctx.lineWidth = nearMouse ? 1.2 : 0.8;
                    if (nearMouse) {
                        ctx.strokeStyle = `rgba(${options.lineHighlightColor}, ${Math.min(0.95, opacity * 3.2).toFixed(3)})`;
                    } else {
                        ctx.strokeStyle = `rgba(${options.lineBaseColor}, ${opacity.toFixed(3)})`;
                    }

                    ctx.beginPath();
                    ctx.moveTo(pA.screenX, pA.screenY);
                    ctx.lineTo(pB.screenX, pB.screenY);
                    ctx.stroke();
                }
            }
        }

        // Focal attraction lines: shorter, elegant radius around cursor/touch
        if (mouse.x !== null && mouse.y !== null) {
            const focusRadius = mouse.isTouch ? 68 : 85;
            const focusRadiusSq = focusRadius * focusRadius;

            // Focal center glow
            ctx.beginPath();
            ctx.arc(mouse.x, mouse.y, 5, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(147, 197, 253, 0.45)';
            ctx.fill();

            ctx.beginPath();
            ctx.arc(mouse.x, mouse.y, 14, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(59, 130, 246, 0.18)';
            ctx.fill();

            for (let i = 0; i < len; i++) {
                const p = visibleParticles[i];
                const mdx = mouse.x - p.screenX;
                const mdy = mouse.y - p.screenY;
                const mDistSq = mdx * mdx + mdy * mdy;

                if (mDistSq < focusRadiusSq) {
                    const mDist = Math.sqrt(mDistSq);
                    const beamOpacity = (1 - mDist / focusRadius) * 0.45;
                    ctx.lineWidth = 0.9;
                    ctx.strokeStyle = `rgba(${options.lineHighlightColor}, ${beamOpacity.toFixed(3)})`;
                    ctx.beginPath();
                    ctx.moveTo(p.screenX, p.screenY);
                    ctx.lineTo(mouse.x, mouse.y);
                    ctx.stroke();
                }
            }
        }
    }

    let isRunning = true;
    let frameCheckCounter = 0;

    function animate() {
        if (!isRunning) return;
        animationFrameId = requestAnimationFrame(animate);

        ctx.clearRect(0, 0, width, height);

        // Instant 1:1 scroll synchronization with the page
        const currentScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;

        // Periodic document height check to gracefully adapt to async content expansions
        frameCheckCounter++;
        if (frameCheckCounter % 60 === 0) {
            const freshDocHeight = getDocHeight();
            if (Math.abs(freshDocHeight - docHeight) > 60) {
                handleDocHeightChange(freshDocHeight);
            }
        }

        // Update all particles with exact 1:1 scroll offset
        const visibleParticles = [];
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            p.update(currentScrollY);
            if (p.isVisible) {
                visibleParticles.push(p);
            }
        }

        applySeparation(visibleParticles);
        connectLines(visibleParticles);
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

    let touchFadeTimer = null;
    const handleTouchStart = (e) => {
        if (e.touches && e.touches[0]) {
            if (touchFadeTimer) cancelAnimationFrame(touchFadeTimer);
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
        let frameCount = 0;
        const fade = () => {
            frameCount++;
            if (frameCount > 8) {
                mouse.x = null;
                mouse.y = null;
            } else {
                touchFadeTimer = requestAnimationFrame(fade);
            }
        };
        fade();
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

    // Body resize observer for dynamic height changes
    let resizeObserver = null;
    if (typeof ResizeObserver !== 'undefined' && document.body) {
        resizeObserver = new ResizeObserver(() => {
            const freshDocHeight = getDocHeight();
            if (Math.abs(freshDocHeight - docHeight) > 60) {
                handleDocHeightChange(freshDocHeight);
            }
        });
        resizeObserver.observe(document.body);
    }

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', () => resize(true), { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseout', handleMouseLeave);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    resize(true);
    animate();

    return {
        destroy: () => {
            isRunning = false;
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            if (touchFadeTimer) cancelAnimationFrame(touchFadeTimer);
            if (resizeObserver) resizeObserver.disconnect();
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
