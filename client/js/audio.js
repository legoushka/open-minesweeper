// Web Audio API sound synthesizer
const Audio = {
  context: null,
  muted: false,

  init() {
    if (!this.context) {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
    }
    this.muted = Storage.loadMuted();
  },

  play(type) {
    if (this.muted || !this.context) return;

    switch (type) {
      case 'reveal':
        this.playReveal();
        break;
      case 'flag':
        this.playFlag();
        break;
      case 'unflag':
        this.playUnflag();
        break;
      case 'mine':
        this.playMine();
        break;
      case 'win':
        this.playWin();
        break;
      case 'join':
        this.playJoin();
        break;
    }
  },

  playReveal() {
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.context.currentTime);
    gain.gain.setValueAtTime(0.1, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);
    
    osc.connect(gain);
    gain.connect(this.context.destination);
    
    osc.start(this.context.currentTime);
    osc.stop(this.context.currentTime + 0.1);
  },

  playFlag() {
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(400, this.context.currentTime);
    gain.gain.setValueAtTime(0.08, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.15);
    
    osc.connect(gain);
    gain.connect(this.context.destination);
    
    osc.start(this.context.currentTime);
    osc.stop(this.context.currentTime + 0.15);
  },

  playUnflag() {
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(300, this.context.currentTime);
    gain.gain.setValueAtTime(0.08, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.12);
    
    osc.connect(gain);
    gain.connect(this.context.destination);
    
    osc.start(this.context.currentTime);
    osc.stop(this.context.currentTime + 0.12);
  },

  playMine() {
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, this.context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, this.context.currentTime + 0.5);
    gain.gain.setValueAtTime(0.15, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.5);
    
    osc.connect(gain);
    gain.connect(this.context.destination);
    
    osc.start(this.context.currentTime);
    osc.stop(this.context.currentTime + 0.5);
  },

  playWin() {
    const frequencies = [523, 659, 784, 1047]; // C E G C
    frequencies.forEach((freq, i) => {
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.context.currentTime + i * 0.15);
      gain.gain.setValueAtTime(0.1, this.context.currentTime + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + i * 0.15 + 0.3);
      
      osc.connect(gain);
      gain.connect(this.context.destination);
      
      osc.start(this.context.currentTime + i * 0.15);
      osc.stop(this.context.currentTime + i * 0.15 + 0.3);
    });
  },

  playJoin() {
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, this.context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(900, this.context.currentTime + 0.1);
    gain.gain.setValueAtTime(0.08, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.2);
    
    osc.connect(gain);
    gain.connect(this.context.destination);
    
    osc.start(this.context.currentTime);
    osc.stop(this.context.currentTime + 0.2);
  },

  toggle() {
    this.muted = !this.muted;
    Storage.saveMuted(this.muted);
    return this.muted;
  }
};
