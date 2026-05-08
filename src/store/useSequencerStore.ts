import { create } from 'zustand';

export type TrackId = number;

export interface TrackState {
  id: TrackId;
  name: string;
  volume: number; // -60 to 0
  muted: boolean;
  solo: boolean;
  steps: boolean[]; // 32 steps
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

// Helper to easily set steps (32 steps now)
const makeSteps = (...activeIndices: number[]) => {
  const steps = Array(32).fill(false);
  activeIndices.forEach(i => { if (i < 32) steps[i] = true; });
  return steps;
};

// Default Kick & Snare DNB Pattern + Pentatonic Synths
const defaultTracks: TrackState[] = [
  { id: 0, name: 'KICK', volume: 0, muted: false, solo: false, steps: makeSteps(0, 10, 16, 26) },
  { id: 1, name: 'SNAR', volume: -2, muted: false, solo: false, steps: makeSteps(8, 24) },
  { id: 2, name: ' HAT', volume: -6, muted: false, solo: false, steps: makeSteps(0, 4, 8, 12, 16, 20, 24, 28) }, 
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
];

// Encode 32 steps securely to base36
const encodeSteps = (steps: boolean[]): string => {
  const binaryString = steps.map(s => s ? '1' : '0').join('');
  return parseInt(binaryString, 2).toString(36);
};

// Decode base36 to 32 steps
const decodeSteps = (encoded: string): boolean[] => {
  const binaryString = parseInt(encoded, 36).toString(2).padStart(32, '0');
  return binaryString.split('').map(c => c === '1').slice(0, 32); // Ensure exactly 32
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
    set((state) => {
      const newTracks = state.tracks.map(t => ({ ...t, steps: Array(32).fill(false) }));
      
      // Kick (0): Typical syncopated dnb
      const kickSteps = [0, 10, 16, 26];
      if (Math.random() > 0.5) kickSteps.push(11);
      if (Math.random() > 0.5) kickSteps.push(21);
      kickSteps.forEach(s => newTracks[0].steps[s] = true);
      
      // Snare (1): 8 and 24 always
      newTracks[1].steps[8] = true;
      newTracks[1].steps[24] = true;
      // Optional ghost snare
      if (Math.random() > 0.5) newTracks[1].steps[14] = true;

      // Hats (2): Random rapid hats
      for (let i = 0; i < 32; i += 2) {
        if (Math.random() > 0.2) newTracks[2].steps[i] = true;
      }
      
      // Bass (3): Placed on off-beats
      [4, 12, 20, 28].forEach(s => {
        if (Math.random() > 0.5) newTracks[3].steps[s] = true;
      });

      // Pentatonic Melody (10-14)
      let lastMelodyStep = -1;
      for (let i = 0; i < 32; i++) {
        // Drop a melody note occasionally, but not too dense
        if (Math.random() > 0.8 && i > lastMelodyStep + 1) {
          const trackId = 10 + Math.floor(Math.random() * 5);
          newTracks[trackId].steps[i] = true;
          lastMelodyStep = i;
        }
      }

      // Add a crash at the start sometimes
      if (Math.random() > 0.5) newTracks[9].steps[0] = true;

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
    // Encode each track's 32 steps into a base36 string
    const trackStrs = state.tracks.map(track => encodeSteps(track.steps));
    
    const baseUrl = 'https://lelandbondx.github.io/DNBAIBOT/';
    const url = new URL(baseUrl);
    url.searchParams.set('t', trackStrs.join('-'));
    url.searchParams.set('b', state.bpm.toString());
    url.searchParams.set('k', state.currentKit);
    return url.toString();
  }
}));
