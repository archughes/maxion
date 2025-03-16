export class FireSound {
    constructor(audioCtx, masterGain, whiteNoiseBuffer, params) {
        this.audioCtx = audioCtx;
        this.masterGain = masterGain;
        this.whiteNoiseBuffer = whiteNoiseBuffer;
        this.params = {
            fireIntensity: params.fireIntensity || 0,
            fireCrackleRate: params.fireCrackleRate || 0
        };
        this.activeSources = new Set();
        this.crackleTimeout = null;
        this.rumbleSource = null; // New for rumble
        this.rumbleFilter = null;
        this.rumbleGain = null;
    }

    start() {
        if (this.params.fireIntensity <= 0 || this.crackleTimeout) return;

        // Start rumble source
        if (!this.rumbleSource) {
            this.rumbleSource = this.audioCtx.createBufferSource();
            this.rumbleSource.buffer = this.whiteNoiseBuffer;
            this.rumbleSource.loop = true;
            this.rumbleFilter = this.audioCtx.createBiquadFilter();
            this.rumbleFilter.type = 'lowpass';
            this.rumbleFilter.frequency.value = 150; // 100-200 Hz range
            this.rumbleGain = this.audioCtx.createGain();
            this.rumbleGain.gain.value = this.params.fireIntensity / 20; // Subtle rumble (0-0.2)
            this.rumbleSource.connect(this.rumbleFilter)
                            .connect(this.rumbleGain)
                            .connect(this.masterGain);
            this.rumbleSource.start();
        }

        const scheduleCrackle = () => {
            const currentTime = this.audioCtx.currentTime;
            const crackleInterval = 0.1 + (4 - this.params.fireCrackleRate) * 0.4;
            const nextCrackleTime = currentTime + crackleInterval * (0.5 + Math.random());
            this.scheduleFractalCrackle(nextCrackleTime);
            this.crackleTimeout = setTimeout(scheduleCrackle, crackleInterval * 1000);
        };
        scheduleCrackle();
    }

    stop() {
        if (this.crackleTimeout) {
            clearTimeout(this.crackleTimeout);
            this.crackleTimeout = null;
        }
        this.activeSources.forEach(source => source.stop());
        this.activeSources.clear();
        if (this.rumbleSource) {
            this.rumbleSource.stop();
            this.rumbleSource = null;
            this.rumbleFilter = null;
            this.rumbleGain = null;
        }
    }

    scheduleFractalCrackle(startTime) {
        const isBigPop = Math.random() < 0.1; // 10% chance for big pop
        const frequencyRange = isBigPop ? [200, 400] : [300, 1500]; // Big pop lower pitch
        const duration = isBigPop ? 0.3 : 0.15; // Longer for big pop
        const amplitudeMultiplier = isBigPop ? 1.5 : 1; // Louder for big pop

        // Primary crackle
        const primarySource = this.audioCtx.createBufferSource();
        primarySource.buffer = this.whiteNoiseBuffer;
        const primaryFilter = this.audioCtx.createBiquadFilter();
        primaryFilter.type = 'bandpass';
        primaryFilter.frequency.value = frequencyRange[0] + Math.random() * (frequencyRange[1] - frequencyRange[0]);
        primaryFilter.Q.value = 10;
        const primaryGain = this.audioCtx.createGain();
        const primaryAmplitude = (this.params.fireIntensity / 4) * (0.5 + Math.random() * 0.5) * amplitudeMultiplier;
        primaryGain.gain.setValueAtTime(primaryAmplitude, startTime);
        primaryGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        primarySource.connect(primaryFilter).connect(primaryGain).connect(this.masterGain);
        primarySource.start(startTime, Math.random() * this.whiteNoiseBuffer.duration, duration);
        this.activeSources.add(primarySource);
        primarySource.onended = () => this.activeSources.delete(primarySource);

        // Secondary and tertiary crackles remain similar but adjust frequency ranges
        if (Math.random() < 0.5 && this.params.fireIntensity > 1) {
            const secondaryDelay = 0.05 + Math.random() * 0.05;
            const secondarySource = this.audioCtx.createBufferSource();
            secondarySource.buffer = this.whiteNoiseBuffer;
            const secondaryFilter = this.audioCtx.createBiquadFilter();
            secondaryFilter.type = 'bandpass';
            secondaryFilter.frequency.value = 400 + Math.random() * 1100; // 400-1500 Hz
            secondaryFilter.Q.value = 15;
            const secondaryGain = this.audioCtx.createGain();
            const secondaryAmplitude = primaryAmplitude * 0.7;
            secondaryGain.gain.setValueAtTime(secondaryAmplitude, startTime + secondaryDelay);
            secondaryGain.gain.exponentialRampToValueAtTime(0.001, startTime + secondaryDelay + 0.08);

            secondarySource.connect(secondaryFilter).connect(secondaryGain).connect(this.masterGain);
            secondarySource.start(startTime + secondaryDelay, Math.random() * this.whiteNoiseBuffer.duration, 0.1);
            this.activeSources.add(secondarySource);
            secondarySource.onended = () => this.activeSources.delete(secondarySource);
            // Tertiary crackle omitted for brevity but follows similar logic
        }
    }

    playBurst() {
        const burstDuration = 3;
        const numCrackles = Math.floor(this.params.fireIntensity * 2);
        const currentTime = this.audioCtx.currentTime;
        for (let i = 0; i < numCrackles; i++) {
            const crackleTime = currentTime + Math.random() * (burstDuration - 0.15); // Ensure completion by 3s
            this.scheduleFractalCrackle(crackleTime);
        }
    }

    updateParams(newParams) {
        this.params = { ...this.params, ...newParams };
        if (this.crackleTimeout) {
            if (this.params.fireIntensity <= 0) {
                this.stop();
            }
        } else if (this.params.fireIntensity > 0) {
            this.start();
        }
    }
}