'use client';

import { useEffect, useRef, useState } from 'react';

interface Particle {
  x: number;
  y: number;
  originX: number;
  originY: number;
  targetX: number;
  targetY: number;
  color: string;
  size: number;
  velocity: { x: number; y: number };
}

interface ImageParticleLoaderProps {
  imageFile: File;
  isAnalyzing: boolean;
  onComplete?: () => void;
}

export default function ImageParticleLoader({ 
  imageFile, 
  isAnalyzing,
  onComplete 
}: ImageParticleLoaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const [phase, setPhase] = useState<'explode' | 'form' | 'complete'>('explode');
  const particlesRef = useRef<Particle[]>([]);
  const progressRef = useRef(0);

  // Card skeleton dimensions (relative to canvas)
  const CARD_WIDTH = 280;
  const CARD_HEIGHT = 160;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    const imageUrl = URL.createObjectURL(imageFile);

    img.onload = () => {
      // Set canvas size
      canvas.width = 320;
      canvas.height = 240;

      // Draw image to extract pixels
      const imgSize = Math.min(img.width, img.height);
      const scale = 120 / imgSize;
      const drawWidth = img.width * scale;
      const drawHeight = img.height * scale;
      const offsetX = (canvas.width - drawWidth) / 2;
      const offsetY = 20;

      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

      // Extract pixels and create particles
      const imageData = ctx.getImageData(offsetX, offsetY, drawWidth, drawHeight);
      const particles: Particle[] = [];
      const sampleStep = 4; // Sample every 4th pixel for performance

      for (let y = 0; y < drawHeight; y += sampleStep) {
        for (let x = 0; x < drawWidth; x += sampleStep) {
          const i = (y * drawWidth + x) * 4;
          const r = imageData.data[i];
          const g = imageData.data[i + 1];
          const b = imageData.data[i + 2];
          const a = imageData.data[i + 3];

          if (a > 128) {
            const originX = offsetX + x;
            const originY = offsetY + y;

            // Calculate target position on card skeleton
            const cardX = (canvas.width - CARD_WIDTH) / 2;
            const cardY = (canvas.height - CARD_HEIGHT) / 2;
            
            // Map particle to card skeleton shape
            const normalizedX = x / drawWidth;
            const normalizedY = y / drawHeight;
            
            let targetX: number;
            let targetY: number;

            // Create card skeleton shape - edges and content areas
            if (normalizedY < 0.15) {
              // Top edge
              targetX = cardX + normalizedX * CARD_WIDTH;
              targetY = cardY + 8;
            } else if (normalizedY > 0.85) {
              // Bottom edge
              targetX = cardX + normalizedX * CARD_WIDTH;
              targetY = cardY + CARD_HEIGHT - 8;
            } else if (normalizedX < 0.1) {
              // Left edge
              targetX = cardX + 8;
              targetY = cardY + normalizedY * CARD_HEIGHT;
            } else if (normalizedX > 0.9) {
              // Right edge
              targetX = cardX + CARD_WIDTH - 8;
              targetY = cardY + normalizedY * CARD_HEIGHT;
            } else {
              // Interior - form skeleton lines
              const row = Math.floor(normalizedY * 4);
              targetX = cardX + 20 + (normalizedX * 0.7 * CARD_WIDTH);
              targetY = cardY + 30 + row * 30;
            }

            particles.push({
              x: originX,
              y: originY,
              originX,
              originY,
              targetX,
              targetY,
              color: `rgb(${r},${g},${b})`,
              size: 2,
              velocity: {
                x: (Math.random() - 0.5) * 8,
                y: (Math.random() - 0.5) * 8,
              },
            });
          }
        }
      }

      particlesRef.current = particles;
      progressRef.current = 0;
      setPhase('explode');

      // Start animation
      animate();
    };

    img.src = imageUrl;

    return () => {
      URL.revokeObjectURL(imageUrl);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [imageFile]);

  // Handle phase transitions based on isAnalyzing
  useEffect(() => {
    if (!isAnalyzing && phase === 'form') {
      setPhase('complete');
      onComplete?.();
    }
  }, [isAnalyzing, phase, onComplete]);

  const animate = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const particles = particlesRef.current;
    let progress = progressRef.current;

    if (phase === 'explode') {
      // Explosion phase - particles scatter
      progress += 0.02;
      
      particles.forEach((p) => {
        p.x += p.velocity.x * (1 - progress);
        p.y += p.velocity.y * (1 - progress);
        p.velocity.y += 0.1; // Gravity
        
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 1 - progress * 0.3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      if (progress >= 1) {
        progressRef.current = 0;
        setPhase('form');
      } else {
        progressRef.current = progress;
      }
    } else if (phase === 'form') {
      // Formation phase - particles move to card skeleton
      progress += 0.015;
      const eased = easeOutCubic(Math.min(progress, 1));

      particles.forEach((p) => {
        const currentX = p.x + (p.targetX - p.x) * 0.08;
        const currentY = p.y + (p.targetY - p.y) * 0.08;
        p.x = currentX;
        p.y = currentY;

        // Fade to gray as they form the skeleton
        const grayness = eased;
        ctx.fillStyle = grayness > 0.5 
          ? `rgb(200,200,200)` 
          : p.color;
        ctx.globalAlpha = 0.7 + eased * 0.3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 - eased * 0.3), 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw skeleton card outline when forming
      if (eased > 0.5) {
        const cardX = (canvas.width - CARD_WIDTH) / 2;
        const cardY = (canvas.height - CARD_HEIGHT) / 2;
        
        ctx.globalAlpha = (eased - 0.5) * 2;
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 2;
        drawRoundedRect(ctx, cardX, cardY, CARD_WIDTH, CARD_HEIGHT, 12);
        ctx.stroke();

        // Skeleton lines
        ctx.fillStyle = '#e5e7eb';
        ctx.fillRect(cardX + 16, cardY + 16, 60, 60); // Image placeholder
        ctx.fillRect(cardX + 90, cardY + 20, 120, 12); // Title
        ctx.fillRect(cardX + 90, cardY + 40, 160, 8); // Description line 1
        ctx.fillRect(cardX + 90, cardY + 54, 140, 8); // Description line 2
        ctx.fillRect(cardX + 16, cardY + CARD_HEIGHT - 30, 80, 10); // Type badge
      }

      progressRef.current = progress;
    } else if (phase === 'complete') {
      // Draw final skeleton
      const cardX = (canvas.width - CARD_WIDTH) / 2;
      const cardY = (canvas.height - CARD_HEIGHT) / 2;
      
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#f9fafb';
      drawRoundedRect(ctx, cardX, cardY, CARD_WIDTH, CARD_HEIGHT, 12);
      ctx.fill();
      
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Pulsing skeleton effect
      const pulse = Math.sin(Date.now() / 300) * 0.1 + 0.9;
      ctx.globalAlpha = pulse;
      ctx.fillStyle = '#e5e7eb';
      ctx.fillRect(cardX + 16, cardY + 16, 60, 60);
      ctx.fillRect(cardX + 90, cardY + 20, 120, 12);
      ctx.fillRect(cardX + 90, cardY + 40, 160, 8);
      ctx.fillRect(cardX + 90, cardY + 54, 140, 8);
      ctx.fillRect(cardX + 16, cardY + CARD_HEIGHT - 30, 80, 10);
    }

    ctx.globalAlpha = 1;
    animationRef.current = requestAnimationFrame(animate);
  };

  return (
    <div className="flex flex-col items-center">
      <canvas
        ref={canvasRef}
        className="rounded-lg"
        style={{ maxWidth: '100%', height: 'auto' }}
      />
      <p className="mt-3 text-sm text-gray-500">
        {phase === 'explode' && 'Scanning image...'}
        {phase === 'form' && 'Analyzing content...'}
        {phase === 'complete' && 'Searching the web...'}
      </p>
    </div>
  );
}

function easeOutCubic(x: number): number {
  return 1 - Math.pow(1 - x, 3);
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}
