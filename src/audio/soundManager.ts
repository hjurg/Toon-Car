/**
 * Procedural Cartoon Sound Synthesizer using Web Audio API
 * High quality arcade sounds & dynamic multi-instrument racing soundtrack
 * No external asset files needed - runs 100% reliably in any browser!
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private masterGain: GainNode | null = null;

  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;

  private sharedNoiseBuffer: AudioBuffer | null = null;
  private lastDriftTime: number = 0;
  private lastItemBoxTime: number = 0;

  private isMuted: boolean = false;
  private volume: number = 0.70;
  private isMusicPlaying: boolean = false;
  private musicInterval: any = null;

  constructor() {}

  /**
   * Disconnects nodes when audio playback ends to prevent Web Audio memory leaks and GC stalls
   */
  private scheduleCleanup(source: AudioScheduledSourceNode, nodes: (AudioNode | null | undefined)[], stopTime: number) {
    source.stop(stopTime);
    source.onended = () => {
      try {
        source.disconnect();
        for (let i = 0; i < nodes.length; i++) {
          nodes[i]?.disconnect();
        }
      } catch (_) {}
    };
  }

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Gentle, non-piercing SFX level (reduced from 0.85 to 0.38)
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.38, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.26, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      // Pre-generate a 1-second static noise buffer to avoid GC thrashing during races
      const bufferSize = this.ctx.sampleRate * 1.0;
      this.sharedNoiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = this.sharedNoiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      this.startEngineSound();
    } catch (e) {
      console.warn("Web Audio not supported or blocked", e);
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : this.volume, this.ctx.currentTime);
    }
  }

  public toggleMute() {
    this.setMute(!this.isMuted);
    return this.isMuted;
  }

  public getIsMuted() {
    return this.isMuted;
  }

  // --- Engine Sound ---
  private startEngineSound() {
    if (!this.ctx || !this.sfxGain) return;
    try {
      this.engineOsc = this.ctx.createOscillator();
      this.engineGain = this.ctx.createGain();

      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.setValueAtTime(55, this.ctx.currentTime);

      // Lowpass filter to muffle harshness into cartoon purr
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(260, this.ctx.currentTime);

      this.engineGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

      this.engineOsc.connect(filter);
      filter.connect(this.engineGain);
      this.engineGain.connect(this.sfxGain);

      this.engineOsc.start();
    } catch (e) {
      console.warn(e);
    }
  }

  public updateEngine(speedNormalized: number, isAccelerating: boolean) {
    if (!this.ctx || !this.engineOsc || !this.engineGain) return;
    const now = this.ctx.currentTime;
    const baseFreq = 52 + speedNormalized * 115 + (isAccelerating ? 30 : 0);
    this.engineOsc.frequency.setTargetAtTime(baseFreq, now, 0.07);
    const targetVol = 0.03 + speedNormalized * 0.05 + (isAccelerating ? 0.025 : 0);
    this.engineGain.gain.setTargetAtTime(targetVol, now, 0.07);
  }

  // --- Sound Effects ---

  public playCountdown(isGo: boolean = false) {
    this.init();
    this.resume();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = isGo ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(isGo ? 880 : 440, now);
    if (isGo) {
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.35);
    }

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (isGo ? 0.6 : 0.3));

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    this.scheduleCleanup(osc, [gain], now + (isGo ? 0.65 : 0.35));
  }

  public playItemBox() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    if (now - this.lastItemBoxTime < 0.12) return;
    this.lastItemBoxTime = now;

    // Pleasant 4-note cartoon bell chime
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);
      gain.gain.setValueAtTime(0.25, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.22);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + idx * 0.05);
      this.scheduleCleanup(osc, [gain], now + idx * 0.05 + 0.24);
    });
  }

  public playMiniTurbo() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    // Classic crisp Mario Kart style double-spark chime
    [784, 1175, 1568].forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);
      gain.gain.setValueAtTime(0.35, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.3);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + idx * 0.06);
      this.scheduleCleanup(osc, [gain], now + idx * 0.06 + 0.32);
    });
  }

  public playRocketLaunch() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(1050, now + 0.35);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    this.scheduleCleanup(osc, [gain], now + 0.42);
  }

  public playExplosion() {
    this.init();
    if (!this.ctx || !this.sfxGain || !this.sharedNoiseBuffer) return;
    const now = this.ctx.currentTime;

    const noise = this.ctx.createBufferSource();
    noise.buffer = this.sharedNoiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, now);
    filter.frequency.exponentialRampToValueAtTime(45, now + 0.5);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.52);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
    this.scheduleCleanup(noise, [filter, gain], now + 0.55);
  }

  public playTurbo() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(980, now + 0.35);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    this.scheduleCleanup(osc, [gain], now + 0.45);
  }

  public playShield() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(380, now);
    osc.frequency.linearRampToValueAtTime(540, now + 0.2);
    osc.frequency.linearRampToValueAtTime(420, now + 0.38);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + 0.4);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    this.scheduleCleanup(osc, [gain], now + 0.42);
  }

  public playThunder() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // 1. Initial sharp electric zap
    const zap = this.ctx.createOscillator();
    const zapGain = this.ctx.createGain();
    zap.type = 'sawtooth';
    zap.frequency.setValueAtTime(1400, now);
    zap.frequency.exponentialRampToValueAtTime(80, now + 0.25);
    zapGain.gain.setValueAtTime(0.35, now);
    zapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    zap.connect(zapGain);
    zapGain.connect(this.sfxGain);
    zap.start(now);
    this.scheduleCleanup(zap, [zapGain], now + 0.3);

    // 2. Rolling thunder sub-bass rumble
    if (this.sharedNoiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.sharedNoiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(260, now + 0.05);
      filter.frequency.exponentialRampToValueAtTime(35, now + 0.85);

      const rumbleGain = this.ctx.createGain();
      rumbleGain.gain.setValueAtTime(0.3, now + 0.05);
      rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

      noise.connect(filter);
      filter.connect(rumbleGain);
      rumbleGain.connect(this.sfxGain);
      noise.start(now + 0.05);
      this.scheduleCleanup(noise, [filter, rumbleGain], now + 0.95);
    }
  }

  public playSlip() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    // Classic comic squeak / banana slip slide
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(650, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.28);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    this.scheduleCleanup(osc, [gain], now + 0.32);
  }

  public playBlueShell() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    // Ascending alarm siren
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(1320, now + 0.4);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    this.scheduleCleanup(osc, [gain], now + 0.48);
  }

  public playStarFanfare() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    notes.forEach((freq, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.07);
      gain.gain.setValueAtTime(0.22, now + i * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + i * 0.07);
      this.scheduleCleanup(osc, [gain], now + i * 0.07 + 0.27);
    });
  }

  public playBump() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    // Pleasant cartoon soft thud (sine wave instead of harsh square wave)
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(95, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.12);

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    this.scheduleCleanup(osc, [gain], now + 0.14);
  }

  public playBoing() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.16);
    osc.frequency.exponentialRampToValueAtTime(280, now + 0.32);

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.34);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    this.scheduleCleanup(osc, [gain], now + 0.36);
  }

  public playLightning() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(750, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.24);

    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    this.scheduleCleanup(osc, [gain], now + 0.28);
  }

  public playFreezeChime() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    // Crystalline glass-like bell shimmer
    [1046.5, 1318.5, 1567.98, 2093.0].forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);
      gain.gain.setValueAtTime(0.18, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + idx * 0.05);
      this.scheduleCleanup(osc, [gain], now + idx * 0.05 + 0.38);
    });
  }

  public playVortexHum() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    // Deep spatial gravity warp descending sweep
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.45);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    this.scheduleCleanup(osc, [gain], now + 0.52);
  }

  public playPlasmaShot() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    // High-tech sci-fi emerald plasma laser blast
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.28);

    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    this.scheduleCleanup(osc, [gain], now + 0.34);
  }

  public playOilSlick() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    // Wet rubbery cartoon tire slip squeal
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.linearRampToValueAtTime(840, now + 0.12);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.35);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    this.scheduleCleanup(osc, [gain], now + 0.4);
  }

  public playRespawn() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(620, now + 0.28);

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    this.scheduleCleanup(osc, [gain], now + 0.35);
  }

  public playDrift() {
    this.init();
    if (!this.ctx || !this.sfxGain || !this.sharedNoiseBuffer) return;
    const now = this.ctx.currentTime;
    // Throttle drift tire friction sound
    if (now - this.lastDriftTime < 0.22) return;
    this.lastDriftTime = now;

    // Gentle warm tire friction whoosh using pre-allocated noise buffer
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.sharedNoiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(420, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.20);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
    this.scheduleCleanup(noise, [filter, gain], now + 0.21);
  }

  public playHonk() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const freqs = [370, 470];
    freqs.forEach(freq => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      this.scheduleCleanup(osc, [gain], now + 0.3);
    });
  }

  public playWinFanfare() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const fanfare = [
      { f: 523, d: 0.15, t: 0 },
      { f: 523, d: 0.15, t: 0.15 },
      { f: 523, d: 0.15, t: 0.3 },
      { f: 659, d: 0.4, t: 0.45 },
      { f: 783, d: 0.6, t: 0.85 },
      { f: 1046, d: 0.9, t: 1.45 },
    ];
    fanfare.forEach(note => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, now + note.t);
      gain.gain.setValueAtTime(0.3, now + note.t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + note.t + note.d);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + note.t);
      this.scheduleCleanup(osc, [gain], now + note.t + note.d + 0.05);
    });
  }

  // --- Background Music: Energetic Arcade Racing Groove with Drums & Bass ---
  public startMusic() {
    if (this.isMusicPlaying) return;
    this.init();
    this.isMusicPlaying = true;

    // Upbeat chords and bassline pattern
    const bassline = [110, 110, 130.8, 146.8, 110, 110, 164.8, 146.8];
    const melody = [440, 523, 659, 587, 523, 440, 493, 523];
    let step = 0;

    this.musicInterval = setInterval(() => {
      if (!this.ctx || !this.musicGain || !this.isMusicPlaying || this.isMuted) return;
      const now = this.ctx.currentTime;

      // 1. Kick Drum (steps 0, 4)
      if (step % 4 === 0) {
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(140, now);
        kickOsc.frequency.exponentialRampToValueAtTime(38, now + 0.1);
        kickGain.gain.setValueAtTime(0.2, now);
        kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        kickOsc.connect(kickGain);
        kickGain.connect(this.musicGain);
        kickOsc.start(now);
        this.scheduleCleanup(kickOsc, [kickGain], now + 0.14);
      }

      // 2. Snare / Clack (steps 2, 6) - Uses shared pre-allocated noise buffer (zero GC)
      if (step % 4 === 2 && this.sharedNoiseBuffer) {
        const noiseSrc = this.ctx.createBufferSource();
        noiseSrc.buffer = this.sharedNoiseBuffer;

        const snareFilter = this.ctx.createBiquadFilter();
        snareFilter.type = 'highpass';
        snareFilter.frequency.setValueAtTime(900, now);

        const snareGain = this.ctx.createGain();
        snareGain.gain.setValueAtTime(0.12, now);
        snareGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        noiseSrc.connect(snareFilter);
        snareFilter.connect(snareGain);
        snareGain.connect(this.musicGain);
        noiseSrc.start(now);
        this.scheduleCleanup(noiseSrc, [snareFilter, snareGain], now + 0.09);
      }

      // 3. Hi-Hat on offbeats - Uses shared pre-allocated noise buffer (zero GC)
      if (step % 2 === 1 && this.sharedNoiseBuffer) {
        const noiseSrc = this.ctx.createBufferSource();
        noiseSrc.buffer = this.sharedNoiseBuffer;

        const hatFilter = this.ctx.createBiquadFilter();
        hatFilter.type = 'highpass';
        hatFilter.frequency.setValueAtTime(6000, now);

        const hatGain = this.ctx.createGain();
        hatGain.gain.setValueAtTime(0.04, now);
        hatGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

        noiseSrc.connect(hatFilter);
        hatFilter.connect(hatGain);
        hatGain.connect(this.musicGain);
        noiseSrc.start(now);
        this.scheduleCleanup(noiseSrc, [hatFilter, hatGain], now + 0.04);
      }

      // 4. Bass note
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bassOsc.type = 'triangle';
      bassOsc.frequency.setValueAtTime(bassline[step % bassline.length], now);
      bassGain.gain.setValueAtTime(0.14, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      bassOsc.connect(bassGain);
      bassGain.connect(this.musicGain);
      bassOsc.start(now);
      this.scheduleCleanup(bassOsc, [bassGain], now + 0.2);

      // 5. Lead Melody note every other step
      if (step % 2 === 0) {
        const leadOsc = this.ctx.createOscillator();
        const leadGain = this.ctx.createGain();
        leadOsc.type = 'sine';
        leadOsc.frequency.setValueAtTime(melody[(step / 2) % melody.length], now);
        leadGain.gain.setValueAtTime(0.09, now);
        leadGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        leadOsc.connect(leadGain);
        leadGain.connect(this.musicGain);
        leadOsc.start(now);
        this.scheduleCleanup(leadOsc, [leadGain], now + 0.32);
      }

      step++;
    }, 175);
  }

  public stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }
}

export const soundManager = new SoundManager();
