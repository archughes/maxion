import { WindSound } from './wind.js';
import { RainSound } from './rain.js';
import { ThunderSound } from './thunder.js';

export class RainSoundManager {
    constructor(audioCtx, analyser, params = {}) {
        this.audioCtx = audioCtx;
        this.analyser = analyser;
        this.analyser.fftSize = 2048;
        this.params = {
            windLevel: params.windLevel || 2,
            windTurbidity: params.windTurbidity || 1,
            surfaceType: params.surfaceType || 'metal',
            rainDensity: params.rainDensity || 2,
            rainSpeed: params.rainSpeed || 2,
            raindropSize: params.raindropSize || 2,
            thunderFreq: params.thunderFreq || 2,
            thunderDistance: params.thunderDistance || 3
        };

        const bufferSize = 10 * this.audioCtx.sampleRate;
        this.whiteNoiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const data = this.whiteNoiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        this.masterGain = this.audioCtx.createGain();
        this.masterGain.connect(this.analyser);
        this.analyser.connect(this.audioCtx.destination);

        this.windSound = new WindSound(this.audioCtx, this.masterGain, this.whiteNoiseBuffer, { windLevel: 0, windTurbidity: this.params.windTurbidity });
        this.rainSound = new RainSound(this.audioCtx, this.masterGain, this.whiteNoiseBuffer, this.params);
        this.thunderSound = new ThunderSound(this.audioCtx, this.masterGain, this.whiteNoiseBuffer, this.params);

        this.isPlayingContinuous = false;
        this.activeManualSounds = new Set();
        this.visualizationFrame = null;
        this.fftCanvas = null;
        this.waveformCanvas = null;
        this.initialized = false; // Track if initial params have been applied
    }

    async startContinuous() {
        if (!this.isPlayingContinuous && this.audioCtx.state === 'suspended') {
            await this.audioCtx.resume();
        }
        if (!this.isPlayingContinuous) {
            this.windSound.isContinuous = true;
            this.windSound.start();
            this.rainSound.startContinuous();
            this.thunderSound.startContinuous();
            this.isPlayingContinuous = true;
            this.startVisualizations();
        }
    }

    stopContinuous() {
        if (this.isPlayingContinuous) {
            this.windSound.isContinuous = false;
            this.windSound.stop();
            this.rainSound.stopContinuous();
            this.thunderSound.stopContinuous();
            this.isPlayingContinuous = false;
            this.checkVisualizationState();
        }
    }

    async updateParams(newParams) {
        this.params = { ...this.params, ...newParams };
        if (this.audioCtx.state === 'suspended') {
            return;
        }
        this.windSound.updateParams({
            windLevel: this.params.windLevel,
            windTurbidity: this.params.windTurbidity
        });
        this.rainSound.updateParams({
            rainDensity: this.params.rainDensity,
            rainSpeed: this.params.rainSpeed,
            raindropSize: this.params.raindropSize,
            surfaceType: this.params.surfaceType
        });
        this.thunderSound.updateParams({
            thunderFreq: this.params.thunderFreq,
            thunderDistance: this.params.thunderDistance
        });
        this.initialized = true;
    }

    async playWindManual() {
        if (this.audioCtx.state === 'suspended') {
            await this.audioCtx.resume();
        }
        if (!this.initialized) {
            await this.updateParams(this.params); // Apply initial params on first play
        }
        const soundId = `wind-${Date.now()}`;
        this.activeManualSounds.add(soundId);
        this.startVisualizations();
        this.windSound.playBurst();
        setTimeout(() => {
            this.activeManualSounds.delete(soundId);
            this.checkVisualizationState();
        }, 2000);
    }

