const SFX = {
  ctx: null,
  master: null,
  noiseBuffer: null,
  enabled: true,
  volume: 0.3,

  loadSettings() {
    try {
      const s = JSON.parse(localStorage.getItem('dragonSoundSettings'));
      if (s) {
        if (typeof s.volume === 'number') this.volume = Math.max(0, Math.min(1, s.volume));
        if (typeof s.enabled === 'boolean') this.enabled = s.enabled;
      }
    } catch(e) {}
  },

  saveSettings() {
    localStorage.setItem('dragonSoundSettings', JSON.stringify({ volume: this.volume, enabled: this.enabled }));
  },

  setVolume(v) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.master) this.master.gain.value = this.volume;
    this.saveSettings();
  },

  setEnabled(on) {
    this.enabled = on;
    this.saveSettings();
  },

  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.volume;
    this.master.connect(this.ctx.destination);
    // Pre-generate white noise buffer (1 second)
    const sr = this.ctx.sampleRate;
    this.noiseBuffer = this.ctx.createBuffer(1, sr, sr);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < sr; i++) data[i] = Math.random() * 2 - 1;
  },

  play(name) {
    if (!this.enabled) return;
    this.init();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const fn = this._sounds[name];
    if (fn) fn.call(this);
  },

  _noise(duration) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = false;
    const t = this.ctx.currentTime;
    src.start(t);
    src.stop(t + duration);
    return src;
  },

  _osc(type, freq, duration) {
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    const t = this.ctx.currentTime;
    osc.start(t);
    osc.stop(t + duration);
    return osc;
  },

  _sounds: {
    // Short footstep - filtered noise burst
    move() {
      const t = this.ctx.currentTime;
      const n = this._noise(0.06);
      const f = this.ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 800;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.15, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
      n.connect(f); f.connect(g); g.connect(this.master);
    },

    // Fire breath whoosh - bandpass swept noise
    fire() {
      const t = this.ctx.currentTime;
      const n = this._noise(0.3);
      const f = this.ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.setValueAtTime(300, t);
      f.frequency.exponentialRampToValueAtTime(2000, t + 0.15);
      f.frequency.exponentialRampToValueAtTime(500, t + 0.3);
      f.Q.value = 2;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.4, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      n.connect(f); f.connect(g); g.connect(this.master);
    },

    // Steam hiss - high-pass noise
    steam() {
      const t = this.ctx.currentTime;
      const n = this._noise(0.25);
      const f = this.ctx.createBiquadFilter();
      f.type = 'highpass';
      f.frequency.value = 3000;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.2, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      n.connect(f); f.connect(g); g.connect(this.master);
    },

    // Torch lighting - sine sweep up + crackle
    torch() {
      const t = this.ctx.currentTime;
      const osc = this._osc('sine', 200, 0.2);
      osc.frequency.exponentialRampToValueAtTime(800, t + 0.15);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.3, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.connect(g); g.connect(this.master);
      // Crackle
      const n = this._noise(0.15);
      const f = this.ctx.createBiquadFilter();
      f.type = 'highpass';
      f.frequency.value = 4000;
      const g2 = this.ctx.createGain();
      g2.gain.setValueAtTime(0.1, t + 0.05);
      g2.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      n.connect(f); f.connect(g2); g2.connect(this.master);
    },

    // Toggle/lever click + blip
    toggle() {
      const t = this.ctx.currentTime;
      const osc = this._osc('square', 600, 0.08);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.2, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      osc.connect(g); g.connect(this.master);
    },

    // Ice melting - high noise burst with pitch drop
    ice() {
      const t = this.ctx.currentTime;
      const n = this._noise(0.2);
      const f = this.ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.setValueAtTime(4000, t);
      f.frequency.exponentialRampToValueAtTime(500, t + 0.2);
      f.Q.value = 3;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.3, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      n.connect(f); f.connect(g); g.connect(this.master);
    },

    // Cracked wall breaking - low noise thump + distortion
    crack() {
      const t = this.ctx.currentTime;
      const n = this._noise(0.2);
      const f = this.ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 600;
      const dist = this.ctx.createWaveShaper();
      const curve = new Float32Array(256);
      for (let i = 0; i < 256; i++) { const x = (i / 128) - 1; curve[i] = x * Math.abs(x); }
      dist.curve = curve;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.35, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      n.connect(f); f.connect(dist); dist.connect(g); g.connect(this.master);
    },

    // Mirror ping - high metallic sine
    mirror() {
      const t = this.ctx.currentTime;
      const osc = this._osc('sine', 2400, 0.1);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.2, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      osc.connect(g); g.connect(this.master);
      // Harmonic
      const osc2 = this._osc('sine', 3600, 0.08);
      const g2 = this.ctx.createGain();
      g2.gain.setValueAtTime(0.1, t);
      g2.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      osc2.connect(g2); g2.connect(this.master);
    },

    // Gate rumble - low filtered noise
    gate() {
      const t = this.ctx.currentTime;
      const n = this._noise(0.2);
      const f = this.ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 300;
      f.Q.value = 2;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.3, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      n.connect(f); f.connect(g); g.connect(this.master);
    },

    // Push block thud - low sine + noise
    push() {
      const t = this.ctx.currentTime;
      const osc = this._osc('sine', 80, 0.1);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.3, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      osc.connect(g); g.connect(this.master);
      const n = this._noise(0.06);
      const f = this.ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 400;
      const g2 = this.ctx.createGain();
      g2.gain.setValueAtTime(0.15, t);
      g2.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
      n.connect(f); f.connect(g2); g2.connect(this.master);
    },

    // Water fill/drain - bubbly noise
    water() {
      const t = this.ctx.currentTime;
      const n = this._noise(0.3);
      const f = this.ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.setValueAtTime(600, t);
      f.frequency.setTargetAtTime(1200, t, 0.1);
      f.Q.value = 5;
      const lfo = this._osc('sine', 8, 0.3);
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = 400;
      lfo.connect(lfoGain);
      lfoGain.connect(f.frequency);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.2, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      n.connect(f); f.connect(g); g.connect(this.master);
    },

    // Win jingle - rising arpeggio
    win() {
      const t = this.ctx.currentTime;
      const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
      notes.forEach((freq, i) => {
        const osc = this._osc('sine', freq, 0.3);
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0, t + i * 0.1);
        g.gain.linearRampToValueAtTime(0.25, t + i * 0.1 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.3);
        osc.connect(g); g.connect(this.master);
      });
    },

    // Death - descending sawtooth buzz
    death() {
      const t = this.ctx.currentTime;
      const osc = this._osc('sawtooth', 400, 0.4);
      osc.frequency.exponentialRampToValueAtTime(80, t + 0.4);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.2, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      osc.connect(g); g.connect(this.master);
    },

    // Dialogue open - soft two-tone chime
    dialogue() {
      const t = this.ctx.currentTime;
      const osc1 = this._osc('triangle', 440, 0.15);
      const g1 = this.ctx.createGain();
      g1.gain.setValueAtTime(0.2, t);
      g1.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc1.connect(g1); g1.connect(this.master);
      const osc2 = this._osc('triangle', 554, 0.15);
      const g2 = this.ctx.createGain();
      g2.gain.setValueAtTime(0, t + 0.06);
      g2.gain.linearRampToValueAtTime(0.18, t + 0.08);
      g2.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc2.connect(g2); g2.connect(this.master);
    },

    // Paper rustling
    paper() {
      const t = this.ctx.currentTime;
      const n = this._noise(0.15);
      const f = this.ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.value = 3000;
      f.Q.value = 1;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.15, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      n.connect(f); f.connect(g); g.connect(this.master);
    },

    // UI click - short blip
    click() {
      const t = this.ctx.currentTime;
      const osc = this._osc('sine', 800, 0.04);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.15, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      osc.connect(g); g.connect(this.master);
    },

    // Belt mechanical whir
    belt() {
      const t = this.ctx.currentTime;
      const osc = this._osc('sawtooth', 150, 0.1);
      const f = this.ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 600;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.12, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      osc.connect(f); f.connect(g); g.connect(this.master);
    },
  }
};
SFX.loadSettings();
