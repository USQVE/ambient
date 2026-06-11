// Генератор звуков без внешних файлов
export class SoundGenerator {
  private audioCtx: AudioContext | null = null;

  private getContext(): AudioContext {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioCtx;
  }

  // Звук перелистывания страницы (короткий шорох)
  playPageFlip() {
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

    const noise = ctx.createBufferSource();
    const bufferSize = 4096;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    noise.buffer = buffer;
    noise.connect(gain);
    noise.start();
    noise.stop(now + 0.3);
  }

  // Звук резонанса (растущий тон) — при повышении функционала
  playResonance(intensity: number = 0.5) {
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 200 + intensity * 400;
    gain.gain.setValueAtTime(0.1 * intensity, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(now + 0.8);
  }

  // Фоновый гул (атмосферный дрон) — запускается при смене атмосферы, играет бесконечно
  private droneGain: GainNode | null = null;
  private droneOsc: OscillatorNode | null = null;
  private droneStarted = false;

  startAmbientDrone() {
    if (this.droneStarted) return;
    const ctx = this.getContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 80;
    gain.gain.value = 0.05;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    this.droneOsc = osc;
    this.droneGain = gain;
    this.droneStarted = true;
  }

  stopAmbientDrone() {
    if (this.droneGain) {
      const now = this.audioCtx?.currentTime || 0;
      this.droneGain.gain.exponentialRampToValueAtTime(0.0001, now + 1);
      setTimeout(() => {
        this.droneOsc?.stop();
        this.droneOsc = null;
        this.droneGain = null;
        this.droneStarted = false;
      }, 1000);
    }
  }

  setDroneVolume(volume: number) {
    if (this.droneGain) this.droneGain.gain.value = Math.min(0.2, Math.max(0, volume * 0.1));
  }
}

export const soundGenerator = new SoundGenerator();
