import { Transport } from './components/Transport';
import { Grid } from './components/Grid';
import { Visualizer } from './components/Visualizer';
import { useState } from 'react';
import * as Tone from 'tone';
import { engine } from './audio/Engine';

function App() {
  const [poweredOn, setPoweredOn] = useState(false);

  const handlePowerOn = async (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    
    // Synchronously resume context before any awaits (Required for iOS Safari)
    if (Tone.context.state !== 'running') {
      Tone.context.resume();
    }

    await Tone.start();
    await engine.init();
    
    // Test Beep
    const synth = new Tone.Synth().toDestination();
    synth.triggerAttackRelease("C5", "8n", Tone.now());
    
    setPoweredOn(true);
  };

  if (!poweredOn) {
    return (
      <div className="min-h-screen bg-[var(--color-hw-dark)] flex flex-col items-center justify-center p-4 font-pixel text-center">
        <button 
          onClick={handlePowerOn}
          onTouchEnd={handlePowerOn}
          className="bg-black border-4 border-[var(--color-lcd-pixel)] text-[var(--color-lcd-pixel)] px-8 py-6 text-2xl hover:bg-[var(--color-lcd-pixel)] hover:text-black transition-all shadow-[0_0_20px_var(--color-lcd-pixel)] animate-pulse mb-8"
        >
          POWER ON
        </button>
        <p className="text-[var(--color-hw-text)] text-[10px] md:text-xs max-w-sm mt-8 opacity-75 leading-relaxed">
          ⚠️ iOS USERS (iPhone/iPad):<br/>
          Make sure your device's physical silent switch is turned OFF (and volume is up), otherwise Web Audio is forcibly muted!
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-hw-dark)] flex flex-col items-center p-4 md:p-8 font-sans">
      <div className="max-w-4xl w-full flex flex-col gap-6">
        
        {/* Header */}
        <header className="flex justify-between items-end mb-4 border-b-4 border-[var(--color-hw-btn)] pb-2">
          <div>
            <h1 className="text-2xl md:text-4xl font-pixel text-[var(--color-hw-text)] tracking-tighter drop-shadow-[0_0_8px_rgba(0,243,255,0.5)]">
              ROBO-TUNES
            </h1>
            <p className="font-pixel text-[10px] text-gray-500 mt-2">CYBER SEQUENCER</p>
          </div>
          <div className="font-pixel text-[10px] text-gray-500">
            MODEL: RT-X
          </div>
        </header>

        {/* Screen Area */}
        <div className="p-4 bg-[var(--color-hw-bg)] rounded border-t-4 border-l-4 border-black border-b-4 border-r-4 border-[var(--color-hw-btn)]">
          <Visualizer />
        </div>

        {/* Controls Area */}
        <Transport />
        <Grid />
        
        {/* Footer */}
        <div className="mt-8 flex justify-between text-gray-400 font-pixel text-[8px]">
          <p>BATTERY: OK</p>
          <p>MADE BY LEE</p>
        </div>

      </div>
    </div>
  );
}

export default App;
