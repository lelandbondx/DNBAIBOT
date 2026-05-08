import { create } from 'zustand';

export type TrackId = number;

export interface TrackState {
  id: TrackId;
  name: string;
  volume: number; // -60 to 0
  muted: boolean;
  solo: boolean;
  steps: boolean[]; // 64 steps now
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
  generateEpicBeat: () => void; // Acts as UK DNB Quantize & Style
  distortionEnabled: boolean;
  toggleDistortion: () => void;
  getShareUrl: () => string;
}

// Helper to easily set steps (64 steps now)
const makeSteps = (...activeIndices: number[]) => {
  const steps = Array(64).fill(false);
  activeIndices.forEach(i => { if (i < 64) steps[i] = true; });
  return steps;
};

// Default Kick & Snare DNB Pattern + Pentatonic Synths + Classic DNB Instruments
const defaultTracks: TrackState[] = [
  { id: 0, name: 'KICK', volume: 0, muted: false, solo: false, steps: makeSteps(0, 10, 16, 26, 32, 42, 48, 58) },
  { id: 1, name: 'SNAR', volume: -2, muted: false, solo: false, steps: makeSteps(8, 24, 40, 56) },
  { id: 2, name: ' HAT', volume: -6, muted: false, solo: false, steps: makeSteps(0, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60) }, 
  { id: 3, name: 'BASS', volume: -4, muted: false, solo: false, steps: makeSteps() }, 
  { id: 4, name: ' SUB', volume: -2, muted: false, solo: false, steps: makeSteps() }, 
  { id: 5, name: 'LEAD', volume: -6, muted: false, solo: false, steps: makeSteps() }, 
  { id: 6, name: 'RIDE', volume: -8, muted: false, solo: false, steps: makeSteps() }, 
  { id: 7, name: ' PAD', volume: -10, muted: false, solo: false, steps: makeSteps() }, 
  { id: 8, name: 'GHST', volume: -6, muted: false, solo: false, steps: makeSteps() }, 
  { id: 9, name: 'CRSH', volume: -10, muted: false, solo: false, steps: makeSteps(0) }, 
  // Pentatonic scale tracks for "Epic" melodies
  { id: 10, name: 'SYN C', volume: -4, muted: false, solo: false, steps: makeSteps() },
  { id: 11, name: 'SYN Eb', volume: -4, muted: false, solo: false, steps: makeSteps() },
  { id: 12, name: 'SYN F', volume: -4, muted: false, solo: false, steps: makeSteps() },
  { id: 13, name: 'SYN G', volume: -4, muted: false, solo: false, steps: makeSteps() },
  { id: 14, name: 'SYN Bb', volume: -4, muted: false, solo: false, steps: makeSteps() },
  // Brand new Classic DNB Instruments
  { id: 15, name: 'REESE', volume: -2, muted: false, solo: false, steps: makeSteps() },
  { id: 16, name: 'WOBBL', volume: -2, muted: false, solo: false, steps: makeSteps() },
  { id: 17, name: ' STAB', volume: -4, muted: false, solo: false, steps: makeSteps() },
  { id: 18, name: '  808', volume: 0, muted: false, solo: false, steps: makeSteps() },
  { id: 19, name: 'J TOM', volume: -4, muted: false, solo: false, steps: makeSteps() },
];

// Encode 64 steps securely using BigInt to Hex
const encodeSteps = (steps: boolean[]): string => {
  const binaryString = steps.map(s => s ? '1' : '0').join('');
  return BigInt('0b' + binaryString).toString(16);
};