    async playRainManual() {
        if (this.audioCtx.state === 'suspended') {
            await this.audioCtx.resume();
        }
        if (!this.initialized) {
            await this.updateParams(this.params); // Apply initial params on first play
        }
        const soundId = `rain-${Date.now()}`;
        this.activeManualSounds.add(soundId);
        this.startVisualizations();
        this.rainSound.playBurst();
        setTimeout(() => {
            this.activeManualSounds.delete(soundId);
            this.checkVisualizationState();
        }, 2000);
    }

    async playThunderManual() {
        if (this.audioCtx.state === 'suspended') {
            await this.audioCtx.resume();
        }
        if (!this.initialized) {
            await this.updateParams(this.params); // Apply initial params on first play
        }
        const soundId = `thunder-${Date.now()}`;
        this.activeManualSounds.add(soundId);
        this.startVisualizations();
        this.thunderSound.playBurst();
        setTimeout(() => {
            this.activeManualSounds.delete(soundId);
            this.checkVisualizationState();
        }, 5500);
    }

    // Visualization methods remain unchanged
    setupVisualizations(fftCanvas, waveformCanvas) {
        this.fftCanvas = fftCanvas;
        this.waveformCanvas = waveformCanvas;
    }

    startVisualizations() {
        if (!this.fftCanvas || !this.waveformCanvas || this.visualizationFrame) return;

        const fftCtx = this.fftCanvas.getContext('2d');
        const waveformCtx = this.waveformCanvas.getContext('2d');
        this.fftCanvas.width = this.fftCanvas.offsetWidth;
        this.fftCanvas.height = this.fftCanvas.offsetHeight;
        this.waveformCanvas.width = this.waveformCanvas.offsetWidth;
        this.waveformCanvas.height = this.waveformCanvas.offsetHeight;

        const fftData = new Uint8Array(this.analyser.frequencyBinCount);
        const waveformData = new Uint8Array(this.analyser.fftSize);

        const draw = () => {
            if (!this.isPlayingContinuous && this.activeManualSounds.size === 0) {
                this.visualizationFrame = null;
                return;
            }

            this.analyser.getByteFrequencyData(fftData);
            fftCtx.fillStyle = 'white';
            fftCtx.fillRect(0, 0, this.fftCanvas.width, this.fftCanvas.height);
            fftCtx.fillStyle = 'blue';
            const barWidth = (this.fftCanvas.width / fftData.length) * 2.5;
            let x = 0;
            for (let i = 0; i < fftData.length; i++) {
                const barHeight = (fftData[i] / 255) * this.fftCanvas.height;
                fftCtx.fillRect(x, this.fftCanvas.height - barHeight, barWidth, barHeight);
                x += barWidth + 1;
            }

            this.analyser.getByteTimeDomainData(waveformData);
            waveformCtx.fillStyle = 'white';
            waveformCtx.fillRect(0, 0, this.waveformCanvas.width, this.waveformCanvas.height);
            waveformCtx.strokeStyle = 'red';
            waveformCtx.beginPath();
            const sliceWidth = this.waveformCanvas.width / waveformData.length;
            let wx = 0;
            for (let i = 0; i < waveformData.length; i++) {
                const v = waveformData[i] / 128.0;
                const y = (v * this.waveformCanvas.height) / 2;
                if (i === 0) waveformCtx.moveTo(wx, y);
                else waveformCtx.lineTo(wx, y);
                wx += sliceWidth;
            }
            waveformCtx.lineTo(this.waveformCanvas.width, this.waveformCanvas.height / 2);
            waveformCtx.stroke();

            this.visualizationFrame = requestAnimationFrame(draw);
        };

        this.visualizationFrame = requestAnimationFrame(draw);
    }

    checkVisualizationState() {
        if (!this.isPlayingContinuous && this.activeManualSounds.size === 0 && this.visualizationFrame) {
            cancelAnimationFrame(this.visualizationFrame);
            this.visualizationFrame = null;
        } else if ((this.isPlayingContinuous || this.activeManualSounds.size > 0) && !this.visualizationFrame) {
            this.startVisualizations();
        }
    }
}