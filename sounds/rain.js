// rain.js
import { SoundGenerator } from './SoundGenerator.js';

export class RainSound extends SoundGenerator {
    /**
     * Constructor for rain sound generator
     * @param {AudioContext} audioCtx - The Web Audio API AudioContext
     * @param {GainNode} masterGain - The master gain node
     * @param {AudioBuffer} whiteNoiseBuffer - Pre-created white noise buffer
     * @param {Object} params - Sound configuration parameters
     */
    constructor(audioCtx, masterGain, whiteNoiseBuffer, params = {}) {
        // Pass common parameters to parent class
        super(audioCtx, masterGain, {
            rainDensity: params.rainDensity || 0,
            rainSpeed: params.rainSpeed || 0,
            raindropSize: params.raindropSize || 0,
            surfaceType: params.surfaceType || 'metal'
        });
        
        this.whiteNoiseBuffer = whiteNoiseBuffer;
        this.waterNodes = new Set();
    }

    /**
     * Starts the continuous rain sound
     */
    start() {
        if (this.params.rainDensity <= 0 || this.params.rainSpeed <= 0 || 
            this.params.raindropSize <= 0 || this.timeout) return;

        const scheduleInterval = 2000;
        const burstDuration = 2;

        const scheduler = () => {
            const currentTime = this.audioCtx.currentTime;
            const numDrops = Math.floor(this.params.rainDensity * 10);
            for (let i = 0; i < numDrops; i++) {
                const dropTime = currentTime + Math.random() * burstDuration;
                this.scheduleRaindrop(dropTime);
            }
            this.timeout = setTimeout(scheduler, scheduleInterval);
        };
        scheduler();
    }

    /**
     * Stops the rain sound and cleans up resources
     */
    stop() {
        // Stop parent class audio nodes
        super.stop();
        
        // Clean up water nodes
        this.waterNodes.forEach(node => {
            if (node instanceof GainNode) node.gain.setValueAtTime(0, this.audioCtx.currentTime);
            node.disconnect();
        });
        this.waterNodes.clear();
    }

    /**
     * Schedules a single raindrop sound
     * @param {number} startTime - When to start the raindrop sound
     */
    scheduleRaindrop(startTime) {
        const source = this.audioCtx.createBufferSource();
        source.buffer = this.whiteNoiseBuffer;
        const filter = this.audioCtx.createBiquadFilter();
        const gain = this.audioCtx.createGain();
        let decayTime;
        const amplitude = 0.8 + this.params.raindropSize * 0.4;

        switch (this.params.surfaceType) {
            case 'metal':
                filter.type = 'bandpass';
                filter.frequency.value = 1000 - this.params.raindropSize * 100;
                filter.Q.value = 10;
                decayTime = 0.1 + this.params.raindropSize * 0.05;
                break;
            case 'grass':
                filter.type = 'lowpass';
                filter.frequency.value = 150 - this.params.raindropSize * 20;
                filter.Q.value = 0.3;
                decayTime = 0.05 + this.params.raindropSize * 0.03;
                break;
            case 'water':
                filter.type = 'bandpass';
                filter.frequency.value = 300 - this.params.raindropSize * 40;
                filter.Q.value = 2;
                decayTime = 0.1 + this.params.raindropSize * 0.05;

                const delay = this.audioCtx.createDelay(0.5);
                const feedback = this.audioCtx.createGain();
                feedback.gain.value = 0.1 + this.params.raindropSize * 0.03;
                const wetGain = this.audioCtx.createGain();
                wetGain.gain.value = 0.2 + this.params.raindropSize * 0.1;
                delay.delayTime.value = 0.03 + this.params.raindropSize * 0.02;

                source.connect(filter);
                filter.connect(delay);
                delay.connect(feedback);
                feedback.connect(delay);
                delay.connect(wetGain);
                filter.connect(gain);
                wetGain.connect(this.masterGain);
                gain.connect(this.masterGain);

                // Add water effect nodes to waterNodes set
                this.waterNodes.add(delay);
                this.waterNodes.add(feedback);
                this.waterNodes.add(wetGain);
                
                // Add source to activeNodes for tracking
                this.addActiveNode(source);
                source.onended = () => {
                    this.activeNodes.delete(source);
                    this.waterNodes.delete(delay);
                    this.waterNodes.delete(feedback);
                    this.waterNodes.delete(wetGain);
                };
                break;
            case 'wood':
                filter.type = 'bandpass';
                filter.frequency.value = 300 - this.params.raindropSize * 50;
                filter.Q.value = 5;
                decayTime = 0.08 + this.params.raindropSize * 0.02;
                break;
            case 'concrete':
                filter.type = 'lowpass';
                filter.frequency.value = 600 - this.params.raindropSize * 50;
                filter.Q.value = 1.0;
                decayTime = 0.08 + this.params.raindropSize * 0.03;
                break;
            case 'glass':
                filter.type = 'bandpass';
                filter.frequency.value = 1200 - this.params.raindropSize * 150;
                filter.Q.value = 15;
                decayTime = 0.12 + this.params.raindropSize * 0.03;
                break;
            default:
                filter.type = 'lowpass';
                filter.frequency.value = 500;
                filter.Q.value = 1;
                decayTime = 0.02;
        }

        // Adjust decay time based on rain speed
        decayTime *= (1 - (this.params.rainSpeed / 4) * 0.5);
        
        // Standard connection for most surface types
        if (this.params.surfaceType !== 'water') {
            source.connect(filter).connect(gain).connect(this.masterGain);
        }
        
        const attackTime = 0.005;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(amplitude, startTime + attackTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + decayTime);
        const offset = Math.random() * this.whiteNoiseBuffer.duration;
        source.start(startTime, offset, decayTime);
        
        // Add to activeNodes for tracking (if not water type, which is handled separately)
        if (this.params.surfaceType !== 'water') {
            this.addActiveNode(source);
        }
    }

    /**
     * Updates parameters with new values
     * @param {Object} newParams - New parameters to apply
     */
    updateParams(newParams) {
        // Use parent class method for updating parameters
        super.updateParams(newParams);
    }

    /**
     * Plays a short burst of rain drops
     */
    playBurst() {
        if (this.params.rainDensity <= 0 || this.params.rainSpeed <= 0 || this.params.raindropSize <= 0) return;
        
        const burstDuration = 2;
        const currentTime = this.audioCtx.currentTime;
        const numDrops = Math.floor(this.params.rainDensity * 10);
        
        for (let i = 0; i < numDrops; i++) {
            const dropTime = currentTime + Math.random() * burstDuration;
            this.scheduleRaindrop(dropTime);
        }
        
        // Set timeout for cleanup after the burst duration plus some margin
        // for the last raindrop sounds to finish
        this.timeout = setTimeout(() => {
            // Clear timeout but don't stop active sounds - let them play out naturally
            this.timeout = null;
        }, (burstDuration + 1) * 1000);
    }
}