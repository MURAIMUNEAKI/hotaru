/**
 * Web Audio API based ambient synthesizer for Hotaru
 * Generates relaxing, ethereal, and emotional soundscapes without external audio dependencies.
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isBgmPlaying: boolean = false;
  private bgmIntervalId: number | null = null;
  private masterGain: GainNode | null = null;

  constructor() {
    // AudioContext will be initialized on first user gesture
  }

  public init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.isMuted ? 0 : 0.6;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.6, this.ctx ? this.ctx.currentTime : 0);
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Play a soft shooting sound (gentle crystalline pulse)
   */
  public playShoot() {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880 + Math.random() * 80, now);
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.08);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch {
      // Audio errors safely swallowed
    }
  }

  /**
   * Sound when a shadow mist is purified into photons
   */
  public playPurify() {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      const notes = [659.25, 783.99, 987.77, 1046.5]; // E5, G5, B5, C6
      const note = notes[Math.floor(Math.random() * notes.length)];
      osc.frequency.setValueAtTime(note, now);
      osc.frequency.exponentialRampToValueAtTime(note * 1.25, now + 0.2);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.2);
    } catch {
      // safe
    }
  }

  /**
   * Sound when collecting a photon particle
   */
  public playPhotonCollect() {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1174.66, now); // D6
      osc.frequency.exponentialRampToValueAtTime(1567.98, now + 0.12); // G6

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch {
      // safe
    }
  }

  /**
   * Grand resonant chime when lighting up a major city landmark
   */
  public playLandmarkIgnited() {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    try {
      const now = this.ctx.currentTime;
      const chord = [329.63, 440, 554.37, 659.25, 880]; // E, A, C#, E, A

      chord.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.06 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2 + idx * 0.1);

        osc.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(now + idx * 0.06);
        osc.stop(now + 1.5 + idx * 0.1);
      });
    } catch {
      // safe
    }
  }

  /**
   * Joyful chime when rescuing a companion firefly
   */
  public playCompanionRescued() {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    try {
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);

        gain.gain.setValueAtTime(0.09, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.35);

        osc.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.35);
      });
    } catch {
      // safe
    }
  }

  /**
   * Sound for charging the Luminescence Burst
   */
  public playBurstCharge(chargeRatio: number) {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(220 + chargeRatio * 440, now);

      gain.gain.setValueAtTime(0.02 + chargeRatio * 0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch {
      // safe
    }
  }

  /**
   * Sound when unleashing Luminescence Burst
   */
  public playBurstRelease() {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    try {
      const now = this.ctx.currentTime;
      
      // Sweep sound
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(330, now);
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.35);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.8);

      // Shimmer chord
      [880, 1108.73, 1318.51, 1760].forEach((freq) => {
        const o = this.ctx!.createOscillator();
        const g = this.ctx!.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(freq, now + 0.1);
        g.gain.setValueAtTime(0.08, now + 0.1);
        g.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

        o.connect(g);
        g.connect(this.masterGain!);

        o.start(now + 0.1);
        o.stop(now + 1.2);
      });
    } catch {
      // safe
    }
  }

  /**
   * Sound when the firefly hits enemy flame and light fades (Game Over)
   */
  public playDefeated() {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    try {
      const now = this.ctx.currentTime;
      // Descending somber notes: C5 -> Ab4 -> F4 -> D4
      const notes = [523.25, 415.30, 349.23, 293.66];
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.14);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.85, now + idx * 0.14 + 0.45);

        gain.gain.setValueAtTime(0.12, now + idx * 0.14);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.6);

        osc.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(now + idx * 0.14);
        osc.stop(now + idx * 0.14 + 0.65);
      });
    } catch {
      // safe
    }
  }

  /**
   * Starts ambient background generative music loop
   */
  public startAmbientBgm() {
    if (this.isBgmPlaying) return;
    this.init();
    this.isBgmPlaying = true;

    // Ambient chord progression: Emaj9 -> C#m7 -> Amaj7 -> Badd11
    const chordProgressions = [
      [164.81, 246.94, 329.63, 493.88], // E chord
      [138.59, 220.00, 329.63, 440.00], // C#m
      [110.00, 220.00, 277.18, 329.63], // A
      [123.47, 246.94, 369.99, 493.88], // B
    ];

    let chordIdx = 0;

    const playChordStep = () => {
      if (!this.isBgmPlaying || !this.ctx || !this.masterGain) return;
      if (this.isMuted) return;

      const chord = chordProgressions[chordIdx % chordProgressions.length];
      chordIdx++;
      const now = this.ctx.currentTime;

      chord.forEach((freq, idx) => {
        try {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq * (1 + (idx === 3 ? 0.002 : 0)), now);

          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.02, now + 1.2);
          gain.gain.exponentialRampToValueAtTime(0.0005, now + 4.8);

          osc.connect(gain);
          gain.connect(this.masterGain!);

          osc.start(now);
          osc.stop(now + 4.9);
        } catch {
          // safe
        }
      });
    };

    playChordStep();
    this.bgmIntervalId = window.setInterval(playChordStep, 4500);
  }

  public stopAmbientBgm() {
    this.isBgmPlaying = false;
    if (this.bgmIntervalId) {
      clearInterval(this.bgmIntervalId);
      this.bgmIntervalId = null;
    }
  }
}

export const soundManager = new SoundManager();
