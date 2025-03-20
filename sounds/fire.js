import { SoundGenerator } from './SoundGenerator.js';

export class FireSound extends SoundGenerator {
    constructor(audioCtx, masterGain, params = {}) {
        super(audioCtx, masterGain, {
            fireIntensity: params.fireIntensity || 0,
            fireCrackleRate: params.fireCrackleRate || 0
        });
        
        this.whiteNoiseBuffer = this.createNoiseBuffer(2);
        
        this.rumbleSource = null;
        this.rumbleFilter = null;
        this.rumbleGain = null;
        this.rumbleLFO = null;
        this.rumbleLFOGain = null;
        this.modulationLFO = null;
    }

    start() {
        if (this.params.fireIntensity <= 0 || this.timeout) return;

        this.startRumble();
        
        const scheduleCrackle = () => {
            const baseInterval = 0.3 + (5 - this.params.fireCrackleRate) * 0.8;
            const randomVariance = (Math.random() * 2 - 1) * baseInterval;
            const crackleInterval = Math.max(0.1, baseInterval + randomVariance);
            
            const scheduleDelay = crackleInterval * 1000;
            this.timeout = setTimeout(() => {
                if (Math.random() < (0.3 + this.params.fireCrackleRate / 5)) {
                    this.scheduleFractalCrackle(this.audioCtx.currentTime);
                }
                scheduleCrackle();
            }, scheduleDelay);
        };
        
        scheduleCrackle();
    }

    startRumble() {
        this.rumbleSource = this.audioCtx.createBufferSource();
        this.rumbleSource.buffer = this.whiteNoiseBuffer;
        this.rumbleSource.loop = true;
        
        this.rumbleFilter = this.audioCtx.createBiquadFilter();
        this.rumbleFilter.type = 'lowpass';
        this.rumbleFilter.frequency.value = 120;
        this.rumbleFilter.Q.value = 0.8;
        
        this.rumbleGain = this.audioCtx.createGain();
        this.rumbleGain.gain.value = this.params.fireIntensity / 15;
        
        this.rumbleLFO = this.audioCtx.createOscillator();
        this.rumbleLFO.type = 'sine';
        this.rumbleLFO.frequency.value = 0.2 + Math.random() * 0.3;
        
        this.rumbleLFOGain = this.audioCtx.createGain();
        this.rumbleLFOGain.gain.value = 30;
        
        this.modulationLFO = this.audioCtx.createOscillator();
        this.modulationLFO.type = 'sine';
        this.modulationLFO.frequency.value = 0.07 + Math.random() * 0.1;
        
        const modulationGain = this.audioCtx.createGain();
        modulationGain.gain.value = 0.7;
        
        this.modulationLFO.connect(modulationGain);
        modulationGain.connect(this.rumbleLFOGain.gain);
        
        this.rumbleLFO.connect(this.rumbleLFOGain);
        this.rumbleLFOGain.connect(this.rumbleFilter.frequency);
        
        this.rumbleSource.connect(this.rumbleFilter);
        this.rumbleFilter.connect(this.rumbleGain);
        this.rumbleGain.connect(this.masterGain);
        
        this.rumbleLFO.start();
        this.modulationLFO.start();
        this.rumbleSource.start();
        
        this.addActiveNode(this.rumbleSource);
        this.addActiveNode(this.rumbleLFO);
        this.addActiveNode(this.modulationLFO);
    }

    stop() {
        super.stop();
    }

