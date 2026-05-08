import { Play, Square, RefreshCw, Trash2, Plus, Minus, Share2, Wand2 } from 'lucide-react';
import { useSequencerStore } from '../store/useSequencerStore';
import type { KitType } from '../store/useSequencerStore';
import { engine } from '../audio/Engine';
import { useState } from 'react';

export function Transport() {
  const { isPlaying, togglePlay, bpm, setBpm, currentKit, setKit, clearPattern, generateEpicBeat, distortionEnabled, toggleDistortion, getShareUrl } = useSequencerStore();
  const [copied, setCopied] = useState(false);

  const handlePlayPause = () => {
    if (isPlaying) {
      engine.stop();
    } else {
      engine.start();
    }
    togglePlay();
  };

  const handleDistortionToggle = () => {
    toggleDistortion();
    engine.toggleDistortion(!distortionEnabled);
  };

  const handleStop = () => {
    engine.stop();
    if (isPlaying) togglePlay();
  };

  const cycleKit = () => {
    const kits: KitType[] = ['UK-DNB', 'LIQUID', 'NEURO', 'JUNGLE'];
    const currentIndex = kits.indexOf(currentKit);
    const nextIndex = (currentIndex + 1) % kits.length;
    setKit(kits[nextIndex]);
  };

  const handleShare = () => {
    const url = getShareUrl();
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-6 bg-[var(--color-hw-bg)] border-t-4 border-l-4 border-[var(--color-hw-btn)] border-b-4 border-r-4 border-black p-4 rounded w-full shadow-md">
      
      {/* Transport Buttons */}
      <div className="flex gap-4">
        <button 
          onClick={handlePlayPause}
          className={`btn-hw w-12 h-12 md:w-16 md:h-16 flex items-center justify-center rounded-lg ${isPlaying ? 'active' : ''}`}
        >
          <Play size={28} className={isPlaying ? 'animate-pulse text-[#39ff14] drop-shadow-[0_0_8px_#39ff14]' : 'text-[#005500]'} />
        </button>

        <button 
          onClick={handleStop}
          className="btn-hw w-12 h-12 md:w-16 md:h-16 flex items-center justify-center rounded-lg text-[#005500] hover:text-[#39ff14]"
        >
          <Square size={20} />
        </button>
      </div>

      {/* BPM Controls */}
      <div className="flex flex-col items-center bg-[var(--color-hw-dark)] p-2 border-2 border-[var(--color-hw-btn)] rounded shadow-[inset_0_0_8px_rgba(0,0,0,1)]">
        <span className="text-[var(--color-lcd-pixel-off)] font-pixel text-[10px] mb-2">BPM</span>
        <div className="flex items-center gap-2">
          <button 
          onClick={() => setBpm(bpm - 1)}
          className="btn-hw w-8 h-8 md:w-12 md:h-12 flex items-center justify-center rounded-lg text-[#005500] hover:text-[#39ff14]"
        >
          <Minus size={20} />
        </button>
        
        <div className="bg-black border-2 border-[#39ff14] px-4 py-2 rounded-lg min-w-[80px] flex justify-center shadow-[inset_0_0_10px_rgba(57,255,20,0.2),0_0_10px_rgba(57,255,20,0.2)]">
          <span className="font-pixel text-[12px] md:text-sm text-[#39ff14] drop-shadow-[0_0_5px_#39ff14]">{bpm} BPM</span>
        </div>

        <button 
          onClick={() => setBpm(bpm + 1)}
          className="btn-hw w-8 h-8 md:w-12 md:h-12 flex items-center justify-center rounded-lg text-[#005500] hover:text-[#39ff14]"
        >
          <Plus size={20} />
        </button>
        </div>
      </div>

      {/* Utilities */}
      <div className="flex flex-wrap gap-4">
        <button 
          onClick={handleDistortionToggle}
          className={`btn-hw px-3 h-12 md:h-16 rounded-lg font-pixel text-[8px] flex flex-col items-center justify-center gap-1 ${distortionEnabled ? 'active text-[#39ff14]' : 'text-[#005500] hover:text-[#39ff14]'}`}
        >
          <span className="text-sm">⚡</span>
          <span>FX: {distortionEnabled ? 'ON' : 'OFF'}</span>
        </button>

        <button 
          onClick={cycleKit}
          className="btn-hw px-3 h-12 md:h-16 rounded-lg font-pixel text-[8px] flex flex-col items-center justify-center gap-1 text-[#005500] hover:text-[#39ff14]"
        >
          <RefreshCw size={12} />
          <span>KIT: {currentKit}</span>
        </button>

        <button 
          onClick={handleShare}
          className={`btn-hw px-3 h-12 md:h-16 rounded-lg font-pixel text-[8px] flex flex-col items-center justify-center gap-1 ${copied ? 'text-green-500' : 'text-blue-500'}`}
          title="Share Pattern Link"
        >
          <Share2 size={16} />
          <span>{copied ? 'COPIED!' : 'SHARE'}</span>
        </button>

        {/* MAGIC GEN BUTTON */}
        <button 
          onClick={generateEpicBeat}
          className="btn-hw magic-btn px-4 h-12 md:h-16 rounded-lg font-pixel text-[10px] flex items-center justify-center gap-2 text-[#39ff14]"
          title="Quantize your beat to UK DNB & add styling!"
        >
          <Wand2 size={20} />
          <span className="hidden md:inline">UK DNB MAGIC</span>
        </button>

        <button 
          onClick={clearPattern}
          className="btn-hw w-12 h-12 md:h-16 md:w-16 flex items-center justify-center rounded-lg text-red-600 hover:text-red-400"
          title="Clear Pattern"
        >
          <Trash2 size={20} />
        </button>
      </div>
    </div>
  );
}
