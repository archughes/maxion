import { SoundGenerator } from './SoundGenerator.js';

export class HumanIdleSounds extends SoundGenerator {
    constructor(audioCtx, masterGain, params = {}) {
        super(audioCtx, masterGain, {
            humanIdleSoundType: params.humanIdleSoundType || 'breathing',
            humanIdleIntensity: params.humanIdleIntensity || 2,
            humanIdleVoiceType: params.humanIdleVoiceType || 2
        });
        this.isPlaying = false;
        this.soundInterval = null;
    }

    start() {
        if (this.isPlaying) return;
        this.isPlaying = true;
        
        let intervalBase, intervalVariation;
        
        switch (this.params.humanIdleSoundType) {
            case 'breathing':
                this.continuousBreathing();
                return;
            case 'hmm':
                intervalBase = 8;
                intervalVariation = 4;
                break;
            case 'haaa':
                intervalBase = 10;
                intervalVariation = 5;
                break;
            case 'yawn':
                intervalBase = 30;
                intervalVariation = 15;
                break;
            case 'rambling':
                intervalBase = 5;
                intervalVariation = 3;
                break;
            default:
                intervalBase = 10;
                intervalVariation = 5;
        }
        
        const scheduleSound = () => {
            const nextInterval = (intervalBase + (Math.random() * intervalVariation * 2 - intervalVariation)) * 1000;
            this.playSound();
            this.soundInterval = setTimeout(scheduleSound, nextInterval);
        };
        
        scheduleSound();
    }

    stop() {
        if (!this.isPlaying) return;
        this.isPlaying = false;
        
        if (this.soundInterval) {
            clearTimeout(this.soundInterval);
            this.soundInterval = null;
        }
        
        super.stop(); // Use inherited stop method
    }

    playBurst() {
        this.playSound();
        // Timeout based on longest possible sound (yawn at max intensity: ~1.5s)
        this.timeout = setTimeout(() => this.stop(), 1500);
    }

    playSound(startTime = this.audioCtx.currentTime) {
        switch (this.params.humanIdleSoundType) {
            case 'hmm':
                this.createHmm(startTime);
                break;
            case 'haaa':
                this.createHaaa(startTime);
                break;
            case 'yawn':
                this.createYawn(startTime);
                break;
            case 'breathing':
                this.createBreathCycle(startTime);
                break;
            case 'rambling':
                this.createRambling(startTime);
                break;
            default:
                this.createBreathCycle(startTime);
        }
    }

    createHmm(startTime) {
        const baseFreq = this.getBaseFrequency();
        const voice = this.audioCtx.createOscillator();
        voice.type = 'sawtooth';
        voice.frequency.value = baseFreq;
        
        const modulator = this.audioCtx.createOscillator();
        modulator.type = 'sine';
        modulator.frequency.value = 5 + Math.random() * 3;
        
        const modulationGain = this.audioCtx.createGain();
        modulationGain.gain.value = baseFreq * 0.01;
        
        modulator.connect(modulationGain);
        modulationGain.connect(voice.frequency);
        
        const formantFilter = this.audioCtx.createBiquadFilter();
        formantFilter.type = 'bandpass';
        formantFilter.frequency.value = baseFreq * 2.5;
        formantFilter.Q.value = 5;
        
        const noseFilter = this.audioCtx.createBiquadFilter();
        noseFilter.type = 'bandpass';
        noseFilter.frequency.value = 1000 + Math.random() * 500;
        noseFilter.Q.value = 10;
        
        const voiceGain = this.audioCtx.createGain();
        const volume = 0.1 + (this.params.humanIdleIntensity * 0.05);
        
        voiceGain.gain.setValueAtTime(0, startTime);
        voiceGain.gain.linearRampToValueAtTime(volume, startTime + 0.1);
        
        voice.frequency.setValueAtTime(baseFreq, startTime);
        voice.frequency.linearRampToValueAtTime(baseFreq * 0.95, startTime + 0.5);
        
        const duration = 0.5 + (this.params.humanIdleIntensity * 0.1);
        voiceGain.gain.linearRampToValueAtTime(volume * 0.8, startTime + duration * 0.8);
        voiceGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        
        voice.connect(formantFilter).connect(noseFilter).connect(voiceGain).connect(this.masterGain);
        
        modulator.start(startTime);
        voice.start(startTime);
        
        modulator.stop(startTime + duration);
        voice.stop(startTime + duration);
        
        this.addActiveNode(modulator);
        this.addActiveNode(voice);
    }