    scheduleFractalCrackle(startTime) {
        const isBigPop = Math.random() < 0.15;
        const frequencyBase = isBigPop ? 250 : 800;
        const frequencyRange = isBigPop ? [250, 600] : [800, 3000];
        const duration = isBigPop ? 0.3 : 0.08 + Math.random() * 0.07;
        const amplitudeMultiplier = isBigPop ? 1.5 : 0.7;

        const randomPitchOffset = ((Math.random() * 2) - 1) * frequencyBase;
        const actualFrequency = Math.max(
            frequencyRange[0], 
            Math.min(frequencyRange[1], frequencyBase + randomPitchOffset)
        );

        const primarySource = this.audioCtx.createBufferSource();
        primarySource.buffer = this.whiteNoiseBuffer;
        
        const primaryFilter = this.audioCtx.createBiquadFilter();
        primaryFilter.type = 'bandpass';
        primaryFilter.frequency.value = actualFrequency;
        primaryFilter.Q.value = isBigPop ? 8 : 20;
        
        const primaryGain = this.audioCtx.createGain();
        const primaryAmplitude = Math.max(
            0.001, // Minimum safe value
            (this.params.fireIntensity / 4) * (0.3 + Math.random() * 0.7) * amplitudeMultiplier
        );
        
        primaryGain.gain.setValueAtTime(0.001, startTime);
        primaryGain.gain.exponentialRampToValueAtTime(primaryAmplitude, startTime + 0.005);
        primaryGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        
        primarySource.connect(primaryFilter).connect(primaryGain).connect(this.masterGain);
        primarySource.start(startTime, Math.random() * (this.whiteNoiseBuffer.duration - duration), duration);
        this.addActiveNode(primarySource);

        if (Math.random() < 0.6 && this.params.fireIntensity > 1) {
            const secondaryDelay = 0.01 + Math.random() * 0.03;
            const secondarySource = this.audioCtx.createBufferSource();
            secondarySource.buffer = this.whiteNoiseBuffer;
            
            const secondaryFilter = this.audioCtx.createBiquadFilter();
            secondaryFilter.type = 'bandpass';
            secondaryFilter.frequency.value = actualFrequency * (1.5 + Math.random() * 0.5);
            secondaryFilter.Q.value = 25;
            
            const secondaryGain = this.audioCtx.createGain();
            const secondaryAmplitude = Math.max(0.001, primaryAmplitude * 0.6);
            secondaryGain.gain.setValueAtTime(0.001, startTime + secondaryDelay);
            secondaryGain.gain.exponentialRampToValueAtTime(secondaryAmplitude, startTime + secondaryDelay + 0.003);
            secondaryGain.gain.exponentialRampToValueAtTime(0.001, startTime + secondaryDelay + 0.05);

            secondarySource.connect(secondaryFilter).connect(secondaryGain).connect(this.masterGain);
            secondarySource.start(startTime + secondaryDelay, Math.random() * this.whiteNoiseBuffer.duration, 0.06);
            this.addActiveNode(secondarySource);
            
            if (isBigPop && Math.random() < 0.4) {
                const tertiaryDelay = secondaryDelay + 0.01 + Math.random() * 0.02;
                const tertiarySource = this.audioCtx.createBufferSource();
                tertiarySource.buffer = this.whiteNoiseBuffer;
                
                const tertiaryFilter = this.audioCtx.createBiquadFilter();
                tertiaryFilter.type = 'bandpass';
                tertiaryFilter.frequency.value = 4000 + Math.random() * 3000;
                tertiaryFilter.Q.value = 30;
                
                const tertiaryGain = this.audioCtx.createGain();
                const tertiaryAmplitude = Math.max(0.001, secondaryAmplitude * 0.4);
                tertiaryGain.gain.setValueAtTime(0.001, startTime + tertiaryDelay);
                tertiaryGain.gain.exponentialRampToValueAtTime(tertiaryAmplitude, startTime + tertiaryDelay + 0.002);
                tertiaryGain.gain.exponentialRampToValueAtTime(0.001, startTime + tertiaryDelay + 0.03);

                tertiarySource.connect(tertiaryFilter).connect(tertiaryGain).connect(this.masterGain);
                tertiarySource.start(startTime + tertiaryDelay, Math.random() * this.whiteNoiseBuffer.duration, 0.04);
                this.addActiveNode(tertiarySource);
            }
        }
    }

    playBurst() {
        if (this.params.fireIntensity <= 0) return; // Don’t play if intensity is 0

        const burstDuration = 4;
        const numCrackles = Math.floor(2 + this.params.fireIntensity * 3);
        const currentTime = this.audioCtx.currentTime;
        
        this.startRumble();
        
        for (let i = 0; i < numCrackles; i++) {
            const distribution = Math.pow(Math.random(), 1.5);
            const crackleTime = currentTime + distribution * (burstDuration - 0.3);
            this.scheduleFractalCrackle(crackleTime);
        }
        
        this.timeout = setTimeout(() => this.stop(), burstDuration * 1000);
    }

    updateParams(newParams) {
        const wasActive = this.params.fireIntensity > 0;
        super.updateParams(newParams);
        const isActive = this.params.fireIntensity > 0;
        
        if (!wasActive && isActive) {
            this.start();
        } else if (wasActive && !isActive) {
            this.stop();
        } else if (wasActive && isActive && this.rumbleGain) {
            this.rumbleGain.gain.value = this.params.fireIntensity / 15;
        }
    }
}