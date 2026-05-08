import { create } from 'zustand';

export type TrackId = number;

export interface TrackState {
  id: TrackId;
  name: string;
  volume: number; // -60 to 0
  muted: boolean;
  solo: boolean;
  steps: boolean[]; // 32 steps (2 Bars)
}

export type KitType = 'UK-DNB' | 'LIQUID' | 'NEURO' | 'JUNGLE';

interface SequencerState {
  bpm: number;
  isPlaying: boolean;
  tracks: TrackState[];
  currentStep: number;
  currentKit: KitType;
  setBpm: (bpm: number) => void;
  togglePlay: () => void;
  setPlaying: (playing: boolean) => void;
  toggleStep: (trackId: TrackId, stepIndex: number) => void;
  setStep: (trackId: TrackId, stepIndex: number, active: boolean) => void;
  toggleMute: (trackId: TrackId) => void;
  setVolume: (trackId: TrackId, volume: number) => void;
  setCurrentStep: (step: number) => void;
  setKit: (kit: KitType) => void;
  clearPattern: () => void;
  generateEpicBeat: () => void;
  distortionEnabled: boolean;
  toggleDistortion: () => void;
  getShareUrl: () => string;
}

// Helper to easily set steps
const makeSteps = (...activeIndices: number[]) => {
  const steps = Array(32).fill(false);
  activeIndices.forEach(i => { if (i < 32) steps[i] = true; });
  return steps;
};

// FAST 174 BPM DNB PATTERNS (16 steps = 1 bar. Snare on 4 and 12)
const defaultTracks: TrackState[] = [
  { id: 0, name: 'KICK', volume: 0, muted: false, solo: false, steps: makeSteps(0, 5, 8, 16, 21, 24) },
  { id: 1, name: 'SNAR', volume: -2, muted: false, solo: false, steps: makeSteps(4, 12, 20, 28) },
  { id: 2, name: ' HAT', volume: -6, muted: false, solo: false, steps: makeSteps(0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30) }, 
  { id: 3, name: 'BASS', volume: -4, muted: false, solo: false, steps: makeSteps() }, 
  { id: 4, name: ' SUB', volume: -2, muted: false, solo: false, steps: makeSteps() }, 
  { id: 5, name: 'LEAD', volume: -6, muted: false, solo: false, steps: makeSteps() }, 
  { id: 6, name: 'RIDE', volume: -8, muted: false, solo: false, steps: makeSteps() }, 
  { id: 7, name: ' PAD', volume: -10, muted: false, solo: false, steps: makeSteps() }, 
  { id: 8, name: 'GHST', volume: -6, muted: false, solo: false, steps: makeSteps() }, 
  { id: 9, name: 'CRSH', volume: -10, muted: false, solo: false, steps: makeSteps(0) }, 
  // Pentatonic scale
  { id: 10, name: 'SYN C', volume: -4, muted: false, solo: false, steps: makeSteps() },
  { id: 11, name: 'SYN Eb', volume: -4, muted: false, solo: false, steps: makeSteps() },
  { id: 12, name: 'SYN F', volume: -4, muted: false, solo: false, steps: makeSteps() },
  { id: 13, name: 'SYN G', volume: -4, muted: false, solo: false, steps: makeSteps() },
  { id: 14, name: 'SYN Bb', volume: -4, muted: false, solo: false, steps: makeSteps() },
  // Brand new Classic DNB Instruments
  { id: 15, name: 'REESE', volume: -2, muted: false, solo: false, steps: makeSteps(0, 16) },
  { id: 16, name: 'WOBBL', volume: -2, muted: false, solo: false, steps: makeSteps() },
  { id: 17, name: ' STAB', volume: -4, muted: false, solo: false, steps: makeSteps() },
  { id: 18, name: '  808', volume: 0, muted: false, solo: false, steps: makeSteps() },
  { id: 19, name: 'J TOM', volume: -4, muted: false, solo: false, steps: makeSteps(14, 30) },
];

// Encode 32 steps securely using BigInt to Hex
const encodeSteps = (steps: boolean[]): string => {
  const binaryString = steps.map(s => s ? '1' : '0').join('');
  return BigInt('0b' + binaryString).toString(16);
};

// Decode hex to 32 steps using BigInt
const decodeSteps = (encoded: string): boolean[] => {
  let binaryString = '0';
  try {
    binaryString = BigInt('0x' + encoded).toString(2);
  } catch(e) {
    // fallback
  }
  const padded = binaryString.padStart(32, '0');
  return padded.split('').map(c => c === '1').slice(0, 32);
};

// Load state from URL Hash or Query
const loadFromHash = () => {
  const params = new URLSearchParams(window.location.search);

  // Compact format: ?t=...&b=...&k=...
  if (params.has('t')) {
    try {
      const tStr = params.get('t');
      const bpmStr = params.get('b');
      const kitStr = params.get('k');
      
      const trackStrs = tStr ? tStr.split('-') : [];
      const mergedTracks = defaultTracks.map((dt, i) => ({
        ...dt,
        steps: trackStrs[i] !== undefined ? decodeSteps(trackStrs[i]) : dt.steps
      }));
      
      return {
        tracks: mergedTracks,
        bpm: bpmStr ? parseInt(bpmStr, 10) : 174,
        currentKit: kitStr || 'UK-DNB',
      };
    } catch (e) {
      console.error("Failed to parse compact URL pattern", e);
    }
  }

  return null;
};

const initialState = loadFromHash() || { tracks: defaultTracks, bpm: 174, currentKit: 'UK-DNB' };

