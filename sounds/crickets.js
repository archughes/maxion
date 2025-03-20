import { SoundGenerator } from './SoundGenerator.js';

export class CricketsSound extends SoundGenerator {
    /**
     * Creates a cricket sounds generator with variable density and speed.
     * @param {AudioContext} audioCtx - The Web Audio API AudioContext.
     * @param {GainNode} masterGain - The master gain node to connect sounds to.
     * @param {Object} params - Cricket sound configuration parameters.
     * @param {number} params.cricketDensity - Number of crickets (0-4 scale).
     * @param {number} params.cricketSpeed - Chirp rate (0-4 scale).
     */
    constructor(audioCtx, masterGain, params = {}) {
        // Initialize base class with common parameters
        super(audioCtx, masterGain, {
            cricketDensity: params.cricketDensity || 0,
            cricketSpeed: params.cricketSpeed || 0
        });
        
        this.chirpTimeout = null;
    }

    /**
     * Starts continuous cricket sounds with the current parameter settings.
     */
    start() {
        if (this.params.cricketDensity <= 0 || this.timeout) return;
    
        const scheduleChirp = () => {
            const currentTime = this.audioCtx.currentTime;
            const chirpInterval = 0.3 + (4 - this.params.cricketSpeed) * 0.2; // 0.3-1.1s
            const nextChirpTime = currentTime + chirpInterval * (0.5 + Math.random());
    
            this.scheduleChirp(nextChirpTime);
            this.timeout = setTimeout(scheduleChirp, chirpInterval * 1000);
            this.chirpTimeout = this.timeout; // Keep track of both references
        };
    
        scheduleChirp();
    }

    /**
     * Stops all cricket sounds and cleans up resources.
     * Overrides parent stop() to handle specific cleanup.
     */
    stop() {
        this.chirpTimeout = null;
        // Call parent class stop() to handle common cleanup
        super.stop();
    }

    /**
     * Schedules a single cricket chirp at the specified time.
     * @param {number} startTime - The time to start the chirp, in seconds.
     */
    scheduleChirp(startTime) {
        const baseFreq = 4000 + Math.random() * 4000; // 4000-8000 Hz
        const amplitude = this.params.cricketDensity / 12;
    
        // First chirp
        const osc1 = this.audioCtx.createOscillator();
        osc1.type = 'sine'; // Tonal, less harsh than sawtooth
        osc1.frequency.value = baseFreq;
        this.addActiveNode(osc1); // Track node for automatic cleanup
    
        const gain1 = this.audioCtx.createGain();
        gain1.gain.setValueAtTime(0, startTime);
        gain1.gain.linearRampToValueAtTime(amplitude, startTime + 0.01);
        gain1.gain.exponentialRampToValueAtTime(0.001, startTime + 0.05);
    
        osc1.connect(gain1).connect(this.masterGain);
        osc1.start(startTime);
        osc1.stop(startTime + 0.05);
    
        // Second chirp (doublet)
        const doubletTime = startTime + 0.05 + Math.random() * 0.05; // 50-100ms later
        const osc2 = this.audioCtx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.value = baseFreq * (1 + Math.random() * 0.05); // Slight pitch variation
        this.addActiveNode(osc2); // Track node for automatic cleanup
    
        const gain2 = this.audioCtx.createGain();
        gain2.gain.setValueAtTime(0, doubletTime);
        gain2.gain.linearRampToValueAtTime(amplitude, doubletTime + 0.01);
        gain2.gain.exponentialRampToValueAtTime(0.001, doubletTime + 0.05);
    
        osc2.connect(gain2).connect(this.masterGain);
        osc2.start(doubletTime);
        osc2.stop(doubletTime + 0.05);
    }

    /**
     * Updates sound parameters with new values.
     * @param {Object} newParams - New parameters to update.
     */
    updateParams(newParams) {
        // Call parent updateParams to merge parameters
        super.updateParams(newParams);
        
        if (this.timeout) {
            if (this.params.cricketDensity <= 0) {
                this.stop();
            }
        } else if (this.params.cricketDensity > 0) {
            this.start();
        }
    }

    /**
     * Plays a short burst of cricket sounds.
     */
    playBurst() {
        const burstDuration = 3; // 3-second burst
        const numChirps = Math.floor(this.params.cricketDensity * 6);
        const currentTime = this.audioCtx.currentTime;
        
        for (let i = 0; i < numChirps; i++) {
            const chirpTime = currentTime + Math.random() * burstDuration;
            this.scheduleChirp(chirpTime);
        }
        
        setTimeout(() => this.stop(), burstDuration * 1050);
    }
}