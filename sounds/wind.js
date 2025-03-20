import { SoundGenerator } from './SoundGenerator.js';

export class WindSound extends SoundGenerator {
    /**
     * Creates a wind sound generator with variable intensity and turbulence.
     * @param {AudioContext} audioCtx - The Web Audio API AudioContext.
     * @param {GainNode} masterGain - The master gain node to connect sounds to.
     * @param {AudioBuffer} whiteNoiseBuffer - Pre-generated white noise buffer.
     * @param {Object} params - Wind sound configuration parameters.
     * @param {number} params.windLevel - Wind intensity (0-10 scale).
     * @param {number} params.windTurbidity - Wind turbulence/variability (0-10 scale).
     */
    constructor(audioCtx, masterGain, whiteNoiseBuffer, params = {}) {
        // Initialize base class with common parameters
        super(audioCtx, masterGain, {
            windLevel: params.windLevel || 0,
            windTurbidity: params.windTurbidity || 0
        });
        
        this.whiteNoiseBuffer = whiteNoiseBuffer;
        this.windSource = null;
        this.lfo = null;
        this.amplitudeLfo = null;
        this.windGain = null;
        this.modulationGain = null;
        this.amplitudeModGain = null;
        this.previousLfoFrequency = (this.params.windTurbidity / 4) + 1;
        this.isContinuous = false;
        this.whistleTimeout = null;
        this.activeWhistlers = new Set();
    }

    /**
     * Starts the wind sound with the current parameter settings.
     */
    start() {
        if (this.params.windLevel <= 0 || this.windSource) return;

        // Main wind sound
        this.windSource = this.audioCtx.createBufferSource();
        this.windSource.buffer = this.whiteNoiseBuffer;
        this.windSource.loop = true;
        this.addActiveNode(this.windSource); // Track node for automatic cleanup
        
        const windFilter = this.audioCtx.createBiquadFilter();
        windFilter.type = 'lowpass';
        windFilter.frequency.value = 150;
        
        this.windGain = this.audioCtx.createGain();
        this.windGain.gain.value = Math.pow(this.params.windLevel / 4, 2);

        this.lfo = this.audioCtx.createOscillator();
        this.lfo.type = 'sine';
        this.addActiveNode(this.lfo); // Track node for automatic cleanup
        
        const targetFrequency = 0.1 + (this.params.windTurbidity / 4) * (0.9 + Math.random() * 1.5);
        this.lfo.frequency.value = this.previousLfoFrequency;
        this.lfo.frequency.linearRampToValueAtTime(targetFrequency, this.audioCtx.currentTime + 2);
        this.previousLfoFrequency = targetFrequency;

        this.amplitudeLfo = this.audioCtx.createOscillator();
        this.amplitudeLfo.type = 'sine';
        this.amplitudeLfo.frequency.value = this.lfo.frequency.value / (1.0 + 2.0 * Math.random());
        this.addActiveNode(this.amplitudeLfo); // Track node for automatic cleanup
        
        this.amplitudeModGain = this.audioCtx.createGain();
        this.amplitudeModGain.gain.value = (this.params.windLevel / 4) * (this.params.windTurbidity / 4) * 0.5;

        this.modulationGain = this.audioCtx.createGain();
        this.modulationGain.gain.value = 0;

        this.windSource.connect(windFilter).connect(this.windGain).connect(this.masterGain);
        this.lfo.connect(this.modulationGain);
        this.amplitudeLfo.connect(this.amplitudeModGain);
        this.amplitudeModGain.connect(this.modulationGain.gain);
        this.modulationGain.connect(this.windGain.gain);

        this.lfo.start();
        this.amplitudeLfo.start();
        this.windSource.start();

        // Whistle effect
        if (this.params.windLevel > 3) {
            this.scheduleWhistle();
        }
    }

    /**
     * Stops all wind sounds and cleans up resources.
     * Overrides parent stop() to handle additional cleanup.
     */
    stop() {
        if (this.windSource) {
            this.windSource = null;
            this.lfo = null;
            this.amplitudeLfo = null;
            this.windGain = null;
            this.modulationGain = null;
            this.amplitudeModGain = null;
        }
        
        if (this.whistleTimeout) {
            clearTimeout(this.whistleTimeout);
            this.whistleTimeout = null;
        }
        
        this.activeWhistlers.forEach(({ osc, lfo }) => {
            osc.stop();
            if (lfo) lfo.stop();
        });
        this.activeWhistlers.clear();
        
        // Call parent class stop() to handle common cleanup
        super.stop();
    }

