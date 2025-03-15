export class WindSound {
    constructor(audioCtx, masterGain, whiteNoiseBuffer, params) {
        this.audioCtx = audioCtx;
        this.masterGain = masterGain;
        this.whiteNoiseBuffer = whiteNoiseBuffer;
        this.params = {
            windLevel: params.windLevel || 0,
            windTurbidity: params.windTurbidity || 0
        };
        this.windSource = null;
        this.lfo = null;
        this.amplitudeLfo = null;
        this.windGain = null;
        this.modulationGain = null;
        this.amplitudeModGain = null;
        this.previousLfoFrequency = (this.params.windTurbidity / 4) + 1;
        this.isContinuous = false; // Track continuous mode
    }

    start() {
        if (this.params.windLevel <= 0 || this.windSource) return;

        this.windSource = this.audioCtx.createBufferSource();
        this.windSource.buffer = this.whiteNoiseBuffer;
        this.windSource.loop = true;
        const windFilter = this.audioCtx.createBiquadFilter();
        windFilter.type = 'lowpass';
        windFilter.frequency.value = 150;
        this.windGain = this.audioCtx.createGain();
        this.windGain.gain.value = Math.pow(this.params.windLevel / 4, 2);

        this.lfo = this.audioCtx.createOscillator();
        this.lfo.type = 'sine';
        const targetFrequency = 0.1 + (this.params.windTurbidity / 4) * (0.9 + Math.random() * 1.5);
        this.lfo.frequency.value = this.previousLfoFrequency;
        this.lfo.frequency.linearRampToValueAtTime(targetFrequency, this.audioCtx.currentTime + 2);
        this.previousLfoFrequency = targetFrequency;

        this.amplitudeLfo = this.audioCtx.createOscillator();
        this.amplitudeLfo.type = 'sine';
        this.amplitudeLfo.frequency.value = this.lfo.frequency.value / (1.0 + 2.0 * Math.random());
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
    }

    stop() {
        if (this.windSource) {
            this.windSource.stop();
            this.lfo.stop();
            this.amplitudeLfo.stop();
            this.windSource = null;
            this.lfo = null;
            this.amplitudeLfo = null;
            this.windGain = null;
            this.modulationGain = null;
            this.amplitudeModGain = null;
        }
    }

    updateParams(newParams) {
        this.params = { ...this.params, ...newParams };
        if (this.windSource) {
            if (this.params.windLevel <= 0) {
                this.stop();
            } else {
                this.windGain.gain.value = Math.pow(this.params.windLevel / 4, 2);
                this.amplitudeModGain.gain.value = (this.params.windLevel / 4) * (this.params.windTurbidity / 4) * 0.5;
                const targetFrequency = 0.1 + (this.params.windTurbidity / 4) * (0.9 + Math.random() * 1.5);
                this.lfo.frequency.linearRampToValueAtTime(targetFrequency, this.audioCtx.currentTime + 2);
                this.previousLfoFrequency = targetFrequency;
            }
        } else if (this.params.windLevel > 0 && this.isContinuous) {
            this.start(); // Only start in continuous mode
        }
    }

    playBurst() {
        this.start();
        setTimeout(() => this.stop(), 2000);
    }
}