export const useSequencerStore = create<SequencerState>((set, get) => ({
  bpm: initialState.bpm, // The absolute perfect DNB BPM
  isPlaying: false,
  tracks: initialState.tracks,
  currentStep: 0,
  currentKit: initialState.currentKit as KitType,
  distortionEnabled: false,
  toggleDistortion: () => set((state) => ({ distortionEnabled: !state.distortionEnabled })),
  setBpm: (bpm) => {
    const newBpm = Math.max(120, Math.min(220, bpm));
    // Immediately update Tone.js Transport BPM to prevent jitter
    import('tone').then(Tone => {
      Tone.Transport.bpm.value = newBpm;
    });
    set({ bpm: newBpm });
  },
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentStep: (step) => set({ currentStep: step }),
  setKit: (kit) => set({ currentKit: kit }),
  clearPattern: () => set((state) => ({
    tracks: state.tracks.map(t => ({ ...t, steps: Array(32).fill(false) }))
  })),
  generateEpicBeat: () => {
    // UK DNB Quantize & Style Magic (16 steps = 1 bar)
    set((state) => {
      const newTracks = JSON.parse(JSON.stringify(state.tracks));
      
      let noteCount = 0;
      newTracks.forEach((t: TrackState) => {
        t.steps.forEach(s => { if (s) noteCount++; });
      });

      const isGeneratingFresh = noteCount < 10;

      // Enforce Snare on 2 and 4 (Steps 4, 12, 20, 28)
      const validSnares = [4, 12, 20, 28];
      validSnares.forEach(s => {
        newTracks[1].steps[s] = true;
      });

      // Clear awkward snares closely around the 2 and 4
      [3, 5, 11, 13, 19, 21, 27, 29].forEach(s => {
        newTracks[1].steps[s] = false;
      });

      // Quantize Kicks to UK DNB rhythm
      const validKickGrid = [0, 5, 8, 10, 16, 21, 24, 26];
      
      if (!isGeneratingFresh) {
        for (let i = 0; i < 32; i++) {
          if (newTracks[0].steps[i] && !validKickGrid.includes(i)) {
            newTracks[0].steps[i] = false;
            let nearest = validKickGrid[0];
            let minDist = 32;
            validKickGrid.forEach(v => {
              if (Math.abs(v - i) < minDist) {
                minDist = Math.abs(v - i);
                nearest = v;
              }
            });
            if (minDist <= 2) newTracks[0].steps[nearest] = true; 
          }
        }
      } else {
        // Generate fresh kicks
        [0, 5, 8, 16, 21, 24].forEach(s => newTracks[0].steps[s] = true);
      }

      // Ensure Hat momentum (every 8th note)
      for (let i = 0; i < 32; i += 2) {
        newTracks[2].steps[i] = true; 
        if (Math.random() > 0.7) newTracks[2].steps[i+1] = true; // Random 16th hats
      }

      // Drop in some Rave Stabs (17) on off-beats
      [6, 14, 22, 30].forEach(s => {
        if (Math.random() > 0.6) newTracks[17].steps[s] = true;
      });

      // Layer 808 (18)
      [0, 16].forEach(s => {
        if (Math.random() > 0.5) newTracks[18].steps[s] = true;
      });
      
      // Add Jungle Toms (19) for rolling breaks
      [6, 7, 14, 15, 30, 31].forEach(s => {
        if (Math.random() > 0.6) newTracks[19].steps[s] = true;
      });

      // Reese (15) and Wobble (16)
      if (Math.random() > 0.5) {
        newTracks[15].steps[0] = true; 
        newTracks[15].steps[16] = true;
      } else {
        newTracks[16].steps[0] = true; 
        newTracks[16].steps[8] = true;
        newTracks[16].steps[16] = true;
        newTracks[16].steps[24] = true;
      }

      newTracks[9].steps[0] = true; // Crash

      return { tracks: newTracks };
    });
  },
  toggleStep: (trackId, stepIndex) =>
    set((state) => {
      const newTracks = [...state.tracks];
      const track = { ...newTracks[trackId] };
      const newSteps = [...track.steps];
      newSteps[stepIndex] = !newSteps[stepIndex];
      track.steps = newSteps;
      newTracks[trackId] = track;
      return { tracks: newTracks };
    }),
  setStep: (trackId, stepIndex, active) =>
    set((state) => {
      const newTracks = [...state.tracks];
      const track = { ...newTracks[trackId] };
      const newSteps = [...track.steps];
      if (newSteps[stepIndex] !== active) {
        newSteps[stepIndex] = active;
        track.steps = newSteps;
        newTracks[trackId] = track;
        return { tracks: newTracks };
      }
      return state;
    }),
  toggleMute: (trackId) =>
    set((state) => {
      const newTracks = [...state.tracks];
      newTracks[trackId] = { ...newTracks[trackId], muted: !newTracks[trackId].muted };
      return { tracks: newTracks };
    }),
  setVolume: (trackId, volume) =>
    set((state) => {
      const newTracks = [...state.tracks];
      newTracks[trackId] = { ...newTracks[trackId], volume };
      return { tracks: newTracks };
    }),
  getShareUrl: () => {
    const state = get();
    const trackStrs = state.tracks.map(track => encodeSteps(track.steps));
    
    const baseUrl = 'https://lelandbondx.github.io/DNBAIBOT/';
    const url = new URL(baseUrl);
    url.searchParams.set('t', trackStrs.join('-'));
    url.searchParams.set('b', state.bpm.toString());
    url.searchParams.set('k', state.currentKit);
    return url.toString();
  }
}));
