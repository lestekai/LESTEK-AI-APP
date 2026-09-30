"use client";

import React, { useEffect, useRef } from 'react';
import { motion, type Variants } from 'framer-motion';
import { ArrowRight, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AetherFlowHeroProps {
    title?: React.ReactNode;
    subtitle?: string;
    badgeText?: string;
    buttonText?: string;
    buttonLink?: string;
    onButtonClick?: () => void;
    className?: string;
    particleColor?: string;
    lineColor?: string;
    lineHighlightColor?: string;
    backgroundColor?: string;
    backgroundOnly?: boolean;
    interactive?: boolean;
}

// Particle class with physics and mouse repulsion
class Particle {
    x: number;
    y: number;
    directionX: number;
    directionY: number;
    size: number;
    color: string;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;

    constructor(
        x: number,
        y: number,
        directionX: number,
        directionY: number,
        size: number,
        color: string,
        canvas: HTMLCanvasElement,
        ctx: CanvasRenderingContext2D
    ) {
        this.x = x;
        this.y = y;
        this.directionX = directionX;
        this.directionY = directionY;
        this.size = size;
        this.color = color;
        this.canvas = canvas;
        this.ctx = ctx;
    }

    draw() {
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
        this.ctx.fillStyle = this.color;
        this.ctx.fill();
    }

    update(mouse: { x: number | null; y: number | null; radius: number }) {
        if (this.x > this.canvas.width || this.x < 0) {
            this.directionX = -this.directionX;
        }
        if (this.y > this.canvas.height || this.y < 0) {
            this.directionY = -this.directionY;
        }

        // Mouse collision / repulsion detection
        if (mouse.x !== null && mouse.y !== null) {
            const dx = mouse.x - this.x;
            const dy = mouse.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < mouse.radius + this.size) {
                const forceDirectionX = dx / distance;
                const forceDirectionY = dy / distance;
                const force = (mouse.radius - distance) / mouse.radius;
                this.x -= forceDirectionX * force * 5;
                this.y -= forceDirectionY * force * 5;
            }
        }

        this.x += this.directionX;
        this.y += this.directionY;
        this.draw();
    }
}