// Decode hex to 64 steps using BigInt
const decodeSteps = (encoded: string): boolean[] => {
  let binaryString = '0';
  try {
    binaryString = BigInt('0x' + encoded).toString(2);
  } catch(e) {
    // fallback
  }
  const padded = binaryString.padStart(64, '0');
  return padded.split('').map(c => c === '1').slice(0, 64);
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
    tracks: state.tracks.map(t => ({ ...t, steps: Array(64).fill(false) }))
  })),
  generateEpicBeat: () => {
    // UK DNB Quantize & Style Magic
    set((state) => {
      const newTracks = JSON.parse(JSON.stringify(state.tracks));
      
      // Check if board is mostly empty (less than 10 notes)
      let noteCount = 0;
      newTracks.forEach((t: TrackState) => {
        t.steps.forEach(s => { if (s) noteCount++; });
      });

      const isGeneratingFresh = noteCount < 10;

      // Enforce Snare on 2 and 4 (Steps 8, 24, 40, 56)
      [8, 24, 40, 56].forEach(s => {
        newTracks[1].steps[s] = true;
      });

      // Clear awkward snares closely around the 2 and 4
      [7, 9, 23, 25, 39, 41, 55, 57].forEach(s => {
        newTracks[1].steps[s] = false;
      });

      // Quantize Kicks to UK DNB rhythm (0, 10, 16, 26, 32, 42, 48, 58)
      const validKickGrid = [0, 10, 16, 26, 32, 42, 48, 58];
      
      if (!isGeneratingFresh) {
        // Move off-grid kicks to nearest valid grid
        for (let i = 0; i < 64; i++) {
          if (newTracks[0].steps[i] && !validKickGrid.includes(i)) {
            newTracks[0].steps[i] = false;
            // Find nearest
            let nearest = validKickGrid[0];
            let minDist = 64;
            validKickGrid.forEach(v => {
              if (Math.abs(v - i) < minDist) {
                minDist = Math.abs(v - i);
                nearest = v;
              }
            });
            if (minDist <= 3) newTracks[0].steps[nearest] = true; // only snap if somewhat close
          }
        }
      } else {
        // Generate fresh kicks
        validKickGrid.forEach(s => newTracks[0].steps[s] = true);
        // Maybe add some syncopated kicks
        if (Math.random() > 0.5) newTracks[0].steps[11] = true;
        if (Math.random() > 0.5) newTracks[0].steps[53] = true;
      }

      // Ensure Hat momentum
      for (let i = 0; i < 64; i += 4) {
        newTracks[2].steps[i] = true; // Downbeat hats
        if (Math.random() > 0.5) newTracks[2].steps[i+2] = true; // Syncopated 16th hats
      }

      // Drop in some Rave Stabs (17) on off-beats for UK Flavor
      [14, 30, 46, 62].forEach(s => {
        if (Math.random() > 0.4) newTracks[17].steps[s] = true;
      });

      // Layer 808 (18) with the kicks occasionally
      [0, 32].forEach(s => newTracks[18].steps[s] = true);
      
      // Add Jungle Toms (19) for rolling breaks at the end of bars
      [12, 13, 28, 29, 60, 61].forEach(s => {
        if (Math.random() > 0.6) newTracks[19].steps[s] = true;
      });

      // Reese (15) and Wobble (16) alternating phrasing
      if (Math.random() > 0.5) {
        newTracks[15].steps[0] = true; // Heavy Reese at start of bar
        newTracks[15].steps[32] = true;
      } else {
        newTracks[16].steps[0] = true; // Wobble
        newTracks[16].steps[16] = true;
        newTracks[16].steps[32] = true;
        newTracks[16].steps[48] = true;
      }

      // Add a crash at the start of the 4 bar phrase
      newTracks[9].steps[0] = true;

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
    // Encode each track's 64 steps into a hex string
    const trackStrs = state.tracks.map(track => encodeSteps(track.steps));
    
    const baseUrl = 'https://lelandbondx.github.io/DNBAIBOT/';
    const url = new URL(baseUrl);
    url.searchParams.set('t', trackStrs.join('-'));
    url.searchParams.set('b', state.bpm.toString());
    url.searchParams.set('k', state.currentKit);
    return url.toString();
  }
}));
