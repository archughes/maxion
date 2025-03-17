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
        this.params = {
            windLevel: params.windLevel || 2,
            windTurbidity: params.windTurbidity || 1,
            surfaceType: params.surfaceType || 'metal',
            rainDensity: params.rainDensity || 2,
            rainSpeed: params.rainSpeed || 2,
            raindropSize: params.raindropSize || 2,
            thunderFreq: params.thunderFreq || 2,
            thunderDistance: params.thunderDistance || 3,
            waveIntensity: params.waveIntensity || 0,
            waveFrequency: params.waveFrequency || 0,
            fireIntensity: params.fireIntensity || 0,
            fireCrackleRate: params.fireCrackleRate || 0,
            birdActivity: params.birdActivity || 0,
            birdPitch: params.birdPitch || 0,
            birdType: params.birdType || 'Robin',
            cricketDensity: params.cricketDensity || 0,
            cricketSpeed: params.cricketSpeed || 0,
            riverFlow: params.riverFlow || 0,
            riverDepth: params.riverDepth || 0,
            iceIntensity: params.iceIntensity || 0,
            iceFractureRate: params.iceFractureRate || 0,
            rumbleIntensity: params.rumbleIntensity || 0,
            ventActivity: params.ventActivity || 0,
            achievementType: params.achievementType || 'levelUp',
            achievementImportance: params.achievementImportance || 2,
            achievementStyle: params.achievementStyle || 'fantasy',
            berryType: params.berryType || 2,
            berryRipeness: params.berryRipeness || 2,
            berryQuantity: params.berryQuantity || 2,
            bowType: params.bowType || 'standard',
            drawStrength: params.drawStrength || 2,
            arrowType: params.arrowType || 'wooden',
            chestSize: params.chestSize || 2,
            chestMaterialType: params.chestMaterialType || 2,
            chestCondition: params.chestCondition || 2,
            chestTreasureValue: params.chestTreasureValue || 2,
            footstepsEnvironment: params.footstepsEnvironment || 'stone', // 'water', 'mud', 'sand', 'stone', 'metal'
            footstepsIntensity: params.footstepsIntensity || 2,           // 0-4 (sneaking to running)
            footstepsWetness: params.footstepsWetness || 2,
            humanIdleSoundType: params.humanIdleSoundType || 'breathing', // 'hmm', 'haaa', 'yawn', 'breathing', 'rambling'
            humanIdleIntensity: params.humanIdleIntensity || 2,           // 0-4 (soft to loud)
            humanIdleVoiceType: params.humanIdleVoiceType || 2,
            spellPower: params.spellPower || 0, // Spell strength (0-4)
            spellElement: params.spellElement || 'fire', // 'fire', 'water', 'air', 'earth', 'arcane'
            spellCastTime: params.spellCastTime || 0,
            swordIntensity: params.swordIntensity || 0, // Force of swing/hit (0-4)
            swordMetalType: params.swordMetalType || 0, // Material quality (0-4: dull to sharp/bright)
            swordActionType: params.swordActionType || 'swing',
            chopTreeSize: params.chopTreeSize || 2,       // Size of tree (0-4): sapling to massive
            chopTool: params.chopTool || 2,       // Type of tool (0-4): stone axe to chainsaw
            chopIntensity: params.chopIntensity || 2
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
        this.oceanWavesSound = new OceanWavesSound(this.audioCtx, this.masterGain, this.whiteNoiseBuffer, this.params);
        this.fireSound = new FireSound(this.audioCtx, this.masterGain, this.whiteNoiseBuffer, this.params);
        this.birdSound = new BirdSound(this.audioCtx, this.masterGain, this.params);
        this.cricketsSound = new CricketsSound(this.audioCtx, this.masterGain, this.params);
        this.riverSound = new RiverSound(this.audioCtx, this.masterGain, this.whiteNoiseBuffer, this.params);
        this.iceCrackingSound = new IceCrackingSound(this.audioCtx, this.masterGain, this.whiteNoiseBuffer, this.params);
        this.volcanicRumbleSound = new VolcanicRumbleSound(this.audioCtx, this.masterGain, this.whiteNoiseBuffer, this.params);
        this.achievementSound = new AchievementSound(this.audioCtx, this.masterGain, this.params);
        this.berrySound = new BerryPickSound(this.audioCtx, this.masterGain, this.params);
        this.bowSound = new BowSound(this.audioCtx, this.masterGain, this.params);
        this.chestSound = new ChestSound(this.audioCtx, this.masterGain, this.params);
        this.footstepsSound = new FootstepsSound(this.audioCtx, this.masterGain, this.params);
        this.humanIdleSound = new HumanIdleSounds(this.audioCtx, this.masterGain, this.params);
        this.spellSound = new SpellSound(this.audioCtx, this.masterGain, this.params);
        this.swordSound = new SwordSound(this.audioCtx, this.masterGain, this.params);
        this.treeChopSound = new TreeChopSound(this.audioCtx, this.masterGain, this.params);

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
            this.oceanWavesSound.start();
            this.fireSound.start();
            this.birdSound.start();
            this.cricketsSound.start();
            this.riverSound.start();
            this.iceCrackingSound.start();
            this.volcanicRumbleSound.start();
            this.achievementSound.start();
            this.berrySound.start();
            this.bowSound.start();
            this.chestSound.start();
            this.footstepsSound.start();
            this.humanIdleSound.start();
            this.spellSound.start();
            this.swordSound.start();
            this.treeChopSound.start();
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
            this.oceanWavesSound.stop();
            this.fireSound.stop();
            this.birdSound.stop();
            this.cricketsSound.stop();
            this.riverSound.stop();
            this.iceCrackingSound.stop();
            this.volcanicRumbleSound.stop();
            this.achievementSound.stop();
            this.berrySound.stop();
            this.bowSound.stop();
            this.chestSound.stop();
            this.footstepsSound.stop();
            this.humanIdleSound.stop();
            this.spellSound.stop();
            this.swordSound.stop();
            this.treeChopSound.stop();
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
        this.oceanWavesSound.updateParams({
            waveIntensity: this.params.waveIntensity,
            waveFrequency: this.params.waveFrequency
        });
        this.fireSound.updateParams({
            fireIntensity: this.params.fireIntensity,
            fireCrackleRate: this.params.fireCrackleRate
        });
        this.birdSound.updateParams({
            birdActivity: this.params.birdActivity,
            birdPitch: this.params.birdPitch,
            birdType: this.params.birdType
        });
        this.cricketsSound.updateParams({
            cricketDensity: this.params.cricketDensity,
            cricketSpeed: this.params.cricketSpeed
        });
        this.riverSound.updateParams({
            riverFlow: this.params.riverFlow,
            riverDepth: this.params.riverDepth
        });
        this.iceCrackingSound.updateParams({
            iceIntensity: this.params.iceIntensity,
            iceFractureRate: this.params.iceFractureRate
        });
        this.volcanicRumbleSound.updateParams({
            rumbleIntensity: this.params.rumbleIntensity,
            ventActivity: this.params.ventActivity
        });
        this.achievementSound.updateParams({
            achievementType: this.params.achievementType,
            achievementImportance: this.params.achievementImportance,
            achievementStyle: this.params.achievementStyle
        });
        this.berrySound.updateParams({
            berryBushType: this.params.berryBushType,
            berryRipeness: this.params.berryRipeness,
            berryQuantity: this.params.berryQuantity
        });
        this.bowSound.updateParams({
            bowType: this.params.bowType,
            drawStrength: this.params.drawStrength,
            arrowType: this.params.arrowType
        });
        this.chestSound.updateParams({
            chestSize: this.params.chestSize,
            chestMaterialType: this.params.chestMaterialType,
            chestCondition: this.params.chestCondition,
            chestTreasureValue: this.params.chestTreasureValue
        });
        this.footstepsSound.updateParams({
            footstepsEnvironment: this.params.footstepsEnvironment,
            footstepsIntensity: this.params.footstepsIntensity,
            footstepsWetness: this.params.footstepsWetness
        });
        this.humanIdleSound.updateParams({
            humanIdleSoundType: this.params.humanIdleSoundType,
            humanIdleIntensity: this.params.humanIdleIntensity,
            humanIdleVoiceType: this.params.humanIdleVoiceType
        });
        this.spellSound.updateParams({
            spellPower: this.params.spellPower,
            spellElement: this.params.spellElement,
            spellCastTime: this.params.spellCastTime
        });
        this.swordSound.updateParams({
            swordIntensity: this.params.swordIntensity,
            swordMetalType: this.params.swordMetalType,
            swordActionType: this.params.swordActionType
        });
        this.treeChopSound.updateParams({
            chopTreeSize: this.params.chopTreeSize,
            chopTool: this.params.chopTool,
            chopIntensity: this.params.chopIntensity
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

    async playOceanWavesManual() {
        if (this.audioCtx.state === 'suspended') {
            await this.audioCtx.resume();
        }
        if (!this.initialized) {
            await this.updateParams(this.params);
        }
        const soundId = `oceanWaves-${Date.now()}`;
        this.activeManualSounds.add(soundId);
        this.startVisualizations();
        this.oceanWavesSound.playBurst();
        setTimeout(() => {
            this.activeManualSounds.delete(soundId);
            this.checkVisualizationState();
        }, 8000);
    }

    async playFireManual() {
        if (this.audioCtx.state === 'suspended') {
            await this.audioCtx.resume();
        }
        if (!this.initialized) {
            await this.updateParams(this.params);
        }
        const soundId = `fire-${Date.now()}`;
        this.activeManualSounds.add(soundId);
        this.startVisualizations();
        this.fireSound.playBurst();
        setTimeout(() => {
            this.activeManualSounds.delete(soundId);
            this.checkVisualizationState();
        }, 3500);
    }

    async playBirdManual() {
        if (this.audioCtx.state === 'suspended') {
            await this.audioCtx.resume();
        }
        if (!this.initialized) {
            await this.updateParams(this.params);
        }
        const soundId = `bird-${Date.now()}`;
        this.activeManualSounds.add(soundId);
        this.startVisualizations();
        this.birdSound.playBurst();
        setTimeout(() => {
            this.activeManualSounds.delete(soundId);
            this.checkVisualizationState();
        }, 3000);
    }

    async playCricketsManual() {
        if (this.audioCtx.state === 'suspended') {
            await this.audioCtx.resume();
        }
        if (!this.initialized) {
            await this.updateParams(this.params);
        }
        const soundId = `crickets-${Date.now()}`;
        this.activeManualSounds.add(soundId);
        this.startVisualizations();
        this.cricketsSound.playBurst();
        setTimeout(() => {
            this.activeManualSounds.delete(soundId);
            this.checkVisualizationState();
        }, 3000);
    }

    async playRiverManual() {
        if (this.audioCtx.state === 'suspended') {
            await this.audioCtx.resume();
        }
        if (!this.initialized) {
            await this.updateParams(this.params);
        }
        const soundId = `river-${Date.now()}`;
        this.activeManualSounds.add(soundId);
        this.startVisualizations();
        this.riverSound.playBurst();
        setTimeout(() => {
            this.activeManualSounds.delete(soundId);
            this.checkVisualizationState();
        }, 5000);
    }

    async playIceCrackingManual() {
        if (this.audioCtx.state === 'suspended') {
            await this.audioCtx.resume();
        }
        if (!this.initialized) {
            await this.updateParams(this.params);
        }
        const soundId = `iceCracking-${Date.now()}`;
        this.activeManualSounds.add(soundId);
        this.startVisualizations();
        this.iceCrackingSound.playBurst();
        setTimeout(() => {
            this.activeManualSounds.delete(soundId);
            this.checkVisualizationState();
        }, 4000);
    }
    
    async playVolcanicRumbleManual() {
        if (this.audioCtx.state === 'suspended') {
            await this.audioCtx.resume();
        }
        if (!this.initialized) {
            await this.updateParams(this.params);
        }
        const soundId = `volcanicRumble-${Date.now()}`;
        this.activeManualSounds.add(soundId);
        this.startVisualizations();
        this.volcanicRumbleSound.playBurst();
        setTimeout(() => {
            this.activeManualSounds.delete(soundId);
            this.checkVisualizationState();
        }, 5000);
    }

    async playAchievementManual() {
        if (this.audioCtx.state === 'suspended') {
            await this.audioCtx.resume();
        }
        if (!this.initialized) {
            await this.updateParams(this.params);
        }
        const soundId = `achievement-${Date.now()}`;
        this.activeManualSounds.add(soundId);
        this.startVisualizations();
        this.achievementSound.playBurst();
        setTimeout(() => {
            this.activeManualSounds.delete(soundId);
            this.checkVisualizationState();
        }, 2000);
    }

    async playBerryManual() {
        if (this.audioCtx.state === 'suspended') {
            await this.audioCtx.resume();
        }
        if (!this.initialized) {
            await this.updateParams(this.params);
        }
        const soundId = `berry-${Date.now()}`;
        this.activeManualSounds.add(soundId);
        this.startVisualizations();
        this.berrySound.playBurst();
        setTimeout(() => {
            this.activeManualSounds.delete(soundId);
            this.checkVisualizationState();
        }, 2000);
    }

    async playBowManual() {
        if (this.audioCtx.state === 'suspended') {
            await this.audioCtx.resume();
        }
        if (!this.initialized) {
            await this.updateParams(this.params);
        }
        const soundId = `bow-${Date.now()}`;
        this.activeManualSounds.add(soundId);
        this.startVisualizations();
        this.bowSound.playBurst();
        setTimeout(() => {
            this.activeManualSounds.delete(soundId);
            this.checkVisualizationState();
        }, 2000);
    }

    async playChestManual() {
        if (this.audioCtx.state === 'suspended') {
            await this.audioCtx.resume();
        }
        if (!this.initialized) {
            await this.updateParams(this.params);
        }
        const soundId = `chest-${Date.now()}`;
        this.activeManualSounds.add(soundId);
        this.startVisualizations();
        this.chestSound.playBurst();
        setTimeout(() => {
            this.activeManualSounds.delete(soundId);
            this.checkVisualizationState();
        }, 2000);
    }

    async playFootstepsManual() {
        if (this.audioCtx.state === 'suspended') {
            await this.audioCtx.resume();
        }
        if (!this.initialized) {
            await this.updateParams(this.params);
        }
        const soundId = `footsteps-${Date.now()}`;
        this.activeManualSounds.add(soundId);
        this.startVisualizations();
        this.footstepsSound.playBurst();
        setTimeout(() => {
            this.activeManualSounds.delete(soundId);
            this.checkVisualizationState();
        }, 2000);
    }

    async playIdleManual() {
        if (this.audioCtx.state === 'suspended') {
            await this.audioCtx.resume();
        }
        if (!this.initialized) {
            await this.updateParams(this.params);
        }
        const soundId = `idle-${Date.now()}`;
        this.activeManualSounds.add(soundId);
        this.startVisualizations();
        this.humanIdleSound.playBurst();
        setTimeout(() => {
            this.activeManualSounds.delete(soundId);
            this.checkVisualizationState();
        }, 2000);
    }

    async playSpellManual() {
        if (this.audioCtx.state === 'suspended') {
            await this.audioCtx.resume();
        }
        if (!this.initialized) {
            await this.updateParams(this.params);
        }
        const soundId = `spell-${Date.now()}`;
        this.activeManualSounds.add(soundId);
        this.startVisualizations();
        this.spellSound.playBurst();
        setTimeout(() => {
            this.activeManualSounds.delete(soundId);
            this.checkVisualizationState();
        }, 2000);
    }

    async playSwordManual() {
        if (this.audioCtx.state === 'suspended') {
            await this.audioCtx.resume();
        }
        if (!this.initialized) {
            await this.updateParams(this.params);
        }
        const soundId = `sword-${Date.now()}`;
        this.activeManualSounds.add(soundId);
        this.startVisualizations();
        this.swordSound.playBurst();
        setTimeout(() => {
            this.activeManualSounds.delete(soundId);
            this.checkVisualizationState();
        }, 2000);
    }

    async playChopManual() {
        if (this.audioCtx.state === 'suspended') {
            await this.audioCtx.resume();
        }
        if (!this.initialized) {
            await this.updateParams(this.params);
        }
        const soundId = `treeChop-${Date.now()}`;
        this.activeManualSounds.add(soundId);
        this.startVisualizations();
        this.treeChopSound.playBurst();
        setTimeout(() => {
            this.activeManualSounds.delete(soundId);
            this.checkVisualizationState();
        }, 2000);
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