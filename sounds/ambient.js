import { WindSound } from './wind.js';
import { RainSound } from './rain.js';
import { ThunderSound } from './thunder.js';
import { OceanWavesSound } from './oceanWaves.js';
import { FireSound } from './fire.js';
import { BirdSound } from './bird.js';
import { CricketsSound } from './crickets.js';
import { RiverSound } from './river.js';
import { IceCrackingSound} from './iceCracking.js';
import { VolcanicRumbleSound } from './volcanicRumble.js';
import { AchievementSound } from './achievement.js';
import { BerryPickSound } from './berry-pick.js';
import { BowSound } from './bow.js';
import { ChestSound } from './chest.js';
import { FootstepsSound } from './footsteps.js';
import { HumanIdleSounds } from './idle.js';
import { SpellSound } from './spell.js';
import { SwordSound } from './sword.js';
import { TreeChopSound } from './tree-chop.js';

export class AmbientSoundManager {
    constructor(audioCtx, analyser, params = {}) {
        this.audioCtx = audioCtx;
        this.analyser = analyser;
        this.analyser.fftSize = 2048;

        // Define sound classes and their manual play mappings
        this.soundClasses = {
            wind: { cls: WindSound, duration: 2000 },
            rain: { cls: RainSound, duration: 2000 },
            thunder: { cls: ThunderSound, duration: 5500 },
            oceanWaves: { cls: OceanWavesSound, duration: 8000 },
            fire: { cls: FireSound, duration: 3500 },
            bird: { cls: BirdSound, duration: 3000 },
            crickets: { cls: CricketsSound, duration: 3000 },
            river: { cls: RiverSound, duration: 5000 },
            iceCracking: { cls: IceCrackingSound, duration: 4000 },
            volcanicRumble: { cls: VolcanicRumbleSound, duration: 5000 },
            achievement: { cls: AchievementSound, duration: 2000 },
            berry: { cls: BerryPickSound, duration: 2000 },
            bow: { cls: BowSound, duration: 2000 },
            chest: { cls: ChestSound, duration: 2000 },
            footsteps: { cls: FootstepsSound, duration: 2000 },
            humanIdle: { cls: HumanIdleSounds, duration: 2000 },
            spell: { cls: SpellSound, duration: 2000 },
            sword: { cls: SwordSound, duration: 2000 },
            chop: { cls: TreeChopSound, duration: 2000 }
        };

        // Generate soundMappings dynamically
        this.soundMappings = {};
        this.sounds = {};

        // Initialize white noise buffer
        const bufferSize = 10 * this.audioCtx.sampleRate;
        this.whiteNoiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const data = this.whiteNoiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        // Create master gain node
        this.masterGain = this.audioCtx.createGain();
        this.masterGain.connect(this.analyser);
        this.analyser.connect(this.audioCtx.destination);

        // Initialize all sound instances and mappings
        for (const [key, { cls, duration }] of Object.entries(this.soundClasses)) {
            // Check how many parameters the constructor expects
            console.log(`Initializing ${key} sound with ${cls.length} parameters`);
            const expectsWhiteNoise = cls.length > 2; // More than audioCtx, masterGain, params
            this.sounds[key] = new cls(
                this.audioCtx,
                this.masterGain,
                expectsWhiteNoise ? this.whiteNoiseBuffer : undefined,
                params
            );
            this.soundMappings[`play${key.charAt(0).toUpperCase() + key.slice(1)}Manual`] = {
                sound: this.sounds[key],
                duration
            };
        }

        // Aggregate default params from sound classes
        this.params = this.getAggregatedParams(params);

        this.isPlayingContinuous = false;
        this.activeManualSounds = new Set();
        this.visualizationFrame = null;
        this.fftCanvas = null;
        this.waveformCanvas = null;
        this.initialized = false;
    }

    // Aggregate default parameters from all sound classes
    getAggregatedParams(overrideParams = {}) {
        const aggregatedParams = {};
        for (const [key, { cls }] of Object.entries(this.soundClasses)) {
            const instance = new cls(this.audioCtx, this.masterGain, {}); // Temporary instance for defaults
            Object.assign(aggregatedParams, instance.params); // Assuming each sound class exposes its params
        }
        return { ...aggregatedParams, ...overrideParams };
    }

    async startContinuous() {
        if (!this.isPlayingContinuous && this.audioCtx.state === 'suspended') {
            await this.audioCtx.resume();
        }
        if (!this.isPlayingContinuous) {
            for (const sound of Object.values(this.sounds)) {
                sound.start();
            }
            this.isPlayingContinuous = true;
            this.startVisualizations();
        }
    }

    stopContinuous() {
        if (this.isPlayingContinuous) {
            for (const sound of Object.values(this.sounds)) {
                sound.stop();
            }
            this.isPlayingContinuous = false;
            this.checkVisualizationState();
        }
    }

    async updateParams(newParams) {
        this.params = { ...this.params, ...newParams };
        if (this.audioCtx.state === 'suspended') {
            return;
        }
        for (const [key, sound] of Object.entries(this.sounds)) {
            const relevantParams = {};
            const cls = this.soundClasses[key].cls;
            const tempInstance = new cls(this.audioCtx, this.masterGain, {}); // Get default params structure
            for (const paramKey of Object.keys(tempInstance.params)) {
                if (this.params[paramKey] !== undefined) {
                    relevantParams[paramKey] = this.params[paramKey];
                }
            }
            sound.updateParams(relevantParams);
        }
        this.initialized = true;
    }

    async playManualSound(sound, duration, playMethod) {
        if (this.audioCtx.state === 'suspended') {
            await this.audioCtx.resume();
        }
        const soundId = `${playMethod}-${Date.now()}`;
        this.activeManualSounds.add(soundId);
        this.startVisualizations();
        sound.playBurst();
        setTimeout(() => {
            this.activeManualSounds.delete(soundId);
            this.checkVisualizationState();
        }, duration);
    }

    async playManualByType(playMethod) {
        const mapping = this.soundMappings[playMethod];
        if (mapping) {
            await this.playManualSound(mapping.sound, mapping.duration, playMethod);
        } else {
            console.error(`No mapping found for playMethod: ${playMethod}`);
        }
    }

    // Visualization methods (unchanged)
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