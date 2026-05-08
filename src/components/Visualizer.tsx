import { useEffect, useRef } from 'react';
import { useSequencerStore } from '../store/useSequencerStore';

interface Sprite {
  x: number;
  y: number;
  baseY: number;
  trackId: number;
  action: 'jump' | 'box' | 'dance' | 'headbang';
}

export function Visualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isPlaying, currentStep, tracks } = useSequencerStore();
  const bounceTimers = useRef<number[]>(Array(10).fill(0));
  
  const spritesRef = useRef<Sprite[]>([
    { x: 30, y: 100, baseY: 100, trackId: 0, action: 'jump' },
    { x: 90, y: 100, baseY: 100, trackId: 1, action: 'box' },
    { x: 150, y: 100, baseY: 100, trackId: 2, action: 'dance' },
    { x: 210, y: 100, baseY: 100, trackId: 3, action: 'headbang' },
    { x: 270, y: 100, baseY: 100, trackId: 4, action: 'jump' },
    { x: 330, y: 100, baseY: 100, trackId: 5, action: 'box' },
    { x: 390, y: 100, baseY: 100, trackId: 6, action: 'dance' },
    { x: 450, y: 100, baseY: 100, trackId: 7, action: 'headbang' },
    { x: 510, y: 100, baseY: 100, trackId: 8, action: 'jump' },
    { x: 570, y: 100, baseY: 100, trackId: 9, action: 'dance' },
  ]);

  // Handle trigger bouncing
  useEffect(() => {
    if (!isPlaying) return;
    
    tracks.forEach((track) => {
      if (track.steps[currentStep] && !track.muted) {
        bounceTimers.current[track.id] = 1.0; // Trigger full bounce
      }
    });
  }, [currentStep, isPlaying, tracks]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const render = () => {
      // Clear with pure black
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw CRT scanlines
      ctx.fillStyle = 'rgba(57, 255, 20, 0.05)';
      for (let i = 0; i < canvas.height; i += 4) {
        ctx.fillRect(0, i, canvas.width, 1);
      }
      
      spritesRef.current.forEach((sprite) => {
        const timer = bounceTimers.current[sprite.trackId];
        if (timer > 0) {
          bounceTimers.current[sprite.trackId] = Math.max(0, timer - 0.1);
        }

        ctx.save();
        
        // Neon Glow
        ctx.fillStyle = '#39ff14';
        ctx.shadowColor = '#39ff14';
        ctx.shadowBlur = timer > 0 ? 15 : 5; // Pulse glow on beat
        
        // Base coordinate (exaggerated jump)
        const currentY = sprite.action === 'jump' ? sprite.baseY - (Math.sin(timer * Math.PI) * 70) : sprite.baseY;
        ctx.translate(sprite.x, currentY);

        // Head (Blocky)
        if (sprite.action === 'headbang' && timer > 0) {
          ctx.fillRect(4, 10, 14, 14); // Head down far
        } else {
          ctx.fillRect(4, 0, 14, 14); // Normal head
        }

        // Thick Blocky Body
        ctx.fillRect(8, 14, 6, 26);

        // Blocky Actions
        if (sprite.action === 'box') {
          if (timer > 0.5) {
            ctx.fillRect(-6, 16, 14, 6); // Huge left punch
            ctx.fillRect(14, 22, 10, 6); // Right guard
          } else if (timer > 0) {
            ctx.fillRect(0, 22, 10, 6); // Left guard
            ctx.fillRect(14, 16, 20, 6); // Huge right punch
          } else {
            ctx.fillRect(0, 20, 8, 6); // Guarding
            ctx.fillRect(14, 20, 8, 6);
          }
        } 
        else if (sprite.action === 'dance') {
          if (timer > 0) {
            ctx.fillRect(-8, 0, 16, 6); // Arms up high
            ctx.fillRect(14, 30, 16, 6); // Arm down low
          } else {
            ctx.fillRect(0, 18, 8, 6); // Arms down
            ctx.fillRect(14, 18, 8, 6);
          }
        }
        else {
          if (timer > 0) {
            ctx.fillRect(0, 6, 8, 6); // Arms up
            ctx.fillRect(14, 6, 8, 6);
          } else {
            ctx.fillRect(2, 18, 6, 16); // Arms at side
            ctx.fillRect(14, 18, 6, 16);
          }
        }

        // Blocky Legs
        if (sprite.action === 'jump' && timer > 0) {
          ctx.fillRect(2, 34, 8, 6); // Legs tucked super high
          ctx.fillRect(12, 34, 8, 6);
        } else if (sprite.action === 'dance' && timer > 0) {
          ctx.fillRect(-6, 40, 6, 14); // Legs split wide
          ctx.fillRect(22, 40, 6, 14);
        } else {
          ctx.fillRect(4, 40, 6, 18); // Normal legs
          ctx.fillRect(12, 40, 6, 18);
        }

        ctx.restore();
      });

      // Turn off glow for shadow
      ctx.shadowBlur = 0;
      // Draw LCD Border shadow
      ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--color-lcd-pixel').trim() || '#00f3ff';
      ctx.lineWidth = 2;
      ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div className="w-full h-48 lcd-screen rounded border-4 border-[#39ff14] relative overflow-hidden shadow-[0_0_20px_#39ff14]">
      <canvas 
        ref={canvasRef} 
        width={600} 
        height={200} 
        className="w-full h-full object-cover"
      />
    </div>
  );
}
