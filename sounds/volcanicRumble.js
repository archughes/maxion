// volcanicRumble.js
import { SoundGenerator } from './SoundGenerator.js';

export class VolcanicRumbleSound extends SoundGenerator {
    /**
     * Constructor for volcanic rumble sound generator
     * @param {AudioContext} audioCtx - The Web Audio API AudioContext
     * @param {GainNode} masterGain - The master gain node
     * @param {AudioBuffer} whiteNoiseBuffer - Pre-created white noise buffer
     * @param {Object} params - Sound configuration parameters
     */
    constructor(audioCtx, masterGain, whiteNoiseBuffer, params = {}) {
        // Pass common parameters to parent class
        super(audioCtx, masterGain, {
            rumbleIntensity: params.rumbleIntensity || 0,
            ventActivity: params.ventActivity || 0
        });
        
        this.whiteNoiseBuffer = whiteNoiseBuffer;
        this.rumbleSource = null;
        this.rumbleGain = null;
        this.lowpassFilter = null;
        this.modulationOsc = null;
        this.modulationGain = null;
        this.ventTimeout = null;
        this.activeVentSources = new Set();
        this.isPlaying = false;
    }

    /**
     * Starts the continuous volcanic rumble sound
     */
    start() {
        if (this.params.rumbleIntensity <= 0 || this.isPlaying) return;

        // Base rumble sound
        this.rumbleSource = this.audioCtx.createBufferSource();
        this.rumbleSource.buffer = this.whiteNoiseBuffer;
        this.rumbleSource.loop = true;

        this.lowpassFilter = this.audioCtx.createBiquadFilter();
        this.lowpassFilter.type = 'lowpass';
        this.lowpassFilter.frequency.value = 100 + this.params.rumbleIntensity * 22; // 100-200 Hz

        this.rumbleGain = this.audioCtx.createGain();
        this.rumbleGain.gain.value = this.params.rumbleIntensity / 8; // Scale 0-4 to 0-0.5

        // Modulation for subtle pulsing
        this.modulationOsc = this.audioCtx.createOscillator();
        this.modulationOsc.type = 'sine';
        this.modulationOsc.frequency.value = 0.1 + this.params.rumbleIntensity * 0.05; // 0.1-0.6 Hz
        this.modulationGain = this.audioCtx.createGain();
        this.modulationGain.gain.value = this.params.rumbleIntensity / 40; // Subtle effect

        this.rumbleSource.connect(this.lowpassFilter)
                         .connect(this.rumbleGain);
        this.modulationOsc.connect(this.modulationGain);
        this.modulationGain.connect(this.rumbleGain.gain);
        this.rumbleGain.connect(this.masterGain);

        // Add nodes to activeNodes for tracking
        this.addActiveNode(this.rumbleSource);
        this.addActiveNode(this.modulationOsc);

        this.modulationOsc.start();
        this.rumbleSource.start();
        this.isPlaying = true;

        // Start vent activity if ventActivity > 0
        if (this.params.ventActivity > 0) {
            this.scheduleVent();
        }
    }

    /**
     * Stops all sounds and cleans up resources
     */
    stop() {
        // Stop parent class nodes
        super.stop();
        
        // Reset instance variables
        this.rumbleSource = null;
        this.rumbleGain = null;
        this.lowpassFilter = null;
        this.modulationOsc = null;
        this.modulationGain = null;
        this.isPlaying = false;
        
        // Clear vent timeout (already cleared in super.stop() since it sets this.timeout)
        this.ventTimeout = null;
        this.activeVentSources.clear();
    }

    /**
     * Schedules vent sounds based on vent activity
     */
    scheduleVent() {
        if (this.params.ventActivity <= 0 || !this.isPlaying) return;
    
        const currentTime = this.audioCtx.currentTime;
        const ventInterval = 1 + (4 - this.params.ventActivity) * 1.25; // 1-6s
        const ventDuration = 0.1 + Math.random() * 0.2; // 0.1-0.3s
    
        const ventSource = this.audioCtx.createBufferSource();
        ventSource.buffer = this.whiteNoiseBuffer;
        const ventFilter = this.audioCtx.createBiquadFilter();
        ventFilter.type = 'bandpass';
        ventFilter.frequency.value = 1500 + Math.random() * 500; // 1500-2000 Hz
        ventFilter.Q.value = 5 + Math.random() * 5; // Vary resonance
    
        const ventGain = this.audioCtx.createGain();
        const amplitude = (this.params.ventActivity / 4) * 0.6;
        ventGain.gain.setValueAtTime(amplitude, currentTime);
        ventGain.gain.exponentialRampToValueAtTime(0.001, currentTime + ventDuration);
    
        ventSource.connect(ventFilter).connect(ventGain).connect(this.masterGain);
        ventSource.start(currentTime, Math.random() * this.whiteNoiseBuffer.duration, ventDuration);
        
        // Add to active nodes set for tracking
        this.addActiveNode(ventSource);
        this.activeVentSources.add(ventSource);
        ventSource.onended = () => {
            this.activeNodes.delete(ventSource);
            this.activeVentSources.delete(ventSource);
        };
    
        // Store timeout in parent class timeout property for proper cleanup
        this.timeout = setTimeout(() => this.scheduleVent(), ventInterval * 1000);
    }

    /**
     * Updates parameters with real-time changes to sound
     * @param {Object} newParams - New parameters to apply
     */
    updateParams(newParams) {
        // Use parent class method for updating parameters
        super.updateParams(newParams);
        
        if (this.isPlaying) {
            if (this.params.rumbleIntensity <= 0) {
                this.stop();
            } else {
                this.rumbleGain.gain.value = this.params.rumbleIntensity / 20;
                this.lowpassFilter.frequency.value = 100 + this.params.rumbleIntensity * 10;
                this.modulationOsc.frequency.value = 0.1 + this.params.rumbleIntensity * 0.05;
                this.modulationGain.gain.value = this.params.rumbleIntensity / 40;

                if (this.params.ventActivity > 0 && !this.timeout) {
                    this.scheduleVent();
                } else if (this.params.ventActivity <= 0 && this.timeout) {
                    clearTimeout(this.timeout);
                    this.timeout = null;
                    this.activeVentSources.forEach(source => source.stop());
                    this.activeVentSources.clear();
                }
            }
        } else if (this.params.rumbleIntensity > 0) {
            this.start();
        }
    }

    /**
     * Plays a short burst of the volcanic rumble sound
     */
    playBurst() {
        this.start();
        // Set a 5-second timeout for the burst duration
        this.timeout = setTimeout(() => this.stop(), 5000);
    }
}