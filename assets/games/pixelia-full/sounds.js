class SoundManager {
  constructor() {
    this.ctx = null;
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone({ type = 'sine', frequency = 440, duration = 0.2, gain = 0.2, attack = 0.01, decay = 0.02 }) {
    this.ensureContext();
    const osc = this.ctx.createOscillator();
    const envelope = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    envelope.gain.value = 0;
    osc.connect(envelope).connect(this.ctx.destination);
    const now = this.ctx.currentTime;
    envelope.gain.linearRampToValueAtTime(gain, now + attack);
    envelope.gain.linearRampToValueAtTime(0.0001, now + duration + decay);
    osc.start(now);
    osc.stop(now + duration + decay + 0.05);
  }

  playFootstep() {
    this.playTone({ type: 'triangle', frequency: 220, duration: 0.05, gain: 0.15 });
  }

  playBlip() {
    this.playTone({ type: 'square', frequency: 660, duration: 0.12, gain: 0.2 });
  }

  playPickup() {
    this.playTone({ type: 'triangle', frequency: 880, duration: 0.2, gain: 0.25 });
  }

  playQuestComplete() {
    this.ensureContext();
    const base = 523;
    [0, 4, 7, 12].forEach((interval, index) => {
      setTimeout(() => {
        this.playTone({ type: 'sine', frequency: base * Math.pow(2, interval / 12), duration: 0.25, gain: 0.22 });
      }, index * 120);
    });
  }

  playNightTone() {
    this.playTone({ type: 'sine', frequency: 80, duration: 1.2, gain: 0.1, attack: 0.2, decay: 0.4 });
  }
}

window.SOUNDS = new SoundManager();
