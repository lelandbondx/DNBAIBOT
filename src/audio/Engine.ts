import * as Tone from 'tone';
import { useSequencerStore } from '../store/useSequencerStore';

class AudioEngine {
  initialized = false;
  synths: any[] = [];
  masterCompressor!: Tone.Compressor;
  masterLimiter!: Tone.Limiter;
  masterReverb!: Tone.Reverb;
  masterDistortion!: Tone.Distortion;

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
    this.masterReverb = new Tone.Reverb({ decay: 1.5, preDelay: 0.01, wet: 0.1 });
    this.masterDistortion = new Tone.Distortion({ distortion: 0.4, wet: 0 });

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

    // Melodic Tracks (10-14) - Plucky FM Synths for the pentatonic scale
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
      echo.toDestination();
      return synth;
    };

    const synC = createMelodicSynth();
    const synEb = createMelodicSynth();
    const synF = createMelodicSynth();
    const synG = createMelodicSynth();
    const synBb = createMelodicSynth();

    this.synths = [
      kickSynth, snareSynth, hatSynth, growlBass, subBass,
      leadSynth, rideSynth, padSynth, ghostSynth, crashSynth,
      synC, synEb, synF, synG, synBb
    ];

    // Connect tracks 0-9 to destination
    for(let i = 0; i <= 9; i++) {
      this.synths[i].toDestination();
    }

    Tone.Transport.scheduleRepeat((time) => {
      this.playStep(time);
    }, '16n');

    Tone.Transport.bpm.value = useSequencerStore.getState().bpm;
    this.initialized = true;
  }

  playStep(time: number) {
    const store = useSequencerStore.getState();
    const currentStep = store.currentStep;
    const tracks = store.tracks;
    const kit = store.currentKit;

    tracks.forEach((track, index) => {
      const synth = this.synths[index];
      if (!synth) return;
      
      synth.volume.value = track.muted ? -Infinity : track.volume;

      if (track.steps[currentStep] && !track.muted) {
        
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
      }
    });

    store.setCurrentStep((currentStep + 1) % 32); // Updated to 32 steps
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

  toggleDistortion(enabled: boolean) {
    if (this.masterDistortion) {
      this.masterDistortion.wet.value = enabled ? 0.8 : 0;
    }
  }
}

export const engine = new AudioEngine();
