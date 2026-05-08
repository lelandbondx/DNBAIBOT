import { useSequencerStore } from '../store/useSequencerStore';

export function Grid() {
  const { tracks, currentStep, toggleStep, toggleMute, isPlaying } = useSequencerStore();

  return (
    <div className="bg-[var(--color-hw-bg)] border-t-4 border-l-4 border-[var(--color-hw-btn)] border-b-4 border-r-4 border-black p-3 md:p-4 rounded w-full overflow-x-auto shadow-md">
      <div className="min-w-[700px] flex flex-col gap-2">
        {/* Step Numbers (LCD Style) */}
        <div className="flex mb-2">
          <div className="w-28 shrink-0"></div>
          <div className="flex-1 flex gap-3 px-2">
            {Array(16).fill(0).map((_, i) => (
              <div key={i} className="flex-1 text-center font-pixel text-[10px] text-gray-500">
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
              <span className={`font-pixel text-[10px] md:text-[12px] ${track.muted ? 'text-[#005500]' : 'text-[#39ff14] drop-shadow-[0_0_5px_#39ff14]'}`}>
                {track.name}
              </span>
              <button 
                onClick={() => toggleMute(track.id)}
                className={`btn-hw w-6 h-6 md:w-8 md:h-8 flex items-center justify-center font-pixel text-[8px] rounded-full ${
                  track.muted ? 'active' : ''
                }`}
              >
                M
              </button>
            </div>

            {/* Step Buttons */}
            <div className="flex-1 flex gap-2 px-2 py-1 bg-black rounded shadow-[inset_0_0_10px_rgba(57,255,20,0.1)] border border-[#003300]">
              {track.steps.map((isActive, stepIndex) => {
                const isCurrentStep = isPlaying && currentStep === stepIndex;
                const isBeat = stepIndex % 4 === 0;
                
                return (
                  <button
                    key={stepIndex}
                    onClick={() => toggleStep(track.id, stepIndex)}
                    className={`flex-1 aspect-square min-h-[28px] max-h-[40px] rounded-full btn-hw relative ${
                      isActive ? 'active-green' : ''
                    } ${isCurrentStep ? 'border-[#39ff14] bg-[#0a2a0a]' : ''} ${isBeat && !isActive ? 'opacity-75' : ''}`}
                  >
                    {/* Tiny LED indicator inside button */}
                    <div className={`absolute top-1 left-1 md:top-2 md:left-2 w-2 h-2 rounded-full ${isActive ? 'bg-[#39ff14] shadow-[0_0_6px_#39ff14]' : 'bg-[#111]'}`}></div>
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
