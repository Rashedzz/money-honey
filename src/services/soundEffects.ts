/**
 * Zero-Latency Web Audio API Sound Effects Synthesizer for Money-Honey
 * Synthesizes crisp, pleasant, native fintech chimes and audio alerts:
 * 1. playDepositSuccessSound() - Uplifting arpeggio chime on money deposit confirmation
 * 2. playNotificationChime() - Soft dual-tone bell for alerts & updates
 * 3. playAlertSound() - Distinct reminder tone for upcoming dues & countdowns
 * Completely offline capable with 0 network latency or external MP3 dependency.
 */

const SOUND_ENABLED_KEY = 'mh_sound_effects_enabled';

class SoundEffectsEngine {
  private audioCtx: AudioContext | null = null;
  private isEnabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const stored = window.localStorage.getItem(SOUND_ENABLED_KEY);
        if (stored !== null) {
          this.isEnabled = stored === 'true';
        }
      } catch (e) {}
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      if (!this.audioCtx) {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtxClass) {
          this.audioCtx = new AudioCtxClass();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      return this.audioCtx;
    } catch (e) {
      return null;
    }
  }

  public isAudioEnabled(): boolean {
    return this.isEnabled;
  }

  public setAudioEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(SOUND_ENABLED_KEY, String(enabled));
      } catch (e) {}
    }
  }

  /**
   * Play an uplifting 4-note arpeggio (C5 -> E5 -> G5 -> C6) when money is deposited
   */
  public playDepositSuccessSound(): void {
    if (!this.isEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [
        { freq: 523.25, time: 0.00, dur: 0.12 }, // C5
        { freq: 659.25, time: 0.09, dur: 0.12 }, // E5
        { freq: 783.99, time: 0.18, dur: 0.15 }, // G5
        { freq: 1046.50, time: 0.28, dur: 0.35 }, // C6
      ];

      notes.forEach(({ freq, time, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + time);

        gain.gain.setValueAtTime(0, now + time);
        gain.gain.linearRampToValueAtTime(0.28, now + time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + time);
        osc.stop(now + time + dur);
      });
    } catch (e) {
      console.warn('Sound synthesis error:', e);
    }
  }

  /**
   * Play a clean dual-tone chime (D5 -> A5) for general notifications
   */
  public playNotificationChime(): void {
    if (!this.isEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [
        { freq: 587.33, time: 0.00, dur: 0.14 }, // D5
        { freq: 880.00, time: 0.10, dur: 0.30 }, // A5
      ];

      notes.forEach(({ freq, time, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + time);

        gain.gain.setValueAtTime(0, now + time);
        gain.gain.linearRampToValueAtTime(0.22, now + time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + time);
        osc.stop(now + time + dur);
      });
    } catch (e) {
      console.warn('Notification chime error:', e);
    }
  }

  /**
   * Play a subtle warning / alert chime for approaching due dates
   */
  public playAlertSound(): void {
    if (!this.isEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [
        { freq: 440.00, time: 0.00, dur: 0.15 }, // A4
        { freq: 440.00, time: 0.16, dur: 0.20 }, // A4
      ];

      notes.forEach(({ freq, time, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + time);

        gain.gain.setValueAtTime(0, now + time);
        gain.gain.linearRampToValueAtTime(0.20, now + time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + time);
        osc.stop(now + time + dur);
      });
    } catch (e) {}
  }
}

export const SoundService = new SoundEffectsEngine();
