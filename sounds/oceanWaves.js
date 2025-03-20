// oceanWaves.js
import { SoundGenerator } from './SoundGenerator.js';

export class OceanWavesSound extends SoundGenerator {
    /**
     * Constructor for ocean waves sound effect generator
     * @param {AudioContext} audioCtx - The Web Audio API AudioContext
     * @param {GainNode} masterGain - The master gain node to connect sounds to
     * @param {AudioBuffer} whiteNoiseBuffer - Pre-created white noise buffer
     * @param {Object} params - Configuration parameters for wave sounds
     */
    constructor(audioCtx, masterGain, whiteNoiseBuffer, params = {}) {
        // Initialize parent with base properties
        super(audioCtx, masterGain, {
            waveIntensity: params.waveIntensity || 0,
            waveFrequency: params.waveFrequency || 0
        });
        
        this.whiteNoiseBuffer = whiteNoiseBuffer;
        this.waveSource = null;
        this.waveGain = null;
        this.filter = null;
        this.isPlaying = false;
    }

    start() {
        if (this.params.waveIntensity <= 0 || this.isPlaying) return;
        
        this.waveSource = this.audioCtx.createBufferSource();
        this.waveSource.buffer = this.whiteNoiseBuffer;
        this.waveSource.loop = true;

        this.filter = this.audioCtx.createBiquadFilter();
        this.filter.type = 'lowpass';
        this.filter.frequency.value = 200 + this.params.waveFrequency * 50;

        this.waveGain = this.audioCtx.createGain();
        this.waveGain.gain.value = 0;

        this.waveSource.connect(this.filter).connect(this.waveGain).connect(this.masterGain);
        this.waveSource.start();
        
        // Add all active nodes to the tracking system
        this.addActiveNode(this.waveSource);
        this.addActiveNode(this.filter);
        this.addActiveNode(this.waveGain);
        
        this.isPlaying = true;
        this.scheduleWaveCycle();
    }

    stop() {
        // Use the parent's stop method which handles node disconnection
        super.stop();
        this.isPlaying = false;
        this.waveSource = null;
        this.filter = null;
        this.waveGain = null;
    }

    scheduleWaveCycle() {
        if (!this.isPlaying) return;
        const period = 8 + Math.random() * 4; // 8-12s
        const now = this.audioCtx.currentTime;
        const isBigWave = Math.random() > 0.5;

        if (isBigWave) {
            // Big wave: ramp up, crash burst, then extended silence.
            const t0 = now;
            const t1 = t0 + period * 0.3;    // ramp-up to mid amplitude
            const t2 = t0 + period * 0.35;   // start crash burst
            const t3 = t0 + period * 0.45;   // end crash burst (smoothed over 0.1s+)
            const tEnd = t0 + period;
            const midGain = this.params.waveIntensity / 4;
            const crashGain = midGain * 1.8;
            const lowFreq = 200 + this.params.waveFrequency * 50;
            const highFreq = 200 + this.params.waveFrequency * 100;
            const crashFreq = 200 + this.params.waveFrequency * 200;

            this.waveGain.gain.cancelScheduledValues(t0);
            this.filter.frequency.cancelScheduledValues(t0);
            // Ramp up
            this.waveGain.gain.setValueAtTime(0, t0);
            this.waveGain.gain.linearRampToValueAtTime(midGain, t1);
            this.filter.frequency.setValueAtTime(lowFreq, t0);
            this.filter.frequency.linearRampToValueAtTime(highFreq, t1);
            // Crash burst with smooth transitions
            this.waveGain.gain.linearRampToValueAtTime(crashGain, t2);
            this.waveGain.gain.linearRampToValueAtTime(0, t3 + 0.15); // extended ramp to avoid pop
            this.filter.frequency.linearRampToValueAtTime(crashFreq, t2);
            this.filter.frequency.linearRampToValueAtTime(lowFreq, t3 + 0.15);
            // Hold silence until cycle end
            this.waveGain.gain.setValueAtTime(0, tEnd);
        } else {
            // Small wave: gentle bump without a crash.
            const t0 = now;
            const t1 = t0 + period * 0.3;
            const t2 = t0 + period * 0.6;
            const tEnd = t0 + period;
            const smallGain = this.params.waveIntensity / 8;
            const lowFreq = 200 + this.params.waveFrequency * 50;
            const highFreq = 200 + this.params.waveFrequency * 80;

            this.waveGain.gain.cancelScheduledValues(t0);
            this.filter.frequency.cancelScheduledValues(t0);
            this.waveGain.gain.setValueAtTime(0, t0);
            this.waveGain.gain.linearRampToValueAtTime(smallGain, t1);
            this.waveGain.gain.linearRampToValueAtTime(0, t2);
            this.filter.frequency.setValueAtTime(lowFreq, t0);
            this.filter.frequency.linearRampToValueAtTime(highFreq, t1);
            this.filter.frequency.linearRampToValueAtTime(lowFreq, t2);
            this.waveGain.gain.setValueAtTime(0, tEnd);
        }
        
        const delay = (now + period - this.audioCtx.currentTime) * 1000;
        // Use the parent's timeout tracking
        this.timeout = setTimeout(() => this.scheduleWaveCycle(), delay);
    }

    // Use parent's updateParams with additional logic
    updateParams(newParams) {
        super.updateParams(newParams);
        if (this.isPlaying) {
            if (this.params.waveIntensity <= 0) {
                this.stop();
            } else if (this.filter && this.waveGain) {
                this.filter.frequency.value = 200 + this.params.waveFrequency * 50;
                this.waveGain.gain.value = 0;
            }
        } else if (this.params.waveIntensity > 0) {
            this.start();
        }
    }

    playBurst() {
        // Start with a wave cycle that will play for 5 seconds
        this.start();
        // Set timeout to stop after one complete wave cycle (approx. 8-12s)
        this.timeout = setTimeout(() => this.stop(), 10000); // Use average wave cycle time
    }
}