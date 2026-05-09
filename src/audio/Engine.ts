import * as Tone from 'tone';
import { useSequencerStore } from '../store/useSequencerStore';

class AudioEngine {
  initialized = false;
  synths: any[] = [];
  
  // Master FX Bus
  masterCompressor!: Tone.Compressor;
  masterLimiter!: Tone.Limiter;
  
  // Punch-In FX
  fxFilter!: Tone.Filter;
  fxTremolo!: Tone.Tremolo;
  fxAutoFilter!: Tone.AutoFilter;
  
  // Riser Synth
  riserSynth!: Tone.NoiseSynth;

  async init() {
    if (this.initialized) return;

    // Setup Master Bus
    this.masterCompressor = new Tone.Compressor({
      threshold: -20,
      ratio: 4,
      attack: 0.01,
      release: 0.1,
    });
    this.masterLimiter = new Tone.Limiter(-1).toDestination();
    
    // Setup Punch-In FX
    this.fxFilter = new Tone.Filter({ frequency: 20000, type: 'lowpass', Q: 2 });
    this.fxTremolo = new Tone.Tremolo({ frequency: '16n', depth: 1, type: 'square' }).start();
    this.fxAutoFilter = new Tone.AutoFilter({ frequency: '8n', baseFrequency: 200, octaves: 4, type: 'sine' }).start();

    // Riser for the "DROP"
    this.riserSynth = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 2, decay: 0, sustain: 1, release: 0.1 }
    });

    // Routing
    this.fxAutoFilter.connect(this.fxTremolo);
    this.fxTremolo.connect(this.fxFilter);
    this.fxFilter.connect(this.masterCompressor);
    this.masterCompressor.connect(this.masterLimiter);
    this.riserSynth.connect(this.masterLimiter);

    // Track 0: KICK
    const kickSynth = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 5,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.4 }
    });

    // Track 1: SNARE
    const snareSynth = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.2 }
    });

    // Track 2: HAT
    const hatSynth = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.05, release: 0.05 },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 8000,
      octaves: 1.5
    });

    // Track 3: BASS
    const growlBass = new Tone.Synth({
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.01, decay: 0.3, sustain: 0.8, release: 0.2 }
    });
    const bassDist = new Tone.Distortion(0.8);
    const bassFilter = new Tone.Filter(1500, 'lowpass');
    growlBass.connect(bassDist);
    bassDist.connect(bassFilter);

    // Track 4: SUB
    const subBass = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.05, decay: 0.3, sustain: 1, release: 0.5 }
    });

    // Track 5: LEAD
    const leadSynth = new Tone.FMSynth({
      harmonicity: 1.5,
      modulationIndex: 5,
      oscillator: { type: 'square' },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.5 },
      modulation: { type: 'sawtooth' }
    });
    const leadDelay = new Tone.FeedbackDelay('8n.', 0.4);
    leadSynth.connect(leadDelay);

    // Track 6: RIDE
    const rideSynth = new Tone.MetalSynth({
      envelope: { attack: 0.01, decay: 0.8, release: 1 },
      harmonicity: 4.1,
      modulationIndex: 16,
      resonance: 5000,
      octaves: 1.5
    });

    // Track 7: PAD
    const padSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.5, decay: 1, sustain: 0.8, release: 2 }
    });
    const padReverb = new Tone.Reverb({ decay: 4, wet: 0.6 });
    padSynth.connect(padReverb);

    // Track 8: GHOST
    const ghostSynth = new Tone.MembraneSynth({
      pitchDecay: 0.02,
      octaves: 2,
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 }
    });

    // Track 9: CRASH
    const crashSynth = new Tone.MetalSynth({
      envelope: { attack: 0.01, decay: 1.5, release: 2 },
      harmonicity: 5.1,
      modulationIndex: 64,
      resonance: 4000,
      octaves: 2
    });
    crashSynth.connect(padReverb);

    // Melodic Tracks (10-14)
    const createMelodicSynth = () => {
      const synth = new Tone.FMSynth({
        harmonicity: 2,
        modulationIndex: 2,
        oscillator: { type: 'sine' },
        envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.2 },
        modulation: { type: 'square' },
        modulationEnvelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.1 }
      });
      const echo = new Tone.PingPongDelay('8n.', 0.3);
      synth.connect(echo);
      echo.connect(this.fxAutoFilter);
      return synth;
    };

    const synC = createMelodicSynth();
    const synEb = createMelodicSynth();
    const synF = createMelodicSynth();
    const synG = createMelodicSynth();
    const synBb = createMelodicSynth();

    // Track 15: REESE BASS
    const reeseSynth = new Tone.Synth({
      oscillator: { type: 'fatsawtooth', spread: 40, count: 3 } as any,
      envelope: { attack: 0.1, decay: 0.3, sustain: 0.8, release: 0.8 }
    });
    const reeseFilter = new Tone.Filter(800, 'lowpass');
    reeseSynth.connect(reeseFilter);
    reeseFilter.connect(this.fxAutoFilter);

    // Track 16: WOBBLE BASS
    const wobbleSynth = new Tone.Synth({
      oscillator: { type: 'square' },
      envelope: { attack: 0.05, decay: 0.3, sustain: 0.6, release: 0.4 }
    });
    const wobbleFilter = new Tone.AutoFilter("8n").start();
    wobbleFilter.baseFrequency = 100;
    wobbleFilter.octaves = 4;
    wobbleSynth.connect(wobbleFilter);
    wobbleFilter.connect(this.fxAutoFilter);

    // Track 17: RAVE STAB
    const stabSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.2 }
    });
    stabSynth.connect(this.fxAutoFilter);

    // Track 18: 808 GLIDE
    const eightOhEight = new Tone.MembraneSynth({
      pitchDecay: 0.08,
      octaves: 4,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 1.5, sustain: 0, release: 1.5 }
    });
    eightOhEight.connect(this.fxAutoFilter);

    // Track 19: JUNGLE TOM
    const jungleTom = new Tone.MembraneSynth({
      pitchDecay: 0.01,
      octaves: 2,
      oscillator: { type: 'square' },
      envelope: { attack: 0.01, decay: 0.4, sustain: 0, release: 0.4 }
    });
    jungleTom.connect(this.fxAutoFilter);

    // Track 20: AMEN SNARE
    const amenSnare = new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 }
    });
    const amenFilter = new Tone.Filter(3000, 'highpass');
    amenSnare.connect(amenFilter);
    amenFilter.connect(this.fxAutoFilter);

    // Track 21: DONK
    const donkSynth = new Tone.FMSynth({
      harmonicity: 0.5,
      modulationIndex: 10,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.2 },
      modulation: { type: 'square' },
      modulationEnvelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 }
    });
    donkSynth.connect(this.fxAutoFilter);

    // Track 22: SHAKER
    const shakerSynth = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.1, release: 0.01 },
      harmonicity: 8.1,
      modulationIndex: 40,
      resonance: 6000,
      octaves: 1.5
    });
    shakerSynth.connect(this.fxAutoFilter);

    this.synths = [
      kickSynth, snareSynth, hatSynth, growlBass, subBass,
      leadSynth, rideSynth, padSynth, ghostSynth, crashSynth,
      synC, synEb, synF, synG, synBb,
      reeseSynth, wobbleSynth, stabSynth, eightOhEight, jungleTom,
      amenSnare, donkSynth, shakerSynth
    ];

    // Connect core tracks to the Punch-In FX bus
    for(let i = 0; i <= 9; i++) {
      if (this.synths[i] === padSynth || this.synths[i] === crashSynth) {
        // Handled by reverb
        padReverb.connect(this.fxAutoFilter);
      } else if (this.synths[i] === growlBass) {
        bassFilter.connect(this.fxAutoFilter);
      } else if (this.synths[i] === leadSynth) {
        leadDelay.connect(this.fxAutoFilter);
      } else {
        this.synths[i].connect(this.fxAutoFilter);
      }
    }

    Tone.Transport.scheduleRepeat((time) => {
      this.playStep(time);
    }, '16n');

    Tone.Transport.bpm.value = useSequencerStore.getState().bpm;
    this.initialized = true;
  }

  applyPunchInFX(fx: 'STUTTER' | 'FILTER' | 'DROP' | null) {
    if (!this.initialized) return;
    
    // Reset defaults
    this.fxTremolo.wet.value = 0;
    this.fxFilter.frequency.value = 20000;
    
    if (fx === 'STUTTER') {
      this.fxTremolo.wet.value = 1;
    } else if (fx === 'FILTER') {
      this.fxFilter.frequency.rampTo(400, 0.1);
    } else if (fx === 'DROP') {
      this.fxFilter.frequency.rampTo(20000, 0.1);
      this.riserSynth.triggerAttack();
    } else {
      this.riserSynth.triggerRelease();
    }
  }

  playStep(time: number) {
    const store = useSequencerStore.getState();
    const currentStep = store.currentStep;
    const tracks = store.tracks;
    const kit = store.currentKit;
    const activeFX = store.activeFX;

    // Apply Live FX
    this.applyPunchInFX(activeFX);

    // If "DROP" is active, trigger rapid snare rolls
    if (activeFX === 'DROP') {
      if (currentStep % 2 === 0) {
        (this.synths[1] as Tone.NoiseSynth).triggerAttackRelease('32n', time); // Rapid snare
      }
    }

    tracks.forEach((track, index) => {
      const synth = this.synths[index];
      if (!synth) return;
      
      synth.volume.value = track.muted ? -Infinity : track.volume;

      if (track.steps[currentStep] && !track.muted && activeFX !== 'DROP') {
        
        // Kit changes for core drums
        if (kit === 'LIQUID') {
          if (index === 0) (synth as Tone.MembraneSynth).oscillator.type = 'sine';
          if (index === 1) (synth as Tone.NoiseSynth).noise.type = 'pink';
        } else if (kit === 'NEURO') {
          if (index === 0) (synth as Tone.MembraneSynth).oscillator.type = 'square';
          if (index === 1) (synth as Tone.NoiseSynth).noise.type = 'brown';
        } else if (kit === 'JUNGLE') {
          if (index === 0) (synth as Tone.MembraneSynth).oscillator.type = 'triangle';
          if (index === 1) (synth as Tone.NoiseSynth).noise.type = 'white';
        } else {
          if (index === 0) (synth as Tone.MembraneSynth).oscillator.type = 'sine';
          if (index === 1) (synth as Tone.NoiseSynth).noise.type = 'white';
        }

        // Trigger instruments
        if (index === 0) (synth as Tone.MembraneSynth).triggerAttackRelease(kit === 'LIQUID' ? 'C1' : 'D1', '8n', time);
        else if (index === 1) (synth as Tone.NoiseSynth).triggerAttackRelease('16n', time);
        else if (index === 2) (synth as Tone.MetalSynth).triggerAttackRelease(kit === 'JUNGLE' ? '32n' : '64n', time);
        else if (index === 3) (synth as Tone.Synth).triggerAttackRelease(kit === 'NEURO' ? 'E1' : 'D1', kit === 'LIQUID' ? '2n' : '8n', time);
        else if (index === 4) (synth as Tone.Synth).triggerAttackRelease('D0', '2n', time);
        else if (index === 5) (synth as Tone.FMSynth).triggerAttackRelease(kit === 'LIQUID' ? 'A3' : 'D3', '16n', time);
        else if (index === 6) (synth as Tone.MetalSynth).triggerAttackRelease('8n', time);
        else if (index === 7) (synth as Tone.PolySynth).triggerAttackRelease(['D3', 'F3', 'A3'], '4n', time);
        else if (index === 8) (synth as Tone.MembraneSynth).triggerAttackRelease('A2', '16n', time);
        else if (index === 9) (synth as Tone.MetalSynth).triggerAttackRelease('1m', time);
        // Pentatonic Melodies (C Minor Pentatonic)
        else if (index === 10) (synth as Tone.FMSynth).triggerAttackRelease('C4', '16n', time);
        else if (index === 11) (synth as Tone.FMSynth).triggerAttackRelease('Eb4', '16n', time);
        else if (index === 12) (synth as Tone.FMSynth).triggerAttackRelease('F4', '16n', time);
        else if (index === 13) (synth as Tone.FMSynth).triggerAttackRelease('G4', '16n', time);
        else if (index === 14) (synth as Tone.FMSynth).triggerAttackRelease('Bb4', '16n', time);
        // New Authentic DNB Instruments
        else if (index === 15) (synth as Tone.Synth).triggerAttackRelease('F1', '4n', time); // Reese
        else if (index === 16) (synth as Tone.Synth).triggerAttackRelease('D2', '4n', time); // Wobble
        else if (index === 17) (synth as Tone.PolySynth).triggerAttackRelease(['D4', 'F4', 'A4', 'C5'], '8n', time); // Minor 7th Rave Stab
        else if (index === 18) (synth as Tone.MembraneSynth).triggerAttackRelease('C1', '2n', time); // 808
        else if (index === 19) (synth as Tone.MembraneSynth).triggerAttackRelease('G2', '8n', time); // Jungle Tom
        // Extras
        else if (index === 20) (synth as Tone.NoiseSynth).triggerAttackRelease('32n', time); // Amen Snare
        else if (index === 21) (synth as Tone.FMSynth).triggerAttackRelease('C2', '16n', time); // Donk
        else if (index === 22) (synth as Tone.MetalSynth).triggerAttackRelease('64n', time); // Shaker
      }
    });

    store.setCurrentStep((currentStep + 1) % 16);
  }

  start() {
    if (Tone.context.state !== 'running') {
      Tone.context.resume();
    }
    Tone.Transport.start();
  }

  stop() {
    Tone.Transport.stop();
    useSequencerStore.getState().setCurrentStep(0);
  }
}

export const engine = new AudioEngine();
