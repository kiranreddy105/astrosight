import React, { useEffect, useRef } from 'react';

export const CosmicBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let stars: Array<{
      x: number;
      y: number;
      radius: number;
      alpha: number;
      speed: number;
      color: string;
    }> = [];

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      stars = [];
      const numStars = Math.floor((canvas.width * canvas.height) / 4500);
      for (let i = 0; i < numStars; i++) {
        const rand = Math.random();
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 1.3 + 0.3,
          alpha: Math.random() * 0.7 + 0.2,
          speed: Math.random() * 0.012 + 0.004,
          color: rand > 0.82 ? '#00f0ff' : (rand > 0.65 ? '#c084fc' : '#ffffff')
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const render = () => {
      ctx.fillStyle = '#050811';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Deep Cosmic Nebula Gradients
      const nebula1 = ctx.createRadialGradient(
        canvas.width * 0.22,
        canvas.height * 0.28,
        40,
        canvas.width * 0.22,
        canvas.height * 0.28,
        550
      );
      nebula1.addColorStop(0, 'rgba(0, 240, 255, 0.035)');
      nebula1.addColorStop(1, 'transparent');
      ctx.fillStyle = nebula1;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const nebula2 = ctx.createRadialGradient(
        canvas.width * 0.85,
        canvas.height * 0.72,
        50,
        canvas.width * 0.85,
        canvas.height * 0.72,
        650
      );
      nebula2.addColorStop(0, 'rgba(139, 92, 246, 0.03)');
      nebula2.addColorStop(1, 'transparent');
      ctx.fillStyle = nebula2;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Stars Rendering with subtle alpha oscillation
      const time = Date.now();
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        const oscAlpha = Math.max(0.1, Math.min(1, star.alpha + Math.sin(time * star.speed) * 0.2));
        ctx.save();
        ctx.globalAlpha = oscAlpha;
        ctx.fillStyle = star.color;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      aria-hidden="true"
    />
  );
};