// The main hero component styled for the app's electric blue and dark aesthetic
export const AetherFlowHero: React.FC<AetherFlowHeroProps> = ({
    title = (
        <>
            POTENCIALIZANDO <br /> O <span className="text-blue-500">SEU</span> FUTURO.
        </>
    ),
    subtitle = "Especialista em hardware de alta performance, focado em deixar o seu computador como novo e extremamente rápido.",
    badgeText = "Hardware & Performance Specialists",
    buttonText = "Falar Comigo Agora",
    buttonLink,
    onButtonClick,
    className,
    particleColor = "rgba(59, 130, 246, 0.85)", // Electric Blue (LESTEK brand)
    lineColor = "rgba(59, 130, 246, 0.3)", // Cyan-Blue connection
    lineHighlightColor = "rgba(224, 242, 254, 0.85)", // Bright Cyan-White highlight
    backgroundColor = "#050505",
    backgroundOnly = false,
    interactive = true
}) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let particles: Particle[] = [];
        const mouse: { x: number | null; y: number | null; radius: number } = {
            x: null,
            y: null,
            radius: 180
        };

        function init() {
            if (!canvas || !ctx) return;
            particles = [];
            // Dynamically balance particle count for buttery-smooth 60+ FPS
            const density = Math.min(window.innerWidth * window.innerHeight, 1920 * 1080);
            const numberOfParticles = Math.floor(density / 9000);

            for (let i = 0; i < numberOfParticles; i++) {
                const size = Math.random() * 2 + 1;
                const x = Math.random() * (canvas.width - size * 4) + size * 2;
                const y = Math.random() * (canvas.height - size * 4) + size * 2;
                const directionX = Math.random() * 0.4 - 0.2;
                const directionY = Math.random() * 0.4 - 0.2;
                particles.push(
                    new Particle(x, y, directionX, directionY, size, particleColor, canvas, ctx)
                );
            }
        }

        const resizeCanvas = () => {
            if (!canvas) return;
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            init();
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        const connect = () => {
            if (!canvas || !ctx) return;
            const maxDistance = ((canvas.width / 7) * (canvas.height / 7));

            for (let a = 0; a < particles.length; a++) {
                for (let b = a + 1; b < particles.length; b++) {
                    const dx = particles[a].x - particles[b].x;
                    const dy = particles[a].y - particles[b].y;
                    const distance = dx * dx + dy * dy;

                    if (distance < maxDistance && distance < 20000) {
                        const opacityValue = 1 - distance / 20000;

                        let isNearMouse = false;
                        if (mouse.x !== null && mouse.y !== null) {
                            const dxMouseA = particles[a].x - mouse.x;
                            const dyMouseA = particles[a].y - mouse.y;
                            const distMouseA = Math.sqrt(dxMouseA * dxMouseA + dyMouseA * dyMouseA);
                            if (distMouseA < mouse.radius) {
                                isNearMouse = true;
                            }
                        }

                        if (isNearMouse) {
                            ctx.strokeStyle = lineHighlightColor;
                        } else {
                            ctx.strokeStyle = lineColor.replace('0.3', `${(opacityValue * 0.35).toFixed(2)}`);
                        }

                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(particles[a].x, particles[a].y);
                        ctx.lineTo(particles[b].x, particles[b].y);
                        ctx.stroke();
                    }
                }
            }
        };

        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            if (!canvas || !ctx) return;

            if (backgroundColor === 'transparent') {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            } else {
                ctx.fillStyle = backgroundColor;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            for (let i = 0; i < particles.length; i++) {
                particles[i].update(mouse);
            }
            connect();
        };

        const handleMouseMove = (event: MouseEvent) => {
            if (!interactive) return;
            mouse.x = event.clientX;
            mouse.y = event.clientY;
        };

        const handleMouseOut = () => {
            mouse.x = null;
            mouse.y = null;
        };

        const handleTouchMove = (event: TouchEvent) => {
            if (!interactive || !event.touches[0]) return;
            mouse.x = event.touches[0].clientX;
            mouse.y = event.touches[0].clientY;
        };

        const handleTouchEnd = () => {
            mouse.x = null;
            mouse.y = null;
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseout', handleMouseOut);
        window.addEventListener('touchmove', handleTouchMove, { passive: true });
        window.addEventListener('touchend', handleTouchEnd);

        init();
        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseout', handleMouseOut);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
            cancelAnimationFrame(animationFrameId);
        };
    }, [particleColor, lineColor, lineHighlightColor, backgroundColor, interactive]);

    const fadeUpVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        visible: (i: number) => ({
            opacity: 1,
            y: 0,
            transition: {
                delay: i * 0.2 + 0.5,
                duration: 0.8,
                ease: "easeInOut",
            },
        }),
    };

    if (backgroundOnly) {
        return (
            <canvas
                ref={canvasRef}
                className={cn("fixed inset-0 w-full h-full pointer-events-none -z-10", className)}
                aria-hidden="true"
            />
        );
    }

    return (
        <div className={cn("relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-[#050505]", className)}>
            {/* Ambient canvas */}
            <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none" />

            {/* Overlay Gradient for depth */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(59,130,246,0.18),transparent_60%)] pointer-events-none" />

            {/* Overlay HTML Content */}
            <div className="relative z-10 text-center px-6 max-w-5xl mx-auto pt-20 pb-16">
                {badgeText && (
                    <motion.div
                        custom={0}
                        variants={fadeUpVariants}
                        initial="hidden"
                        animate="visible"
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6 md:mb-8 backdrop-blur-md"
                    >
                        <Zap className="h-4 w-4 text-blue-400 animate-pulse" />
                        <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-blue-400">
                            {badgeText}
                        </span>
                    </motion.div>
                )}

                <motion.h1
                    custom={1}
                    variants={fadeUpVariants}
                    initial="hidden"
                    animate="visible"
                    className="text-4xl sm:text-6xl md:text-8xl font-black tracking-tighter mb-6 md:mb-8 uppercase glow-text text-white leading-[1.05]"
                >
                    {title}
                </motion.h1>

                <motion.p
                    custom={2}
                    variants={fadeUpVariants}
                    initial="hidden"
                    animate="visible"
                    className="max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-zinc-400 mb-10 md:mb-12 font-medium leading-relaxed"
                >
                    {subtitle}
                </motion.p>

                <motion.div
                    custom={3}
                    variants={fadeUpVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex flex-col sm:flex-row items-center justify-center gap-4"
                >
                    {buttonLink ? (
                        <a
                            href={buttonLink}
                            onClick={onButtonClick}
                            className="btn-tech flex items-center justify-center gap-3 px-8 py-4 sm:px-10 sm:py-5 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest rounded-2xl transition-all hover:scale-105 shadow-lg shadow-blue-500/25 text-sm sm:text-base"
                        >
                            <span>{buttonText}</span>
                            <ArrowRight className="h-5 w-5" />
                        </a>
                    ) : (
                        <button
                            type="button"
                            onClick={onButtonClick}
                            className="btn-tech flex items-center justify-center gap-3 px-8 py-4 sm:px-10 sm:py-5 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest rounded-2xl transition-all hover:scale-105 shadow-lg shadow-blue-500/25 text-sm sm:text-base cursor-pointer"
                        >
                            <span>{buttonText}</span>
                            <ArrowRight className="h-5 w-5" />
                        </button>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default AetherFlowHero;
