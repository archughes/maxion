
// crickets.js
export class CricketsSound {
    constructor(audioCtx, masterGain, params) {
        this.audioCtx = audioCtx;
        this.masterGain = masterGain;
        this.params = {
            cricketDensity: params.cricketDensity || 0, // Number of crickets (0-4)
            cricketSpeed: params.cricketSpeed || 0      // Chirp rate (0-4)
        };
        this.activeOscillators = new Set();
        this.chirpTimeout = null;
    }

    start() {
        if (this.params.cricketDensity <= 0 || this.chirpTimeout) return;
    
        const scheduleChirp = () => {
            const currentTime = this.audioCtx.currentTime;
            const chirpInterval = 0.3 + (4 - this.params.cricketSpeed) * 0.2; // 0.3-1.1s
            const nextChirpTime = currentTime + chirpInterval * (0.5 + Math.random());
    
            this.scheduleChirp(nextChirpTime);
            this.chirpTimeout = setTimeout(scheduleChirp, chirpInterval * 1000);
        };
    
        scheduleChirp();
    }

    stop() {
        if (this.chirpTimeout) {
            clearTimeout(this.chirpTimeout);
            this.chirpTimeout = null;
        }
        this.activeOscillators.forEach(osc => osc.stop());
        this.activeOscillators.clear();
    }

    scheduleChirp(startTime) {
        const baseFreq = 4000 + Math.random() * 4000; // 4000-8000 Hz
        const amplitude = this.params.cricketDensity / 12;
    
        // First chirp
        const osc1 = this.audioCtx.createOscillator();
        osc1.type = 'sine'; // Tonal, less harsh than sawtooth
        osc1.frequency.value = baseFreq;
    
        const gain1 = this.audioCtx.createGain();
        gain1.gain.setValueAtTime(0, startTime);
        gain1.gain.linearRampToValueAtTime(amplitude, startTime + 0.01);
        gain1.gain.exponentialRampToValueAtTime(0.001, startTime + 0.05);
    
        osc1.connect(gain1).connect(this.masterGain);
        osc1.start(startTime);
        osc1.stop(startTime + 0.05);
        this.activeOscillators.add(osc1);
        osc1.onended = () => this.activeOscillators.delete(osc1);
    
        // Second chirp (doublet)
        const doubletTime = startTime + 0.05 + Math.random() * 0.05; // 50-100ms later
        const osc2 = this.audioCtx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.value = baseFreq * (1 + Math.random() * 0.05); // Slight pitch variation
    
        const gain2 = this.audioCtx.createGain();
        gain2.gain.setValueAtTime(0, doubletTime);
        gain2.gain.linearRampToValueAtTime(amplitude, doubletTime + 0.01);
        gain2.gain.exponentialRampToValueAtTime(0.001, doubletTime + 0.05);
    
        osc2.connect(gain2).connect(this.masterGain);
        osc2.start(doubletTime);
        osc2.stop(doubletTime + 0.05);
        this.activeOscillators.add(osc2);
        osc2.onended = () => this.activeOscillators.delete(osc2);
    }

    updateParams(newParams) {
        this.params = { ...this.params, ...newParams };
        if (this.chirpTimeout) {
            if (this.params.cricketDensity <= 0) {
                this.stop();
            }
        } else if (this.params.cricketDensity > 0) {
            this.start();
        }
    }

    playBurst() {
        const burstDuration = 3; // 3-second burst
        const numChirps = Math.floor(this.params.cricketDensity * 6);
        const currentTime = this.audioCtx.currentTime;
        for (let i = 0; i < numChirps; i++) {
            const chirpTime = currentTime + Math.random() * burstDuration;
            this.scheduleChirp(chirpTime);
        }
    }
}