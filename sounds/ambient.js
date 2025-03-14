export class RainSoundGenerator {
    constructor(params = {}) {
        this.params = {
            windLevel: params.windLevel || 2,
            windTurbidity: params.windTurbidity || 1,
            surfaceType: params.surfaceType || 'metal',
            rainDensity: params.rainDensity || 2,
            rainSpeed: params.rainSpeed || 2,
            raindropSize: params.raindropSize || 2,
            thunderFreq: params.thunderFreq || 2,
            thunderDistance: params.thunderDistance || 3,
        };

        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const bufferSize = 10 * this.audioCtx.sampleRate;
        this.whiteNoiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const data = this.whiteNoiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 2048;
        this.masterGain = this.audioCtx.createGain();
        this.masterGain.connect(this.analyser);
        this.analyser.connect(this.audioCtx.destination);

        this.windNodes = null;
        this.rainInterval = null;
        this.thunderInterval = null;
        this.isPlaying = false;
        this.visualizationFrame = null;
    }

    start() {
        if (!this.isPlaying) {
            this.windNodes = this.setupWind(this.params.windLevel, this.params.windTurbidity);
            this.rainInterval = this.scheduleRain(
                this.params.rainDensity,
                this.params.surfaceType,
                this.params.rainSpeed,
                this.params.raindropSize
            );
            this.thunderInterval = this.scheduleThunderEvents(this.params.thunderFreq, this.params.thunderDistance);
            this.isPlaying = true;
        }
    }

    stop() {
        if (this.isPlaying) {
            if (this.windNodes) {
                this.windNodes.windSource.stop();
                this.windNodes.lfo.stop();
                this.windNodes = null;
            }
            if (this.rainInterval) clearInterval(this.rainInterval);
            if (this.thunderInterval) clearInterval(this.thunderInterval);
            if (this.visualizationFrame) cancelAnimationFrame(this.visualizationFrame);
            this.isPlaying = false;
            this.rainInterval = null;
            this.thunderInterval = null;
            this.visualizationFrame = null;
        }
    }

    updateParams(newParams) {
        const oldParams = { ...this.params };
        this.params = { ...this.params, ...newParams };

        if (this.windNodes) {
            if (this.params.windLevel <= 0) {
                this.windNodes.windSource.stop();
                this.windNodes.lfo.stop();
                this.windNodes = null;
            } else {
                this.windNodes.windGain.gain.value = this.params.windLevel / 4;
                this.windNodes.modulationGain.gain.value = (this.params.windLevel / 4) * (this.params.windTurbidity / 4);
                this.windNodes.lfo.frequency.value = 0.1 + (this.params.windTurbidity / 4) * 0.9;
            }
        } else if (this.params.windLevel > 0) {
            this.windNodes = this.setupWind(this.params.windLevel, this.params.windTurbidity);
        }

        if (this.isPlaying) {
            if (
                oldParams.rainDensity !== this.params.rainDensity ||
                oldParams.rainSpeed !== this.params.rainSpeed ||
                oldParams.raindropSize !== this.params.raindropSize ||
                oldParams.surfaceType !== this.params.surfaceType
            ) {
                if (this.rainInterval) clearInterval(this.rainInterval);
                this.rainInterval = this.scheduleRain(
                    this.params.rainDensity,
                    this.params.surfaceType,
                    this.params.rainSpeed,
                    this.params.raindropSize
                );
            }

            if (
                oldParams.thunderFreq !== this.params.thunderFreq ||
                oldParams.thunderDistance !== this.params.thunderDistance
            ) {
                if (this.thunderInterval) clearInterval(this.thunderInterval);
                this.thunderInterval = this.scheduleThunderEvents(this.params.thunderFreq, this.params.thunderDistance);
            }
        }
    }

    setupWind(windLevel, windTurbidity) {
        if (windLevel <= 0) return null;

        const windSource = this.audioCtx.createBufferSource();
        windSource.buffer = this.whiteNoiseBuffer;
        windSource.loop = true;
        const windFilter = this.audioCtx.createBiquadFilter();
        windFilter.type = 'lowpass';
        windFilter.frequency.value = 150;
        const windGain = this.audioCtx.createGain();
        windGain.gain.value = windLevel / 4;
        const lfo = this.audioCtx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.1 + (windTurbidity / 4) * 0.9;
        const modulationGain = this.audioCtx.createGain();
        modulationGain.gain.value = (windLevel / 4) * (windTurbidity / 4);
        windSource.connect(windFilter).connect(windGain).connect(this.masterGain);
        lfo.connect(modulationGain);
        modulationGain.connect(windGain.gain);
        lfo.start();
        windSource.start();
        return { windSource, lfo, windGain, modulationGain };
    }

    scheduleRain(rainDensity, surfaceType, rainSpeed, raindropSize) {
        if (rainDensity <= 0 || rainSpeed <= 0) return null;

        const scheduleAheadTime = 1;
        let lastScheduledTime = this.audioCtx.currentTime;
        const scheduler = () => {
            const currentTime = this.audioCtx.currentTime;
            while (lastScheduledTime < currentTime + scheduleAheadTime) {
                const deltaT = -Math.log(1 - Math.random()) / (rainDensity * 10 + 10);
                lastScheduledTime += deltaT;
                this.scheduleRaindrop(lastScheduledTime, surfaceType, rainSpeed, raindropSize);
            }
        };
        const interval = setInterval(scheduler, 500);
        scheduler();
        return interval;
    }

    scheduleRaindrop(startTime, surfaceType, rainSpeed, raindropSize) {
        const source = this.audioCtx.createBufferSource();
        source.buffer = this.whiteNoiseBuffer;
        const filter = this.audioCtx.createBiquadFilter();
        let decayTime;
        let amplitude = 1 + raindropSize * 0.5;

        switch (surfaceType) {
            case 'metal':
                filter.type = 'bandpass';
                filter.frequency.value = 1000 - raindropSize * 100;
                filter.Q.value = 10;
                decayTime = 0.1 + raindropSize * 0.05;
                break;
            case 'grass':
                filter.type = 'lowpass';
                filter.frequency.value = 150 - raindropSize * 20;
                filter.Q.value = 0.3;
                decayTime = 0.05 + raindropSize * 0.03;
                break;
            case 'water':
                filter.type = 'lowpass';
                filter.frequency.value = 200 - raindropSize * 30;
                filter.Q.value = 0.5;
                decayTime = 0.1 + raindropSize * 0.05;
                const delay = this.audioCtx.createDelay(1.0);
                const feedback = this.audioCtx.createGain();
                feedback.gain.value = 0.5 + raindropSize * 0.1;
                const wetGain = this.audioCtx.createGain();
                wetGain.gain.value = 0.3 + raindropSize * 0.1;
                delay.delayTime.value = 0.05 + raindropSize * 0.02;
                source.connect(filter).connect(delay);
                delay.connect(feedback);
                feedback.connect(delay);
                delay.connect(wetGain);
                wetGain.connect(this.masterGain);
                break;
            case 'wood':
                filter.type = 'bandpass';
                filter.frequency.value = 300 - raindropSize * 50;
                filter.Q.value = 5;
                decayTime = 0.08 + raindropSize * 0.02;
                break;
            case 'concrete':
                filter.type = 'highpass';
                filter.frequency.value = 300 - raindropSize * 40;
                filter.Q.value = 0.5;
                decayTime = 0.05 + raindropSize * 0.02;
                break;
            case 'glass':
                filter.type = 'bandpass';
                filter.frequency.value = 1200 - raindropSize * 150;
                filter.Q.value = 15;
                decayTime = 0.12 + raindropSize * 0.03;
                break;
            default:
                filter.type = 'lowpass';
                filter.frequency.value = 500;
                filter.Q.value = 1;
                decayTime = 0.02;
        }

        decayTime *= (1 - (rainSpeed / 4) * 0.5);
        const gain = this.audioCtx.createGain();
        source.connect(filter).connect(gain).connect(this.masterGain);
        const attackTime = 0.001;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(amplitude, startTime + attackTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + decayTime);
        const offset = Math.random() * this.whiteNoiseBuffer.duration;
        source.start(startTime, offset, decayTime);
    }

    scheduleThunderEvents(thunderFreq, thunderDistance) {
        if (thunderFreq <= 0) return null;

        const scheduleAheadTime = 60;
        let lastScheduledTime = this.audioCtx.currentTime;
        const scheduler = () => {
            const currentTime = this.audioCtx.currentTime;
            while (lastScheduledTime < currentTime + scheduleAheadTime) {
                const deltaT = -Math.log(1 - Math.random()) / (thunderFreq / 4);
                lastScheduledTime += deltaT;
                this.scheduleThunder(lastScheduledTime, thunderDistance);
            }
        };
        const interval = setInterval(scheduler, 30000);
        scheduler();
        return interval;
    }

    scheduleThunder(startTime, distance) {
        const maxGain = 2.0;
        const distanceFactor = 1 / (1 + (distance / 4) * 2);

        const rumbleSource = this.audioCtx.createBufferSource();
        rumbleSource.buffer = this.whiteNoiseBuffer;
        const rumbleFilter = this.audioCtx.createBiquadFilter();
        rumbleFilter.type = 'lowpass';
        rumbleFilter.frequency.value = 100 + 400 / (1 + (distance / 4));
        const rumbleGain = this.audioCtx.createGain();
        rumbleSource.connect(rumbleFilter).connect(rumbleGain).connect(this.masterGain);

        const rumbleDuration = 5;
        rumbleGain.gain.setValueAtTime(0, startTime);
        rumbleGain.gain.linearRampToValueAtTime(maxGain * distanceFactor, startTime + 0.1);
        rumbleGain.gain.exponentialRampToValueAtTime(0.001, startTime + rumbleDuration);

        rumbleSource.start(startTime, Math.random() * this.whiteNoiseBuffer.duration, rumbleDuration);

        if (distance < 1) {
            const crackSource = this.audioCtx.createBufferSource();
            crackSource.buffer = this.whiteNoiseBuffer;
            const crackFilter = this.audioCtx.createBiquadFilter();
            crackFilter.type = 'highpass';
            crackFilter.frequency.value = 1000;
            const crackGain = this.audioCtx.createGain();
            crackSource.connect(crackFilter).connect(crackGain).connect(this.masterGain);

            const crackDuration = 0.05;
            crackGain.gain.setValueAtTime(0, startTime);
            crackGain.gain.linearRampToValueAtTime(maxGain * 1.5, startTime + 0.001);
            crackGain.gain.exponentialRampToValueAtTime(0.001, startTime + crackDuration);

            crackSource.start(startTime, Math.random() * this.whiteNoiseBuffer.duration, crackDuration);
        }
    }

    setupVisualizations(fftCanvas, waveformCanvas) {
        if (!fftCanvas || !waveformCanvas) {
            console.error('Canvas elements not provided:', { fftCanvas, waveformCanvas });
            return;
        }

        console.log('Setting up visualizations...');
        const fftCtx = fftCanvas.getContext('2d');
        const waveformCtx = waveformCanvas.getContext('2d');

        if (!fftCtx || !waveformCtx) {
            console.error('Failed to get canvas contexts:', { fftCtx, waveformCtx });
            return;
        }

        fftCanvas.width = fftCanvas.offsetWidth;
        fftCanvas.height = fftCanvas.offsetHeight;
        waveformCanvas.width = waveformCanvas.offsetWidth;
        waveformCanvas.height = waveformCanvas.offsetHeight;

        const fftData = new Uint8Array(this.analyser.frequencyBinCount);
        const waveformData = new Uint8Array(this.analyser.fftSize);

        const draw = () => {
            if (!this.isPlaying) {
                console.log('Visualization stopped: isPlaying is false');
                return;
            }

            this.analyser.getByteFrequencyData(fftData);
            fftCtx.fillStyle = 'white';
            fftCtx.fillRect(0, 0, fftCanvas.width, fftCanvas.height);
            fftCtx.fillStyle = 'blue';
            const barWidth = (fftCanvas.width / fftData.length) * 2.5;
            let x = 0;
            for (let i = 0; i < fftData.length; i++) {
                const barHeight = (fftData[i] / 255) * fftCanvas.height;
                fftCtx.fillRect(x, fftCanvas.height - barHeight, barWidth, barHeight);
                x += barWidth + 1;
            }

            this.analyser.getByteTimeDomainData(waveformData);
            waveformCtx.fillStyle = 'white';
            waveformCtx.fillRect(0, 0, waveformCanvas.width, waveformCanvas.height);
            waveformCtx.strokeStyle = 'red';
            waveformCtx.beginPath();
            const sliceWidth = waveformCanvas.width / waveformData.length;
            let wx = 0;
            for (let i = 0; i < waveformData.length; i++) {
                const v = waveformData[i] / 128.0;
                const y = (v * waveformCanvas.height) / 2;
                if (i === 0) waveformCtx.moveTo(wx, y);
                else waveformCtx.lineTo(wx, y);
                wx += sliceWidth;
            }
            waveformCtx.lineTo(waveformCanvas.width, waveformCanvas.height / 2);
            waveformCtx.stroke();

            this.visualizationFrame = requestAnimationFrame(draw);
        };
        console.log('Starting visualization loop...');
        draw();
    }
}