    /**
     * Schedules a random wind whistle effect based on wind parameters.
     */
    scheduleWhistle() {
        if (this.params.windLevel <= 3 || !this.isPlaying()) return;

        const currentTime = this.audioCtx.currentTime;
        const whistleInterval = 2 + (10 - this.params.windLevel) * 0.5; // 2s to 4.5s
        const whistleChance = (this.params.windLevel - 3) / 7; // 0 at 3, 1 at 10
        
        if (Math.random() < whistleChance) {
            const whistler = this.audioCtx.createOscillator();
            whistler.type = 'sawtooth';
            const baseFrequency = 1000 + Math.random() * 2000; // 1000-3000 Hz
            whistler.frequency.value = baseFrequency;

            const whistlerGain = this.audioCtx.createGain();
            const amplitude = (this.params.windLevel / 10) * 0.2; // Scale 0-0.2
            whistlerGain.gain.setValueAtTime(0, currentTime);
            whistlerGain.gain.linearRampToValueAtTime(amplitude, currentTime + 0.05);
            whistlerGain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.3 + Math.random() * 0.2);

            // Pitch variation with secondary LFO
            const whistleLfo = this.audioCtx.createOscillator();
            whistleLfo.type = 'sine';
            whistleLfo.frequency.value = 1 + this.params.windTurbidity * 0.5; // 1-6 Hz based on turbidity
            const whistleModGain = this.audioCtx.createGain();
            whistleModGain.gain.value = (this.params.windLevel / 10) * 200; // Modulation depth 0-200 Hz

            whistler.connect(whistlerGain).connect(this.masterGain);
            whistleLfo.connect(whistleModGain).connect(whistler.frequency); // Modulate pitch

            whistler.start(currentTime);
            whistleLfo.start(currentTime);
            const stopTime = currentTime + 0.5 + Math.random() * 0.2;
            whistler.stop(stopTime);
            whistleLfo.stop(stopTime);

            const whistlerInstance = { osc: whistler, lfo: whistleLfo };
            this.activeWhistlers.add(whistlerInstance);
            whistler.onended = () => {
                this.activeWhistlers.delete(whistlerInstance);
                whistleLfo.disconnect();
            };
        }

        this.timeout = setTimeout(() => this.scheduleWhistle(), whistleInterval * 1000);
        this.whistleTimeout = this.timeout; // Keep track of both references
    }

    /**
     * Updates sound parameters with new values.
     * @param {Object} newParams - New parameters to update.
     */
    updateParams(newParams) {
        // Call parent updateParams to merge parameters
        super.updateParams(newParams);
        
        if (this.windSource) {
            if (this.params.windLevel <= 0) {
                this.stop();
            } else {
                this.windGain.gain.value = Math.pow(this.params.windLevel / 4, 2);
                this.amplitudeModGain.gain.value = (this.params.windLevel / 4) * (this.params.windTurbidity / 4) * 0.5;
                const targetFrequency = 0.1 + (this.params.windTurbidity / 4) * (0.9 + Math.random() * 1.5);
                this.lfo.frequency.linearRampToValueAtTime(targetFrequency, this.audioCtx.currentTime + 2);
                this.previousLfoFrequency = targetFrequency;

                // Manage whistle based on new windLevel
                if (this.params.windLevel > 3 && !this.whistleTimeout) {
                    this.scheduleWhistle();
                } else if (this.params.windLevel <= 3 && this.whistleTimeout) {
                    clearTimeout(this.whistleTimeout);
                    this.whistleTimeout = null;
                    this.timeout = null;
                    this.activeWhistlers.forEach(({ osc, lfo }) => {
                        osc.stop();
                        if (lfo) lfo.stop();
                    });
                    this.activeWhistlers.clear();
                }
            }
        } else if (this.params.windLevel > 0 && this.isContinuous) {
            this.start();
        }
    }

    /**
     * Plays a short burst of wind sound.
     */
    playBurst() {
        this.start();
        this.timeout = setTimeout(() => this.stop(), 2000);
    }

    /**
     * Checks if the wind sound is currently playing.
     * @returns {boolean} True if the sound is playing.
     */
    isPlaying() {
        return !!this.windSource;
    }
}