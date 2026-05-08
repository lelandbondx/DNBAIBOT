import { useEffect, useRef } from 'react';
import { useSequencerStore } from '../store/useSequencerStore';

interface Sprite {
  x: number;
  y: number;
  baseY: number;
  trackId: number;
  action: 'jump' | 'box' | 'dance' | 'headbang' | 'spin' | 'uppercut' | 'breakdance';
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export function Visualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isPlaying, currentStep, tracks } = useSequencerStore();
  const bounceTimers = useRef<number[]>(Array(20).fill(0)); // Now 20 tracks
  const particlesRef = useRef<Particle[]>([]);
  
  const actions: Sprite['action'][] = ['jump', 'box', 'dance', 'headbang', 'spin', 'uppercut', 'breakdance'];
  
  const spritesRef = useRef<Sprite[]>(
    Array.from({ length: 20 }, (_, i) => ({
      x: 20 + i * 28,
      y: 100,
      baseY: 100,
      trackId: i,
      action: actions[i % actions.length]
    }))
  );

  // Handle trigger bouncing and particles
  useEffect(() => {
    if (!isPlaying) return;
    
    tracks.forEach((track) => {
      if (track.steps[currentStep] && !track.muted) {
        bounceTimers.current[track.id] = 1.0; // Trigger full bounce
        
        // Spawn particle explosion
        const sprite = spritesRef.current[track.id];
        const colors = ['#39ff14', '#ff00ff', '#00ffff', '#ffff00'];
        const color = colors[track.id % colors.length];
        
        for (let i = 0; i < 5; i++) {
          particlesRef.current.push({
            x: sprite.x + 10,
            y: sprite.baseY + 20,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 1) * 10,
            life: 1.0,
            color
          });
        }
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
    let time = 0;

    const render = () => {
      time += 0.05;
      
      // Clear with pure black
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw CRT scanlines & Background Pizazz
      ctx.fillStyle = 'rgba(57, 255, 20, 0.05)';
      for (let i = 0; i < canvas.height; i += 4) {
        ctx.fillRect(0, i, canvas.width, 1);
      }
      
      // Draw dynamic laser background
      ctx.strokeStyle = `hsla(${(time * 50) % 360}, 100%, 50%, 0.2)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for(let i=0; i<5; i++) {
        ctx.moveTo(canvas.width / 2, canvas.height);
        ctx.lineTo(canvas.width * (0.2 * i) + Math.sin(time + i) * 50, 0);
      }
      ctx.stroke();
      
      // Draw Particles
      particlesRef.current = particlesRef.current.filter(p => p.life > 0);
      particlesRef.current.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.5; // gravity
        p.life -= 0.05;
        
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.fillRect(p.x, p.y, 4, 4);
      });
      ctx.globalAlpha = 1.0; // Reset alpha
      
      // Draw Sprites
      spritesRef.current.forEach((sprite) => {
        const timer = bounceTimers.current[sprite.trackId];
        if (timer > 0) {
          bounceTimers.current[sprite.trackId] = Math.max(0, timer - 0.05);
        }

        ctx.save();
        
        // Neon Glow
        const isDrums = sprite.trackId < 10;
        ctx.fillStyle = isDrums ? '#39ff14' : '#ff00ff';
        ctx.shadowColor = isDrums ? '#39ff14' : '#ff00ff';
        ctx.shadowBlur = timer > 0 ? 15 : 5;
        
        const currentY = (sprite.action === 'jump' || sprite.action === 'uppercut') ? sprite.baseY - (Math.sin(timer * Math.PI) * 50) : sprite.baseY;
        
        ctx.translate(sprite.x, currentY);

        if (sprite.action === 'spin' && timer > 0) {
           ctx.translate(10, 20);
           ctx.rotate(timer * Math.PI * 4);
           ctx.translate(-10, -20);
        }
        
        if (sprite.action === 'breakdance' && timer > 0) {
           ctx.translate(10, 40);
           ctx.rotate(Math.PI); // upside down
           ctx.translate(-10, -40);
        }

        // Head
        if (sprite.action === 'headbang' && timer > 0) {
          ctx.fillRect(4, 15, 14, 14); // Head down far
        } else {
          ctx.fillRect(4, 0, 14, 14); // Normal head
        }

        // Thick Blocky Body
        ctx.fillRect(8, 14, 6, 26);

        // Arms (Actions)
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
        else if (sprite.action === 'uppercut') {
          if (timer > 0) {
            ctx.fillRect(-6, -10, 8, 26); // Huge vertical punch
            ctx.fillRect(14, 22, 8, 6); // Guard
          } else {
            ctx.fillRect(0, 20, 8, 6); 
            ctx.fillRect(14, 20, 8, 6);
          }
        }
        else if (sprite.action === 'dance') {
          if (timer > 0) {
            ctx.fillRect(-8, 0, 16, 6); // Arms up high
            ctx.fillRect(14, 30, 16, 6); // Arm down low
          } else {
            ctx.fillRect(0, 18, 8, 6);
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

        // Legs
        if ((sprite.action === 'jump' || sprite.action === 'uppercut') && timer > 0) {
          ctx.fillRect(2, 34, 8, 6); // Tucked high
          ctx.fillRect(12, 34, 8, 6);
        } else if (sprite.action === 'dance' && timer > 0) {
          ctx.fillRect(-6, 40, 6, 14); // Split wide
          ctx.fillRect(22, 40, 6, 14);
        } else if (sprite.action === 'breakdance' && timer > 0) {
          ctx.fillRect(-10, 20, 14, 6); // Helicopter legs
          ctx.fillRect(18, 20, 14, 6);
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
