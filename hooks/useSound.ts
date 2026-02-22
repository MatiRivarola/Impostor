import { useState, useCallback, useRef } from 'react';

type SoundType =
  | 'card_flip'
  | 'reveal_impostor'
  | 'reveal_citizen'
  | 'vote_confirm'
  | 'elimination_success'
  | 'elimination_danger'
  | 'timer_tick'
  | 'timer_end'
  | 'victory'
  | 'defeat'
  | 'round_event'
  | 'vote_tally';

const SETTINGS_KEY = 'impostor_sound_settings';

function loadSettings(): { sound: boolean; vibration: boolean } {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return { sound: true, vibration: true };
}

function saveSettings(sound: boolean, vibration: boolean) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ sound, vibration }));
}

function getAudioContext(): AudioContext | null {
  try {
    return new (window.AudioContext || (window as any).webkitAudioContext)();
  } catch {
    return null;
  }
}

function playOsc(
  ctx: AudioContext,
  type: OscillatorType,
  freq: number,
  duration: number,
  startTime: number,
  gainValue = 0.3,
  freqEnd?: number
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  if (freqEnd !== undefined) {
    osc.frequency.linearRampToValueAtTime(freqEnd, startTime + duration);
  }
  gain.gain.setValueAtTime(gainValue, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

const SYNTH: Record<SoundType, (ctx: AudioContext) => void> = {
  card_flip(ctx) {
    playOsc(ctx, 'sine', 300, 0.15, ctx.currentTime, 0.2, 600);
  },
  reveal_impostor(ctx) {
    const t = ctx.currentTime;
    playOsc(ctx, 'sine', 100, 0.5, t, 0.25);
    playOsc(ctx, 'sine', 150, 0.5, t, 0.25);
  },
  reveal_citizen(ctx) {
    const t = ctx.currentTime;
    playOsc(ctx, 'sine', 523, 0.2, t, 0.2);
    playOsc(ctx, 'sine', 659, 0.2, t, 0.2);
  },
  vote_confirm(ctx) {
    playOsc(ctx, 'square', 800, 0.05, ctx.currentTime, 0.15);
  },
  elimination_success(ctx) {
    const t = ctx.currentTime;
    playOsc(ctx, 'sine', 262, 0.1, t, 0.25);        // C4
    playOsc(ctx, 'sine', 330, 0.1, t + 0.1, 0.25);  // E4
    playOsc(ctx, 'sine', 392, 0.15, t + 0.2, 0.25);  // G4
  },
  elimination_danger(ctx) {
    const t = ctx.currentTime;
    playOsc(ctx, 'sawtooth', 392, 0.1, t, 0.15);     // G4
    playOsc(ctx, 'sawtooth', 330, 0.1, t + 0.1, 0.15); // E4
    playOsc(ctx, 'sawtooth', 262, 0.15, t + 0.2, 0.15); // C4
  },
  timer_tick(ctx) {
    playOsc(ctx, 'sine', 1000, 0.03, ctx.currentTime, 0.15);
  },
  timer_end(ctx) {
    playOsc(ctx, 'sawtooth', 200, 0.5, ctx.currentTime, 0.25);
  },
  victory(ctx) {
    const t = ctx.currentTime;
    playOsc(ctx, 'sine', 262, 0.6, t, 0.2);  // C
    playOsc(ctx, 'sine', 330, 0.6, t, 0.2);  // E
    playOsc(ctx, 'sine', 392, 0.6, t, 0.2);  // G
  },
  defeat(ctx) {
    const t = ctx.currentTime;
    playOsc(ctx, 'sine', 262, 0.8, t, 0.2);  // C
    playOsc(ctx, 'sine', 311, 0.8, t, 0.2);  // Eb
    playOsc(ctx, 'sine', 392, 0.8, t, 0.2);  // G
  },
  round_event(ctx) {
    playOsc(ctx, 'sine', 200, 0.3, ctx.currentTime, 0.2, 800);
  },
  vote_tally(ctx) {
    playOsc(ctx, 'sine', 600, 0.08, ctx.currentTime, 0.2);
  },
};

const VIBRATION_PATTERNS: Partial<Record<SoundType, number | number[]>> = {
  reveal_impostor: [200, 100, 200],
  elimination_success: 300,
  elimination_danger: 300,
  timer_end: [100, 50, 100],
  victory: [100, 50, 100, 50, 200],
  defeat: [300, 100, 300],
};

export function useSound() {
  const initial = loadSettings();
  const [soundEnabled, setSoundEnabled] = useState(initial.sound);
  const [vibrationEnabled, setVibrationEnabled] = useState(initial.vibration);
  const ctxRef = useRef<AudioContext | null>(null);

  const playSound = useCallback(
    (type: SoundType) => {
      if (!soundEnabled) return;
      if (!ctxRef.current || ctxRef.current.state === 'closed') {
        ctxRef.current = getAudioContext();
      }
      const ctx = ctxRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();
      SYNTH[type]?.(ctx);

      if (vibrationEnabled && navigator.vibrate) {
        const pattern = VIBRATION_PATTERNS[type];
        if (pattern) navigator.vibrate(pattern);
      }
    },
    [soundEnabled, vibrationEnabled]
  );

  const vibrate = useCallback(
    (pattern: number | number[]) => {
      if (vibrationEnabled && navigator.vibrate) {
        navigator.vibrate(pattern);
      }
    },
    [vibrationEnabled]
  );

  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => {
      const next = !prev;
      saveSettings(next, vibrationEnabled);
      return next;
    });
  }, [vibrationEnabled]);

  const toggleVibration = useCallback(() => {
    setVibrationEnabled(prev => {
      const next = !prev;
      saveSettings(soundEnabled, next);
      return next;
    });
  }, [soundEnabled]);

  return { playSound, vibrate, soundEnabled, vibrationEnabled, toggleSound, toggleVibration };
}