    createHaaa(startTime) {
        const baseFreq = this.getBaseFrequency();
        const voice = this.audioCtx.createOscillator();
        voice.type = 'sawtooth';
        voice.frequency.value = baseFreq;
        
        const modulator = this.audioCtx.createOscillator();
        modulator.type = 'sine';
        modulator.frequency.value = 6 + Math.random() * 2;
        
        const modulationGain = this.audioCtx.createGain();
        modulationGain.gain.value = baseFreq * 0.015;
        
        modulator.connect(modulationGain);
        modulationGain.connect(voice.frequency);
        
        const formantFilter = this.audioCtx.createBiquadFilter();
        formantFilter.type = 'bandpass';
        formantFilter.frequency.value = baseFreq * 3;
        formantFilter.Q.value = 2;
        
        const formant2 = this.audioCtx.createBiquadFilter();
        formant2.type = 'peaking';
        formant2.frequency.value = baseFreq * 5;
        formant2.gain.value = 10;
        formant2.Q.value = 3;
        
        const breathNoise = this.audioCtx.createBufferSource();
        const noiseBuffer = this.createNoiseBuffer(1.0);
        breathNoise.buffer = noiseBuffer;
        
        const breathFilter = this.audioCtx.createBiquadFilter();
        breathFilter.type = 'highpass';
        breathFilter.frequency.value = 3000;
        
        const breathGain = this.audioCtx.createGain();
        breathGain.gain.value = 0.02 + (this.params.humanIdleIntensity * 0.01);
        
        const voiceGain = this.audioCtx.createGain();
        const volume = 0.15 + (this.params.humanIdleIntensity * 0.06);
        
        voiceGain.gain.setValueAtTime(0, startTime);
        voiceGain.gain.linearRampToValueAtTime(volume, startTime + 0.2);
        
        const duration = 0.8 + (this.params.humanIdleIntensity * 0.3);
        
        voice.frequency.setValueAtTime(baseFreq, startTime);
        voice.frequency.linearRampToValueAtTime(baseFreq * 0.92, startTime + duration);
        
        voiceGain.gain.setValueAtTime(volume, startTime + duration * 0.7);
        voiceGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        
        voice.connect(formantFilter).connect(formant2).connect(voiceGain).connect(this.masterGain);
        breathNoise.connect(breathFilter).connect(breathGain).connect(this.masterGain);
        
        modulator.start(startTime);
        voice.start(startTime);
        breathNoise.start(startTime);
        
        modulator.stop(startTime + duration);
        voice.stop(startTime + duration);
        breathNoise.stop(startTime + duration);
        
        this.addActiveNode(modulator);
        this.addActiveNode(voice);
        this.addActiveNode(breathNoise);
    }

