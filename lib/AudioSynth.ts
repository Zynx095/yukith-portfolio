"use client";

class AudioSynth {
  private ctx: AudioContext | null = null;
  private droneOsc: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;
  private initialized = false;
  private audioEnabled = false;

  constructor() {}

  public init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Setup persistent drone (starts silent)
      this.droneOsc = this.ctx.createOscillator();
      this.droneGain = this.ctx.createGain();
      
      this.droneOsc.type = 'sine';
      this.droneOsc.frequency.setValueAtTime(50, this.ctx.currentTime); // Low sub bass
      
      this.droneGain.gain.setValueAtTime(0, this.ctx.currentTime);
      
      this.droneOsc.connect(this.droneGain);
      this.droneGain.connect(this.ctx.destination);
      
      this.droneOsc.start();
      
      this.initialized = true;
      this.audioEnabled = true;
    } catch (e) {
      console.error("Web Audio API not supported", e);
    }
  }

  public setEnabled(enabled: boolean) {
    this.audioEnabled = enabled;
    if (enabled && !this.initialized) {
      this.init();
    }
  }

  // Soft wooden click / pop for hover
  public playHover() {
    if (!this.audioEnabled || !this.ctx) return;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  // Object activation chime
  public playActivation() {
    if (!this.audioEnabled || !this.ctx) return;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(1200, this.ctx.currentTime + 0.5);
    
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.1, this.ctx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 1.5);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 1.5);
  }

  // Modulate drone volume based on scroll velocity (simulating wind/movement)
  public updateScrollVelocity(velocity: number) {
    if (!this.audioEnabled || !this.ctx || !this.droneGain) return;
    
    const targetGain = Math.min(Math.abs(velocity) * 0.05, 0.1); // Max volume 0.1
    this.droneGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.2); // Smooth lerp
  }
}

export const synth = new AudioSynth();
