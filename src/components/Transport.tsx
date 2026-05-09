import { useSequencerStore, KitType } from '../store/useSequencerStore';
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
    <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#dcdcdc] border-4 border-[#888] shadow-inner p-4 rounded-xl">
      
      <div className="flex items-center gap-4 w-full md:w-auto">
        <button
          onClick={() => {
            triggerHaptic();
            handlePlay();
          }}
          className={`flex-1 md:flex-none w-16 h-16 rounded-full flex items-center justify-center font-bold text-[10px] md:text-xs ${
            isPlaying ? 'po-button-red' : 'po-button-dark'
          }`}
        >
          {isPlaying ? 'STOP' : 'PLAY'}
        </button>

        <div className="flex flex-col gap-1 items-center bg-[#b0b0b0] p-2 rounded-lg border-2 border-[#888] shadow-inner">
          <label className="text-[10px] font-bold text-[#555] uppercase">Tempo</label>
          <input
            type="range"
            min="120"
            max="220"
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            className="w-24 md:w-32 accent-[#333]"
          />
          <div className="font-pixel text-[#111] text-lg bg-[#8b9bb4] px-2 rounded border border-[#555] shadow-inner min-w-[60px] text-center">
            {bpm}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto justify-between md:justify-end">
        <select 
          value={currentKit}
          onChange={handleKitChange}
          className="bg-[#222] text-[#eee] font-bold text-xs uppercase px-3 py-2 rounded-lg border-2 border-[#111] outline-none cursor-pointer flex-1 md:flex-none shadow-md"
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
            className="w-12 h-12 rounded-full po-button-dark flex flex-col items-center justify-center text-[9px]"
            title="Clear Pattern"
          >
            CLR
          </button>
          
          <button
            onClick={() => {
              triggerHaptic();
              handleShare();
            }}
            className="w-12 h-12 rounded-full po-button-dark flex flex-col items-center justify-center text-[9px]"
            title="Share Beat URL"
          >
            {copied ? 'DONE' : 'SHR'}
          </button>

          <button
            onClick={() => {
              triggerHaptic();
              generateEpicBeat();
            }}
            className="w-12 h-12 rounded-full po-button flex flex-col items-center justify-center text-[9px]"
            title="Generate DNB Magic"
          >
            MAGIC
          </button>
        </div>
      </div>
    </div>
  );
}
