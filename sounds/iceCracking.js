// iceCracking.js
import { SoundGenerator } from './SoundGenerator.js';

export class IceCrackingSound extends SoundGenerator {
    /**
     * Constructor for ice cracking sound effect generator
     * @param {AudioContext} audioCtx - The Web Audio API AudioContext
     * @param {GainNode} masterGain - The master gain node to connect sounds to
     * @param {AudioBuffer} whiteNoiseBuffer - Pre-created white noise buffer
     * @param {Object} params - Configuration parameters for ice sounds
     */
    constructor(audioCtx, masterGain, whiteNoiseBuffer, params = {}) {
        // Initialize parent with base properties
        super(audioCtx, masterGain, {
            iceIntensity: params.iceIntensity || 0,     // Volume and density (0-4)
            iceFractureRate: params.iceFractureRate || 0 // Frequency of cracks (0-4)
        });
        
        this.whiteNoiseBuffer = whiteNoiseBuffer;
    }

    start() {
        if (this.params.iceIntensity <= 0 || this.timeout) return;

        const scheduleCrack = () => {
            const currentTime = this.audioCtx.currentTime;
            const crackInterval = 0.5 + (4 - this.params.iceFractureRate) * 0.5; // 0.5s to 5.5s
            const nextCrackTime = currentTime + crackInterval * (0.5 + Math.random());

            this.scheduleFractalCrack(nextCrackTime);
            this.timeout = setTimeout(scheduleCrack, crackInterval * 1000);
        };

        scheduleCrack();
    }

    // Using parent's stop() method which now handles clearTimeout and node disconnection

    scheduleFractalCrack(startTime) {
        // Primary crack
        const primarySource = this.audioCtx.createBufferSource();
        primarySource.buffer = this.whiteNoiseBuffer;
        const primaryFilter = this.audioCtx.createBiquadFilter();
        primaryFilter.type = 'bandpass';
        primaryFilter.frequency.value = 300 + Math.random() * 300; // 300-600 Hz for deep cracks
        primaryFilter.Q.value = 10;
        const primaryGain = this.audioCtx.createGain();
        const primaryAmplitude = (this.params.iceIntensity / 4) * (0.6 + Math.random() * 0.4);
        primaryGain.gain.setValueAtTime(primaryAmplitude, startTime);
        primaryGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);

        primarySource.connect(primaryFilter).connect(primaryGain).connect(this.masterGain);
        primarySource.start(startTime, Math.random() * this.whiteNoiseBuffer.duration, 0.25);
        this.addActiveNode(primarySource);

        // Fractal secondary cracks (60% chance if intensity > 2)
        if (Math.random() < 0.6 && this.params.iceIntensity > 2) {
            const secondaryDelay = 0.05 + Math.random() * 0.1;
            const secondarySource = this.audioCtx.createBufferSource();
            secondarySource.buffer = this.whiteNoiseBuffer;
            const secondaryFilter = this.audioCtx.createBiquadFilter();
            secondaryFilter.type = 'bandpass';
            secondaryFilter.frequency.value = 500 + Math.random() * 400; // 500-900 Hz
            secondaryFilter.Q.value = 15;
            const secondaryGain = this.audioCtx.createGain();
            const secondaryAmplitude = primaryAmplitude * 0.7;
            secondaryGain.gain.setValueAtTime(secondaryAmplitude, startTime + secondaryDelay);
            secondaryGain.gain.exponentialRampToValueAtTime(0.001, startTime + secondaryDelay + 0.15);

            secondarySource.connect(secondaryFilter).connect(secondaryGain).connect(this.masterGain);
            secondarySource.start(startTime + secondaryDelay, Math.random() * this.whiteNoiseBuffer.duration, 0.2);
            this.addActiveNode(secondarySource);

            // Fractal tertiary cracks (40% chance of secondary if intensity > 2)
            if (Math.random() < 0.4 && this.params.iceIntensity > 2) {
                const tertiaryDelay = secondaryDelay + 0.05 + Math.random() * 0.05;
                const tertiarySource = this.audioCtx.createBufferSource();
                tertiarySource.buffer = this.whiteNoiseBuffer;
                const tertiaryFilter = this.audioCtx.createBiquadFilter();
                tertiaryFilter.type = 'bandpass';
                tertiaryFilter.frequency.value = 700 + Math.random() * 300; // 700-1000 Hz
                tertiaryFilter.Q.value = 20;
                const tertiaryGain = this.audioCtx.createGain();
                const tertiaryAmplitude = secondaryAmplitude * 0.6;
                tertiaryGain.gain.setValueAtTime(tertiaryAmplitude, startTime + tertiaryDelay);
                tertiaryGain.gain.exponentialRampToValueAtTime(0.001, startTime + tertiaryDelay + 0.1);

                tertiarySource.connect(tertiaryFilter).connect(tertiaryGain).connect(this.masterGain);
                tertiarySource.start(startTime + tertiaryDelay, Math.random() * this.whiteNoiseBuffer.duration, 0.15);
                this.addActiveNode(tertiarySource);
            }
        }
    }

    // Using parent's updateParams method with additional logic
    updateParams(newParams) {
        super.updateParams(newParams);
        if (this.timeout) {
            if (this.params.iceIntensity <= 0) {
                this.stop();
            }
        } else if (this.params.iceIntensity > 0) {
            this.start();
        }
    }

    playBurst() {
        const burstDuration = 4; // 4-second burst
        const numCracks = Math.floor(this.params.iceIntensity * 3);
        const currentTime = this.audioCtx.currentTime;
        for (let i = 0; i < numCracks; i++) {
            const crackTime = currentTime + Math.random() * burstDuration;
            this.scheduleFractalCrack(crackTime);
        }
        
        // Set timeout to clean up after the burst finishes (max duration + buffer)
        this.timeout = setTimeout(() => {
            this.stop();
        }, burstDuration * 1000 + 500); // Add 500ms buffer for any delayed cracks
    }
}