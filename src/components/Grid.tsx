import { useSequencerStore } from '../store/useSequencerStore';
import { useState } from 'react';

export function Grid() {
  const { tracks, currentStep, setStep, toggleMute, isPlaying } = useSequencerStore();
  
  // Drag to draw state
  const [isDragging, setIsDragging] = useState(false);
  const [dragAction, setDragAction] = useState(false); // true = draw, false = erase

  return (
    <div 
      className="bg-[var(--color-hw-bg)] border-t-4 border-l-4 border-[var(--color-hw-btn)] border-b-4 border-r-4 border-black p-3 md:p-4 rounded w-full overflow-x-auto shadow-md"
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
      onTouchEnd={() => setIsDragging(false)}
    >
      <div className="min-w-[1200px] flex flex-col gap-2 select-none">
        {/* Step Numbers (LCD Style) */}
        <div className="flex mb-2">
          <div className="w-24 shrink-0"></div>
          <div className="flex-1 flex gap-2 px-2">
            {Array(32).fill(0).map((_, i) => (
              <div key={i} className="flex-1 text-center font-pixel text-[8px] text-gray-500">
                {(i % 4 === 0) ? (i / 4) + 1 : '·'}
              </div>
            ))}
          </div>
        </div>

        {/* Tracks */}
        {tracks.map((track) => (
          <div key={track.id} className="flex items-center group">
            {/* Track Label */}
            <div className="w-24 shrink-0 flex items-center justify-between pr-2">
              <span className={`font-pixel text-[9px] md:text-[10px] ${track.muted ? 'text-[#005500]' : 'text-[#39ff14] drop-shadow-[0_0_5px_#39ff14]'}`}>
                {track.name}
              </span>
              <button 
                onClick={() => toggleMute(track.id)}
                className={`btn-hw w-5 h-5 md:w-6 md:h-6 flex items-center justify-center font-pixel text-[8px] rounded-full ${
                  track.muted ? 'active' : ''
                }`}
              >
                M
              </button>
            </div>

            {/* Step Buttons */}
            <div className="flex-1 flex gap-1 md:gap-2 px-2 py-1 bg-black rounded shadow-[inset_0_0_10px_rgba(57,255,20,0.1)] border border-[#003300]">
              {track.steps.map((isActive, stepIndex) => {
                const isCurrentStep = isPlaying && currentStep === stepIndex;
                const isBeat = stepIndex % 4 === 0;
                
                return (
                  <button
                    key={stepIndex}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                      setDragAction(!isActive);
                      setStep(track.id, stepIndex, !isActive);
                    }}
                    onMouseEnter={() => {
                      if (isDragging) {
                        setStep(track.id, stepIndex, dragAction);
                      }
                    }}
                    // Touch support for basic dragging on mobile
                    onTouchMove={(e) => {
                      if (!isDragging) return;
                      const touch = e.touches[0];
                      const element = document.elementFromPoint(touch.clientX, touch.clientY);
                      if (element && element.tagName === 'BUTTON') {
                        const evt = new MouseEvent('mouseenter', { bubbles: true });
                        element.dispatchEvent(evt);
                      }
                    }}
                    className={`flex-1 aspect-square min-h-[20px] max-h-[30px] rounded-sm md:rounded-full btn-hw relative transition-none ${
                      isActive ? 'active-green' : ''
                    } ${isCurrentStep && isActive ? 'beat-hit' : ''} ${isCurrentStep && !isActive ? 'border-[#39ff14] bg-[#0a2a0a]' : ''} ${isBeat && !isActive ? 'opacity-75 bg-[#050505]' : ''}`}
                  >
                    {/* Tiny LED indicator inside button */}
                    <div className={`absolute top-0.5 left-0.5 md:top-1 md:left-1 w-1 h-1 md:w-1.5 md:h-1.5 rounded-full ${isActive ? 'bg-[#39ff14] shadow-[0_0_6px_#39ff14]' : 'bg-[#111]'}`}></div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
