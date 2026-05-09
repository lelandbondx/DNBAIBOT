import { useSequencerStore, type KitType } from '../store/useSequencerStore';
import { engine } from '../audio/Engine';
import * as Tone from 'tone';
import { useState } from 'react';

export function Transport() {
  const { bpm, isPlaying, setBpm, togglePlay, currentKit, setKit, clearPattern, generateEpicBeat, getShareUrl } = useSequencerStore();
  const [copied, setCopied] = useState(false);

  const handlePlay = async () => {
    if (!isPlaying) {
      await Tone.start();
      await engine.init();
      engine.start();
    } else {
      engine.stop();
    }
    togglePlay();
  };

  const handleShare = async () => {
    const url = getShareUrl();
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const triggerHaptic = () => {
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const handleKitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    triggerHaptic();
    setKit(e.target.value as KitType);
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#050505] border-4 border-[#39ff14] shadow-[0_0_20px_rgba(57,255,20,0.1)] p-4 rounded-xl">
      
      <div className="flex items-center gap-4 w-full md:w-auto">
        <button
          onClick={() => {
            triggerHaptic();
            handlePlay();
          }}
          className={`flex-1 md:flex-none w-16 h-16 flex items-center justify-center font-bold text-[10px] md:text-xs ${
            isPlaying ? 'po-button-red' : 'po-button'
          }`}
          style={{ borderRadius: '12px' }}
        >
          {isPlaying ? 'STOP' : 'PLAY'}
        </button>

        <div className="flex flex-col gap-1 items-center bg-[#111] p-2 rounded-lg border-2 border-[#222] shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)]">
          <label className="text-[10px] font-bold text-[#888] uppercase">Tempo</label>
          <input
            type="range"
            min="120"
            max="220"
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            className="w-24 md:w-32 accent-[#39ff14]"
          />
          <div className="font-pixel text-[#39ff14] text-lg bg-[#000] px-2 rounded border border-[#39ff14] min-w-[60px] text-center shadow-[inset_0_0_10px_rgba(57,255,20,0.2)]">
            {bpm}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto justify-between md:justify-end">
        <select 
          value={currentKit}
          onChange={handleKitChange}
          className="bg-[#000] text-[#39ff14] font-bold text-xs uppercase px-3 py-2 rounded-lg border-2 border-[#39ff14] outline-none cursor-pointer flex-1 md:flex-none shadow-[0_0_10px_rgba(57,255,20,0.2)]"
        >
          <option value="UK-DNB">UK-DNB</option>
          <option value="LIQUID">LIQUID</option>
          <option value="NEURO">NEURO</option>
          <option value="JUNGLE">JUNGLE</option>
        </select>

        <div className="flex gap-2">
          <button
            onClick={() => {
              triggerHaptic();
              clearPattern();
            }}
            className="w-12 h-12 po-button-dark flex flex-col items-center justify-center text-[9px]"
            title="Clear Pattern"
            style={{ borderRadius: '8px' }}
          >
            CLR
          </button>
          
          <button
            onClick={() => {
              triggerHaptic();
              handleShare();
            }}
            className="w-12 h-12 po-button-dark flex flex-col items-center justify-center text-[9px]"
            title="Share Beat URL"
            style={{ borderRadius: '8px' }}
          >
            {copied ? 'DONE' : 'SHR'}
          </button>

          <button
            onClick={() => {
              triggerHaptic();
              generateEpicBeat();
            }}
            className="w-12 h-12 po-button flex flex-col items-center justify-center text-[9px]"
            title="Generate DNB Magic"
            style={{ borderRadius: '8px' }}
          >
            MAGIC
          </button>
        </div>
      </div>
    </div>
  );
}