    createRambling(startTime) {
        const baseFreq = this.getBaseFrequency();
        const voice = this.audioCtx.createOscillator();
        voice.type = 'sawtooth';
        voice.frequency.value = baseFreq;
        
        const formants = [];
        const formantFreqs = [
            baseFreq * 1.5,
            baseFreq * 3.5,
            baseFreq * 5,
        ];
        
        for (let i = 0; i < formantFreqs.length; i++) {
            const formant = this.audioCtx.createBiquadFilter();
            formant.type = 'bandpass';
            formant.frequency.value = formantFreqs[i];
            formant.Q.value = 5 + Math.random() * 10;
            
            if (i === 0) {
                voice.connect(formant);
            } else {
                formants[i-1].connect(formant);
            }
            
            formants.push(formant);
        }
        
        const syllableCount = 3 + Math.floor(Math.random() * 5);
        const syllableDuration = 0.12 + Math.random() * 0.05;
        const totalDuration = syllableCount * syllableDuration * 1.2;
        
        const vibrato = this.audioCtx.createOscillator();
        vibrato.type = 'sine';
        vibrato.frequency.value = 5 + Math.random() * 2;
        
        const vibratoGain = this.audioCtx.createGain();
        vibratoGain.gain.value = baseFreq * 0.01;
        
        vibrato.connect(vibratoGain).connect(voice.frequency);
        
        for (let i = 0; i < syllableCount; i++) {
            const syllableStart = startTime + (i * syllableDuration);
            const syllableMiddle = syllableStart + (syllableDuration * 0.3);
            const syllableEnd = syllableStart + syllableDuration;
            
            const pitchVariation = 1 + (Math.random() * 0.2 - 0.1);
            
            voice.frequency.setValueAtTime(baseFreq, syllableStart);
            voice.frequency.linearRampToValueAtTime(baseFreq * pitchVariation, syllableMiddle);
            voice.frequency.linearRampToValueAtTime(baseFreq * 0.95 * pitchVariation, syllableEnd);
            
            formants.forEach((formant, index) => {
                const formantVariation = 0.8 + Math.random() * 0.4;
                formant.frequency.setValueAtTime(formantFreqs[index], syllableStart);
                formant.frequency.linearRampToValueAtTime(formantFreqs[index] * formantVariation, syllableMiddle);
            });
        }
        
        const breathNoise = this.audioCtx.createBufferSource();
        breathNoise.buffer = this.createNoiseBuffer(totalDuration);
        
        const breathFilter = this.audioCtx.createBiquadFilter();
        breathFilter.type = 'bandpass';
        breathFilter.frequency.value = 2500;
        breathFilter.Q.value = 0.5;
        
        const breathGain = this.audioCtx.createGain();
        breathGain.gain.value = 0.01 + (this.params.humanIdleIntensity * 0.005);
        
        breathNoise.connect(breathFilter).connect(breathGain);
        
        const voiceGain = this.audioCtx.createGain();
        const volume = 0.1 + (this.params.humanIdleIntensity * 0.07);
        
        voiceGain.gain.setValueAtTime(0, startTime);
        voiceGain.gain.linearRampToValueAtTime(volume, startTime + 0.05);
        
        for (let i = 0; i < syllableCount; i++) {
            const syllableStart = startTime + (i * syllableDuration);
            const syllableMiddle = syllableStart + (syllableDuration * 0.3);
            const syllableEnd = syllableStart + syllableDuration;
            
            const emphasisFactor = Math.random() > 0.7 ? 1.2 : 0.9;
            
            voiceGain.gain.setValueAtTime(volume * 0.7, syllableStart);
            voiceGain.gain.linearRampToValueAtTime(volume * emphasisFactor, syllableMiddle);
            voiceGain.gain.linearRampToValueAtTime(volume * 0.7, syllableEnd);
        }
        
        voiceGain.gain.linearRampToValueAtTime(volume * 0.5, startTime + totalDuration - 0.1);
        voiceGain.gain.exponentialRampToValueAtTime(0.001, startTime + totalDuration);
        
        formants[formants.length-1].connect(voiceGain);
        breathGain.connect(voiceGain);
        voiceGain.connect(this.masterGain);
        
        vibrato.start(startTime);
        voice.start(startTime);
        breathNoise.start(startTime);
        
        vibrato.stop(startTime + totalDuration);
        voice.stop(startTime + totalDuration);
        breathNoise.stop(startTime + totalDuration);
        
        this.addActiveNode(vibrato);
        this.addActiveNode(voice);
        this.addActiveNode(breathNoise);
    }

