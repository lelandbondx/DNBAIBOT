import { create } from 'zustand';

export type TrackId = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface TrackState {
  id: TrackId;
  name: string;
  volume: number; // -60 to 0
  muted: boolean;
  solo: boolean;
  steps: boolean[]; // 16 steps
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
  toggleMute: (trackId: TrackId) => void;
  setVolume: (trackId: TrackId, volume: number) => void;
  setCurrentStep: (step: number) => void;
  setKit: (kit: KitType) => void;
  clearPattern: () => void;
  distortionEnabled: boolean;
  toggleDistortion: () => void;
  getShareUrl: () => string;
}

// Helper to easily set steps
const makeSteps = (...activeIndices: number[]) => {
  const steps = Array(16).fill(false);
  activeIndices.forEach(i => { steps[i] = true; });
  return steps;
};

// Default Kick & Snare DNB Pattern
const defaultTracks: TrackState[] = [
  { id: 0, name: 'KICK', volume: 0, muted: false, solo: false, steps: makeSteps(0, 8, 10) },
  { id: 1, name: 'SNAR', volume: -2, muted: false, solo: false, steps: makeSteps(4, 12) },
  { id: 2, name: ' HAT', volume: -6, muted: false, solo: false, steps: makeSteps(0, 2, 4, 6, 8, 10, 12, 14) }, 
  { id: 3, name: 'BASS', volume: -4, muted: false, solo: false, steps: makeSteps() }, 
  { id: 4, name: ' SUB', volume: -2, muted: false, solo: false, steps: makeSteps() }, 
  { id: 5, name: 'LEAD', volume: -6, muted: false, solo: false, steps: makeSteps() }, 
  { id: 6, name: 'RIDE', volume: -8, muted: false, solo: false, steps: makeSteps() }, 
  { id: 7, name: ' PAD', volume: -10, muted: false, solo: false, steps: makeSteps() }, 
  { id: 8, name: 'GHST', volume: -6, muted: false, solo: false, steps: makeSteps() }, 
  { id: 9, name: 'CRSH', volume: -10, muted: false, solo: false, steps: makeSteps() }, 
];

// Encode steps to an integer
const encodeSteps = (steps: boolean[]): number => {
  return steps.reduce((acc, step, i) => acc | (step ? (1 << i) : 0), 0);
};

// Decode integer to steps
const decodeSteps = (encoded: number): boolean[] => {
  const steps = Array(16).fill(false);
  for (let i = 0; i < 16; i++) {
    steps[i] = (encoded & (1 << i)) !== 0;
  }
  return steps;
};

// Load state from URL Hash or Query
const loadFromHash = () => {
  const params = new URLSearchParams(window.location.search);

  // New ultra-compact format: ?t=...&b=...&k=...
  if (params.has('t')) {
    try {
      const tStr = params.get('t');
      const bpmStr = params.get('b');
      const kitStr = params.get('k');
      
      const trackInts = tStr ? tStr.split('-').map(Number) : [];
      const mergedTracks = defaultTracks.map((dt, i) => ({
        ...dt,
        steps: trackInts[i] !== undefined ? decodeSteps(trackInts[i]) : dt.steps
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

  // Legacy format fallback
  let encoded = '';
  if (params.has('p')) {
    encoded = params.get('p') || '';
  } else if (window.location.hash) {
    encoded = window.location.hash.slice(1);
  } else if (window.location.pathname.includes('%23')) {
    encoded = window.location.pathname.split('%23')[1];
  }

  if (!encoded) return null;
  try {
    const state = JSON.parse(atob(encoded));
    const mergedTracks = defaultTracks.map((dt, i) => ({
      ...dt,
      steps: state.t[i] || dt.steps
    }));
    return {
      tracks: mergedTracks,
      bpm: state.b || 174,
      currentKit: state.k || 'UK-DNB',
    };
  } catch (e) {
    console.error("Failed to parse legacy URL hash pattern", e);
    return null;
  }
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
    tracks: state.tracks.map(t => ({ ...t, steps: Array(16).fill(false) }))
  })),
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
    // Encode each track's 16 steps into a single 16-bit integer for a tiny URL
    const trackInts = state.tracks.map(track => encodeSteps(track.steps));
    
    // Always use the public deployment URL for sharing
    const baseUrl = 'https://lees-robo-tunes-100.surge.sh/';
    const url = new URL(baseUrl);
    url.searchParams.set('t', trackInts.join('-'));
    url.searchParams.set('b', state.bpm.toString());
    url.searchParams.set('k', state.currentKit);
    return url.toString();
  }
}));
