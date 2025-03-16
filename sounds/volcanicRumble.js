// volcanicRumble.js
export class VolcanicRumbleSound {
    constructor(audioCtx, masterGain, whiteNoiseBuffer, params) {
        this.audioCtx = audioCtx;
        this.masterGain = masterGain;
        this.whiteNoiseBuffer = whiteNoiseBuffer;
        this.params = {
            rumbleIntensity: params.rumbleIntensity || 0, 
            ventActivity: params.ventActivity || 0       
        };
        this.rumbleSource = null;
        this.rumbleGain = null;
        this.lowpassFilter = null;
        this.modulationOsc = null;
        this.modulationGain = null;
        this.ventTimeout = null;
        this.activeVentSources = new Set();
        this.isPlaying = false;
    }

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

        this.modulationOsc.start();
        this.rumbleSource.start();
        this.isPlaying = true;

        // Start vent activity if ventActivity > 0
        if (this.params.ventActivity > 0) {
            this.scheduleVent();
        }
    }

    stop() {
        if (this.rumbleSource) {
            this.rumbleSource.stop();
            this.modulationOsc.stop();
            this.rumbleSource = null;
            this.rumbleGain = null;
            this.lowpassFilter = null;
            this.modulationOsc = null;
            this.modulationGain = null;
            this.isPlaying = false;
        }
        if (this.ventTimeout) {
            clearTimeout(this.ventTimeout);
            this.ventTimeout = null;
        }
        this.activeVentSources.forEach(source => source.stop());
        this.activeVentSources.clear();
    }

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
        this.activeVentSources.add(ventSource);
        ventSource.onended = () => this.activeVentSources.delete(ventSource);
    
        this.ventTimeout = setTimeout(() => this.scheduleVent(), ventInterval * 1000);
    }

    updateParams(newParams) {
        this.params = { ...this.params, ...newParams };
        if (this.isPlaying) {
            if (this.params.rumbleIntensity <= 0) {
                this.stop();
            } else {
                this.rumbleGain.gain.value = this.params.rumbleIntensity / 20;
                this.lowpassFilter.frequency.value = 100 + this.params.rumbleIntensity * 10;
                this.modulationOsc.frequency.value = 0.1 + this.params.rumbleIntensity * 0.05;
                this.modulationGain.gain.value = this.params.rumbleIntensity / 40;

                if (this.params.ventActivity > 0 && !this.ventTimeout) {
                    this.scheduleVent();
                } else if (this.params.ventActivity <= 0 && this.ventTimeout) {
                    clearTimeout(this.ventTimeout);
                    this.ventTimeout = null;
                    this.activeVentSources.forEach(source => source.stop());
                    this.activeVentSources.clear();
                }
            }
        } else if (this.params.rumbleIntensity > 0) {
            this.start();
        }
    }

    playBurst() {
        this.start();
        setTimeout(() => this.stop(), 5000); // 5-second burst
    }
}