    createYawn(startTime) {
        const baseFreq = this.getBaseFrequency() * 0.85;
        const voice = this.audioCtx.createOscillator();
        voice.type = 'sawtooth';
        voice.frequency.value = baseFreq;
        
        const intensity = this.params.humanIdleIntensity;
        const totalDuration = 1.5 + (intensity * 0.5);
        
        const inhalePhase = totalDuration * 0.2;
        const mainPhase = totalDuration * 0.5;
        const trailPhase = totalDuration * 0.3;
        
        const modulator = this.audioCtx.createOscillator();
        modulator.type = 'sine';
        modulator.frequency.value = 4 + Math.random();
        
        const modGain = this.audioCtx.createGain();
        modGain.gain.value = baseFreq * 0.01;
        
        modulator.connect(modGain).connect(voice.frequency);
        
        voice.frequency.setValueAtTime(baseFreq * 0.9, startTime);
        voice.frequency.linearRampToValueAtTime(baseFreq * 1.2, startTime + inhalePhase);
        voice.frequency.linearRampToValueAtTime(baseFreq * 1.1, startTime + inhalePhase + mainPhase * 0.5);
        voice.frequency.linearRampToValueAtTime(baseFreq * 0.8, startTime + totalDuration);
        
        const formant1 = this.audioCtx.createBiquadFilter();
        formant1.type = 'bandpass';
        formant1.Q.value = 3;
        
        const formant2 = this.audioCtx.createBiquadFilter();
        formant2.type = 'bandpass';
        formant2.Q.value = 4;
        
        formant1.frequency.setValueAtTime(500, startTime);
        formant1.frequency.linearRampToValueAtTime(800, startTime + inhalePhase);
        formant1.frequency.linearRampToValueAtTime(950, startTime + inhalePhase + mainPhase);
        formant1.frequency.linearRampToValueAtTime(500, startTime + totalDuration);
        
        formant2.frequency.setValueAtTime(1200, startTime);
        formant2.frequency.linearRampToValueAtTime(1800, startTime + inhalePhase);
        formant2.frequency.linearRampToValueAtTime(2000, startTime + inhalePhase + mainPhase);
        formant2.frequency.linearRampToValueAtTime(1300, startTime + totalDuration);
        
        const breathNoise = this.audioCtx.createBufferSource();
        breathNoise.buffer = this.createNoiseBuffer(totalDuration);
        
        const breathFilter = this.audioCtx.createBiquadFilter();
        breathFilter.type = 'bandpass';
        breathFilter.frequency.value = 2000;
        breathFilter.Q.value = 1;
        
        const breathGain = this.audioCtx.createGain();
        breathGain.gain.value = 0.01 + (intensity * 0.01);
        
        breathGain.gain.setValueAtTime(0.02 + (intensity * 0.01), startTime);
        breathGain.gain.linearRampToValueAtTime(0.005, startTime + inhalePhase);
        breathGain.gain.linearRampToValueAtTime(0.005, startTime + inhalePhase + mainPhase);
        breathGain.gain.linearRampToValueAtTime(0.03 + (intensity * 0.01), startTime + totalDuration);
        
        breathNoise.connect(breathFilter).connect(breathGain);
        
        const voiceGain = this.audioCtx.createGain();
        const maxVolume = 0.1 + (intensity * 0.08);
        
        voiceGain.gain.setValueAtTime(0, startTime);
        voiceGain.gain.linearRampToValueAtTime(maxVolume * 0.2, startTime + inhalePhase);
        voiceGain.gain.linearRampToValueAtTime(maxVolume, startTime + inhalePhase + mainPhase * 0.5);
        voiceGain.gain.linearRampToValueAtTime(maxVolume * 0.3, startTime + inhalePhase + mainPhase);
        voiceGain.gain.exponentialRampToValueAtTime(0.001, startTime + totalDuration);
        
        voice.connect(formant1).connect(formant2).connect(voiceGain);
        breathGain.connect(voiceGain);
        voiceGain.connect(this.masterGain);
        
        modulator.start(startTime);
        voice.start(startTime);
        breathNoise.start(startTime);
        
        modulator.stop(startTime + totalDuration);
        voice.stop(startTime + totalDuration);
        breathNoise.stop(startTime + totalDuration);
        
        this.addActiveNode(modulator);
        this.addActiveNode(voice);
        this.addActiveNode(breathNoise);
    }

