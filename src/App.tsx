import { Visualizer } from './components/Visualizer';
import { Transport } from './components/Transport';
import { Grid } from './components/Grid';
import { useSequencerStore } from './store/useSequencerStore';

function App() {
  const { setFX } = useSequencerStore();

  const handleFX = (fx: 'STUTTER' | 'FILTER' | 'DROP') => {
    setFX(fx);
    if (navigator.vibrate) navigator.vibrate(20);
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-8 flex flex-col gap-6">
      {/* Physical Hardware Device Chassis */}
      <div className="hardware-chassis">
        {/* Hardware Screws (Aesthetic) */}
        <div className="absolute top-4 left-4 w-3 h-3 rounded-full bg-[#111] shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)] border border-[#333]"></div>
        <div className="absolute top-4 right-4 w-3 h-3 rounded-full bg-[#111] shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)] border border-[#333]"></div>
        <div className="absolute bottom-4 left-4 w-3 h-3 rounded-full bg-[#111] shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)] border border-[#333]"></div>
        <div className="absolute bottom-4 right-4 w-3 h-3 rounded-full bg-[#111] shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)] border border-[#333]"></div>
        
        {/* Header / Brand */}
        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-5xl font-bold tracking-widest text-[#dcdcdc] font-sans drop-shadow-md">
            PO-174
          </h1>
          <p className="text-[#888] font-pixel text-sm uppercase tracking-widest">Drum & Bass AI Engine</p>
        </div>

        <div className="flex flex-col gap-6 z-10 relative">
          <Visualizer />
          <Transport />
          <Grid />

          {/* Punch-In FX Buttons */}
          <div className="flex justify-between items-center bg-[#111] p-3 md:p-4 rounded-xl border-4 border-[#222] shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)] mt-2">
            <div className="font-sans font-bold text-[#666] uppercase text-xs md:text-sm tracking-widest">
              Live Punch-In FX
            </div>
            <div className="flex gap-2 md:gap-4">
              <button 
                onMouseDown={() => handleFX('STUTTER')}
                onMouseUp={() => setFX(null)}
                onMouseLeave={() => setFX(null)}
                onTouchStart={() => handleFX('STUTTER')}
                onTouchEnd={() => setFX(null)}
                className="w-12 h-12 md:w-16 md:h-16 po-button rounded-full flex flex-col"
              >
                <div className="text-[10px] md:text-xs">1</div>
                <div className="text-[8px] md:text-[10px] text-[#555]">STTTR</div>
              </button>
              <button 
                onMouseDown={() => handleFX('FILTER')}
                onMouseUp={() => setFX(null)}
                onMouseLeave={() => setFX(null)}
                onTouchStart={() => handleFX('FILTER')}
                onTouchEnd={() => setFX(null)}
                className="w-12 h-12 md:w-16 md:h-16 po-button rounded-full flex flex-col"
              >
                <div className="text-[10px] md:text-xs">2</div>
                <div className="text-[8px] md:text-[10px] text-[#555]">FLTER</div>
              </button>
              <button 
                onMouseDown={() => handleFX('DROP')}
                onMouseUp={() => setFX(null)}
                onMouseLeave={() => setFX(null)}
                onTouchStart={() => handleFX('DROP')}
                onTouchEnd={() => setFX(null)}
                className="w-12 h-12 md:w-16 md:h-16 po-button-red rounded-full flex flex-col items-center justify-center border-b-4 border-[#880000] active:border-b-[1px] active:translate-y-[3px]"
              >
                <div className="text-white text-[10px] md:text-xs font-bold">DROP</div>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default App;
