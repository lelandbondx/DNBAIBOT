import { useSequencerStore } from '../store/useSequencerStore';
import { useState } from 'react';

export function Grid() {
  const { tracks, currentStep, setStep, toggleMute, isPlaying } = useSequencerStore();
  
  // Drag to draw state
  const [isDragging, setIsDragging] = useState(false);
  const [dragAction, setDragAction] = useState(false); // true = draw, false = erase

  const triggerHaptic = () => {
    if (navigator.vibrate) navigator.vibrate(10);
  };

  return (
    <div 
      className="bg-[#dcdcdc] border-4 border-[#888] p-3 md:p-4 rounded-xl w-full shadow-inner select-none"
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
      onTouchEnd={() => setIsDragging(false)}
    >
      <div className="flex flex-col gap-3">
        {/* Step Numbers */}
        <div className="flex mb-1">
          <div className="w-16 md:w-24 shrink-0"></div>
          <div className="flex-1 flex gap-1 md:gap-2 px-1 md:px-2">
            {Array(16).fill(0).map((_, i) => (
              <div key={i} className={`flex-1 text-center font-bold text-[10px] md:text-xs text-[#666]`}>
                {(i % 4) + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Tracks */}
        {tracks.map((track) => (
          <div key={track.id} className="flex items-center group">
            {/* Track Label */}
            <div className="w-16 md:w-24 shrink-0 flex items-center justify-between pr-2 md:pr-4">
              <span className={`font-bold font-sans text-[9px] md:text-xs ${track.muted ? 'text-[#888]' : 'text-[#222]'}`}>
                {track.name}
              </span>
              <button 
                onClick={() => {
                  triggerHaptic();
                  toggleMute(track.id);
                }}
                className={`w-4 h-4 md:w-6 md:h-6 flex items-center justify-center text-[8px] md:text-[10px] rounded-full shadow transition-all ${
                  track.muted ? 'po-button-red' : 'po-button-dark'
                }`}
              >
                M
              </button>
            </div>

            {/* Step Buttons */}
            <div className="flex-1 flex gap-1 md:gap-2 px-1 md:px-2 py-1 bg-[#222] rounded shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)] border border-[#444]">
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
                      triggerHaptic();
                    }}
                    onMouseEnter={() => {
                      if (isDragging) {
                        setStep(track.id, stepIndex, dragAction);
                        triggerHaptic();
                      }
                    }}
                    onTouchMove={(e) => {
                      if (!isDragging) return;
                      const touch = e.touches[0];
                      const element = document.elementFromPoint(touch.clientX, touch.clientY);
                      if (element && element.tagName === 'BUTTON') {
                        const evt = new MouseEvent('mouseenter', { bubbles: true });
                        element.dispatchEvent(evt);
                      }
                    }}
                    className={`flex-1 aspect-square min-h-[16px] max-h-[30px] ${isActive ? 'po-button border-b-[1px] translate-y-[2px]' : 'po-button'} ${isBeat && !isActive ? 'opacity-80' : ''}`}
                  >
                    {/* Hardware LED inside the button */}
                    <div className={`led-indicator ${isActive ? 'led-active' : ''} ${isCurrentStep && !isActive ? 'led-play' : ''} ${isCurrentStep && isActive ? 'bg-[#fff] shadow-[0_0_10px_#fff]' : ''}`}></div>
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
