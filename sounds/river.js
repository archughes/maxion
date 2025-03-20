import { SoundGenerator } from './SoundGenerator.js';

export class RiverSound extends SoundGenerator {
    constructor(audioCtx, masterGain, params = {}) {
        super(audioCtx, masterGain, {
            riverIntensity: params.riverIntensity || 2,
            riverWidth: params.riverWidth || 2,
            riverSpeed: params.riverSpeed || 2
        });
        this.isPlaying = false;
    }

    start() {
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.playContinuousRiver();
    }

    stop() {
        if (!this.isPlaying) return;
        this.isPlaying = false;
        super.stop(); // Inherited stop method handles node cleanup
    }

    playBurst() {
        const currentTime = this.audioCtx.currentTime;
        this.createRiverBurst(currentTime);
        // Timeout based on max burst duration (~2s for high intensity/speed)
        this.timeout = setTimeout(() => this.stop(), 2000);
    }

    playContinuousRiver() {
        if (!this.isPlaying) return;
        const currentTime = this.audioCtx.currentTime;
        this.createRiverFlow(currentTime, 5); // 5-second segments for continuous play
        setTimeout(() => this.playContinuousRiver(), 4500); // Overlap segments slightly
    }

    createRiverFlow(startTime, duration) {
        const baseNoise = this.audioCtx.createBufferSource();
        baseNoise.buffer = this.createNoiseBuffer(duration);
        baseNoise.loop = false;

        const lowFilter = this.audioCtx.createBiquadFilter();
        lowFilter.type = 'lowpass';
        lowFilter.frequency.value = 400 + (this.params.riverIntensity * 100);
        lowFilter.Q.value = 1;

        const midFilter = this.audioCtx.createBiquadFilter();
        midFilter.type = 'bandpass';
        midFilter.frequency.value = 1000 + (this.params.riverWidth * 200);
        midFilter.Q.value = 2;

        const flowGain = this.audioCtx.createGain();
        const baseVolume = 0.1 + (this.params.riverIntensity * 0.05);
        flowGain.gain.setValueAtTime(baseVolume * 0.8, startTime);
        flowGain.gain.linearRampToValueAtTime(baseVolume, startTime + 0.5);
        flowGain.gain.linearRampToValueAtTime(baseVolume * 0.9, startTime + duration - 0.5);

        baseNoise.connect(lowFilter).connect(flowGain);
        baseNoise.connect(midFilter).connect(flowGain);
        flowGain.connect(this.masterGain);

        const bubbleCount = Math.floor(this.params.riverSpeed * 5);
        for (let i = 0; i < bubbleCount; i++) {
            const bubbleTime = startTime + (Math.random() * duration);
            this.createBubble(bubbleTime);
        }

        baseNoise.start(startTime);
        baseNoise.stop(startTime + duration);
        this.addActiveNode(baseNoise);
    }

    createBubble(startTime) {
        const bubbleOsc = this.audioCtx.createOscillator();
        bubbleOsc.type = 'sine';
        const baseFreq = 200 + (this.params.riverSpeed * 50);
        bubbleOsc.frequency.setValueAtTime(baseFreq, startTime);
        bubbleOsc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, startTime + 0.2);

        const bubbleGain = this.audioCtx.createGain();
        const bubbleVolume = 0.05 + (this.params.riverIntensity * 0.02);
        bubbleGain.gain.setValueAtTime(0, startTime);
        bubbleGain.gain.linearRampToValueAtTime(bubbleVolume, startTime + 0.05);
        bubbleGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);

        bubbleOsc.connect(bubbleGain).connect(this.masterGain);
        bubbleOsc.start(startTime);
        bubbleOsc.stop(startTime + 0.2);
        this.addActiveNode(bubbleOsc);
    }

    createRiverBurst(startTime) {
        const burstNoise = this.audioCtx.createBufferSource();
        burstNoise.buffer = this.createNoiseBuffer(2);
        
        const burstFilter = this.audioCtx.createBiquadFilter();
        burstFilter.type = 'bandpass';
        burstFilter.frequency.value = 800 + (this.params.riverWidth * 300);
        burstFilter.Q.value = 1.5;

        const burstGain = this.audioCtx.createGain();
        const burstVolume = 0.15 + (this.params.riverIntensity * 0.1);
        burstGain.gain.setValueAtTime(0, startTime);
        burstGain.gain.linearRampToValueAtTime(burstVolume, startTime + 0.3);
        burstGain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.5 + (this.params.riverSpeed * 0.2));

        burstNoise.connect(burstFilter).connect(burstGain).connect(this.masterGain);
        burstNoise.start(startTime);
        burstNoise.stop(startTime + 2);
        this.addActiveNode(burstNoise);

        const splashCount = Math.floor(this.params.riverSpeed * 3);
        for (let i = 0; i < splashCount; i++) {
            const splashTime = startTime + (Math.random() * 1.5);
            this.createSplash(splashTime);
        }
    }

    createSplash(startTime) {
        const splashNoise = this.audioCtx.createBufferSource();
        splashNoise.buffer = this.createNoiseBuffer(0.5);

        const splashFilter = this.audioCtx.createBiquadFilter();
        splashFilter.type = 'highpass';
        splashFilter.frequency.value = 2000 + (this.params.riverIntensity * 500);

        const splashGain = this.audioCtx.createGain();
        const splashVolume = 0.1 + (this.params.riverSpeed * 0.05);
        splashGain.gain.setValueAtTime(0, startTime);
        splashGain.gain.linearRampToValueAtTime(splashVolume, startTime + 0.1);
        splashGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

        splashNoise.connect(splashFilter).connect(splashGain).connect(this.masterGain);
        splashNoise.start(startTime);
        splashNoise.stop(startTime + 0.5);
        this.addActiveNode(splashNoise);
    }
}