    continuousBreathing() {
        if (!this.isPlaying) return;
        
        const breathCycleTime = 4 - (this.params.humanIdleIntensity * 0.4);
        const currentTime = this.audioCtx.currentTime;
        
        let inhaleTime = breathCycleTime * 0.4;
        let exhaleTime = breathCycleTime * 0.6;
        
        const numCycles = 3;
        
        for (let i = 0; i < numCycles; i++) {
            const cycleStart = currentTime + (i * breathCycleTime);
            const variationFactor = 0.95 + (Math.random() * 0.1);
            
            this.createBreathCycle(
                cycleStart,
                inhaleTime * variationFactor,
                exhaleTime * variationFactor
            );
        }
        
        setTimeout(() => {
            if (this.isPlaying) {
                this.continuousBreathing();
            }
        }, (breathCycleTime * (numCycles - 0.5)) * 1000);
    }

    createBreathCycle(startTime, inhaleTime = 1.2, exhaleTime = 1.8) {
        const breathNoise = this.audioCtx.createBufferSource();
        breathNoise.buffer = this.createNoiseBuffer(inhaleTime + exhaleTime);
        
        const inhaleFilter = this.audioCtx.createBiquadFilter();
        inhaleFilter.type = 'bandpass';
        inhaleFilter.frequency.value = 2000;
        inhaleFilter.Q.value = 1.5;
        
        const exhaleFilter = this.audioCtx.createBiquadFilter();
        exhaleFilter.type = 'bandpass';
        exhaleFilter.frequency.value = 1500;
        exhaleFilter.Q.value = 1;
        
        const inhaleGain = this.audioCtx.createGain();
        const exhaleGain = this.audioCtx.createGain();
        
        const masterGain = this.audioCtx.createGain();
        
        breathNoise.connect(inhaleFilter).connect(inhaleGain);
        breathNoise.connect(exhaleFilter).connect(exhaleGain);
        
        inhaleGain.connect(masterGain);
        exhaleGain.connect(masterGain);
        masterGain.connect(this.masterGain);
        
        const breathVolume = 0.02 + (this.params.humanIdleIntensity * 0.02);
        
        inhaleGain.gain.setValueAtTime(0, startTime);
        inhaleGain.gain.linearRampToValueAtTime(breathVolume, startTime + inhaleTime * 0.5);
        inhaleGain.gain.linearRampToValueAtTime(0, startTime + inhaleTime);
        
        exhaleGain.gain.setValueAtTime(0, startTime + inhaleTime);
        exhaleGain.gain.linearRampToValueAtTime(breathVolume * 1.2, startTime + inhaleTime + exhaleTime * 0.1);
        exhaleGain.gain.exponentialRampToValueAtTime(0.001, startTime + inhaleTime + exhaleTime);
        
        breathNoise.start(startTime);
        breathNoise.stop(startTime + inhaleTime + exhaleTime);
        
        this.addActiveNode(breathNoise);
    }

    getBaseFrequency() {
        const baseFreqs = {
            0: 85,
            1: 110,
            2: 140,
            3: 175,
            4: 210
        };
        
        const variation = 0.95 + (Math.random() * 0.1);
        return baseFreqs[this.params.humanIdleVoiceType] * variation;
    }
}