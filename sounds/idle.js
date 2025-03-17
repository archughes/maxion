// humanIdleSounds.js
export class HumanIdleSounds {
    constructor(audioCtx, masterGain, params = {}) {
        this.audioCtx = audioCtx;
        this.masterGain = masterGain;
        this.params = {
            humanIdleSoundType: params.humanIdleSoundType || 'breathing', 
            humanIdleIntensity: params.humanIdleIntensity || 2,           
            humanIdleVoiceType: params.humanIdleVoiceType || 2            
        };
        this.isPlaying = false;
        this.soundInterval = null;
        this.activeNodes = new Set();
    }

    start() {
        if (this.isPlaying) return;
        this.isPlaying = true;
        
        // Different interval timing based on sound type
        let intervalBase, intervalVariation;
        
        switch (this.params.humanIdleSoundType) {
            case 'breathing':
                // Breathing is continuous, no interval needed
                this.continuousBreathing();
                return;
            case 'hmm':
                intervalBase = 8; // Seconds between hmms
                intervalVariation = 4; // +/- random seconds
                break;
            case 'haaa':
                intervalBase = 10;
                intervalVariation = 5;
                break;
            case 'yawn':
                intervalBase = 30; // Yawns are less frequent
                intervalVariation = 15;
                break;
            case 'rambling':
                intervalBase = 5; // Almost continuous rambling with breaks
                intervalVariation = 3;
                break;
            default:
                intervalBase = 10;
                intervalVariation = 5;
        }
        
        const scheduleSound = () => {
            // Randomize interval
            const nextInterval = (intervalBase + (Math.random() * intervalVariation * 2 - intervalVariation)) * 1000;
            
            this.playSound();
            this.soundInterval = setTimeout(scheduleSound, nextInterval);
        };
        
        // Initial play
        scheduleSound();
    }

    stop() {
        if (!this.isPlaying) return;
        this.isPlaying = false;
        
        if (this.soundInterval) {
            clearTimeout(this.soundInterval);
            this.soundInterval = null;
        }
        
        // Stop all active nodes
        this.activeNodes.forEach(node => {
            if (node.stop) {
                try {
                    node.stop();
                } catch (e) {
                    // Handle already stopped nodes
                }
            }
        });
        this.activeNodes.clear();
    }

    playBurst() {
        this.playSound();
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
                // For burst mode only, continuous breathing uses different method
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
        // Base voice oscillator
        const baseFreq = this.getBaseFrequency();
        const voice = this.audioCtx.createOscillator();
        voice.type = 'sawtooth'; // Rich in harmonics like voice
        voice.frequency.value = baseFreq;
        
        // Modulation for voice-like quality
        const modulator = this.audioCtx.createOscillator();
        modulator.type = 'sine';
        modulator.frequency.value = 5 + Math.random() * 3; // Subtle vibrato
        
        const modulationGain = this.audioCtx.createGain();
        modulationGain.gain.value = baseFreq * 0.01; // Subtle frequency modulation
        
        modulator.connect(modulationGain);
        modulationGain.connect(voice.frequency);
        
        // Formant filter (mouth shape)
        const formantFilter = this.audioCtx.createBiquadFilter();
        formantFilter.type = 'bandpass';
        formantFilter.frequency.value = baseFreq * 2.5; // Formant for "mmm" sound
        formantFilter.Q.value = 5;
        
        // Additional resonance for "hmm" characteristic
        const noseFilter = this.audioCtx.createBiquadFilter();
        noseFilter.type = 'bandpass';
        noseFilter.frequency.value = 1000 + Math.random() * 500;
        noseFilter.Q.value = 10;
        
        // Master envelope
        const voiceGain = this.audioCtx.createGain();
        const volume = 0.1 + (this.params.humanIdleIntensity * 0.05);
        
        // "Hmm" envelope shape
        voiceGain.gain.setValueAtTime(0, startTime);
        voiceGain.gain.linearRampToValueAtTime(volume, startTime + 0.1);
        
        // Slight pitch down at the end of "hmm"
        voice.frequency.setValueAtTime(baseFreq, startTime);
        voice.frequency.linearRampToValueAtTime(baseFreq * 0.95, startTime + 0.5);
        
        // Duration based on intensity (louder = slightly longer)
        const duration = 0.5 + (this.params.humanIdleIntensity * 0.1);
        voiceGain.gain.linearRampToValueAtTime(volume * 0.8, startTime + duration * 0.8);
        voiceGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        
        // Connect everything
        voice.connect(formantFilter).connect(noseFilter).connect(voiceGain).connect(this.masterGain);
        
        // Start and stop
        modulator.start(startTime);
        voice.start(startTime);
        
        modulator.stop(startTime + duration);
        voice.stop(startTime + duration);
        
        this.activeNodes.add(modulator);
        this.activeNodes.add(voice);
        
        // Clean up when done
        modulator.onended = () => this.activeNodes.delete(modulator);
        voice.onended = () => this.activeNodes.delete(voice);
    }

    createHaaa(startTime) {
        // Base voice oscillator
        const baseFreq = this.getBaseFrequency();
        const voice = this.audioCtx.createOscillator();
        voice.type = 'sawtooth'; // Rich in harmonics like voice
        voice.frequency.value = baseFreq;
        
        // Modulation for voice-like quality
        const modulator = this.audioCtx.createOscillator();
        modulator.type = 'sine';
        modulator.frequency.value = 6 + Math.random() * 2; // Vibrato
        
        const modulationGain = this.audioCtx.createGain();
        modulationGain.gain.value = baseFreq * 0.015; // More pronounced vibrato for "haaa"
        
        modulator.connect(modulationGain);
        modulationGain.connect(voice.frequency);
        
        // Open vowel formant filter
        const formantFilter = this.audioCtx.createBiquadFilter();
        formantFilter.type = 'bandpass';
        formantFilter.frequency.value = baseFreq * 3; // "Aaa" formant
        formantFilter.Q.value = 2; // Wider bandwidth for open vowel
        
        // Secondary formant
        const formant2 = this.audioCtx.createBiquadFilter();
        formant2.type = 'peaking';
        formant2.frequency.value = baseFreq * 5;
        formant2.gain.value = 10;
        formant2.Q.value = 3;
        
        // Breathy noise component
        const breathNoise = this.audioCtx.createBufferSource();
        const noiseBuffer = this.createNoiseBuffer(1.0);
        breathNoise.buffer = noiseBuffer;
        
        const breathFilter = this.audioCtx.createBiquadFilter();
        breathFilter.type = 'highpass';
        breathFilter.frequency.value = 3000;
        
        const breathGain = this.audioCtx.createGain();
        breathGain.gain.value = 0.02 + (this.params.humanIdleIntensity * 0.01);
        
        // Master envelope
        const voiceGain = this.audioCtx.createGain();
        const volume = 0.15 + (this.params.humanIdleIntensity * 0.06);
        
        // "Haaa" envelope shape - longer attack and sustain
        voiceGain.gain.setValueAtTime(0, startTime);
        voiceGain.gain.linearRampToValueAtTime(volume, startTime + 0.2);
        
        // Duration based on intensity (louder = longer)
        const duration = 0.8 + (this.params.humanIdleIntensity * 0.3);
        
        // Decrease pitch slightly towards the end
        voice.frequency.setValueAtTime(baseFreq, startTime);
        voice.frequency.linearRampToValueAtTime(baseFreq * 0.92, startTime + duration);
        
        voiceGain.gain.setValueAtTime(volume, startTime + duration * 0.7);
        voiceGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        
        // Connect everything
        voice.connect(formantFilter).connect(formant2).connect(voiceGain).connect(this.masterGain);
        breathNoise.connect(breathFilter).connect(breathGain).connect(this.masterGain);
        
        // Start and stop
        modulator.start(startTime);
        voice.start(startTime);
        breathNoise.start(startTime);
        
        modulator.stop(startTime + duration);
        voice.stop(startTime + duration);
        breathNoise.stop(startTime + duration);
        
        this.activeNodes.add(modulator);
        this.activeNodes.add(voice);
        this.activeNodes.add(breathNoise);
        
        // Clean up when done
        modulator.onended = () => this.activeNodes.delete(modulator);
        voice.onended = () => this.activeNodes.delete(voice);
        breathNoise.onended = () => this.activeNodes.delete(breathNoise);
    }

    createRambling(startTime) {
        // Base voice oscillator
        const baseFreq = this.getBaseFrequency();
        const voice = this.audioCtx.createOscillator();
        voice.type = 'sawtooth';
        voice.frequency.value = baseFreq;
        
        // Create a basic formant structure for indistinct speech-like sounds
        // Multiple formant filters to simulate vocal tract
        const formants = [];
        const formantFreqs = [
            baseFreq * 1.5, // First formant
            baseFreq * 3.5, // Second formant
            baseFreq * 5,   // Third formant
        ];
        
        // Create and connect formant filters
        for (let i = 0; i < formantFreqs.length; i++) {
            const formant = this.audioCtx.createBiquadFilter();
            formant.type = 'bandpass';
            formant.frequency.value = formantFreqs[i];
            formant.Q.value = 5 + Math.random() * 10; // Varied resonance
            
            if (i === 0) {
                voice.connect(formant);
            } else {
                formants[i-1].connect(formant);
            }
            
            formants.push(formant);
        }
        
        // Speech modulation - complex pattern of frequency changes to simulate speech
        const syllableCount = 3 + Math.floor(Math.random() * 5); // 3-7 syllables
        const syllableDuration = 0.12 + Math.random() * 0.05; // 120-170ms per syllable
        const totalDuration = syllableCount * syllableDuration * 1.2; // Extra time for ending
        
        // Vibrato modulator for natural voice quality
        const vibrato = this.audioCtx.createOscillator();
        vibrato.type = 'sine';
        vibrato.frequency.value = 5 + Math.random() * 2; // 5-7 Hz vibrato
        
        const vibratoGain = this.audioCtx.createGain();
        vibratoGain.gain.value = baseFreq * 0.01; // Subtle vibrato amount
        
        vibrato.connect(vibratoGain).connect(voice.frequency);
        
        // Speech rhythm with frequency variations for syllables
        for (let i = 0; i < syllableCount; i++) {
            const syllableStart = startTime + (i * syllableDuration);
            const syllableMiddle = syllableStart + (syllableDuration * 0.3);
            const syllableEnd = syllableStart + syllableDuration;
            
            // Random pitch movement for each syllable
            const pitchVariation = 1 + (Math.random() * 0.2 - 0.1); // ±10% pitch variation
            
            voice.frequency.setValueAtTime(baseFreq, syllableStart);
            voice.frequency.linearRampToValueAtTime(baseFreq * pitchVariation, syllableMiddle);
            voice.frequency.linearRampToValueAtTime(baseFreq * 0.95 * pitchVariation, syllableEnd);
            
            // Randomly move formants to simulate different vowel sounds
            formants.forEach((formant, index) => {
                const formantVariation = 0.8 + Math.random() * 0.4; // 80-120% variation
                formant.frequency.setValueAtTime(formantFreqs[index], syllableStart);
                formant.frequency.linearRampToValueAtTime(formantFreqs[index] * formantVariation, syllableMiddle);
            });
        }
        
        // Add breathy noise component
        const breathNoise = this.audioCtx.createBufferSource();
        breathNoise.buffer = this.createNoiseBuffer(totalDuration);
        
        const breathFilter = this.audioCtx.createBiquadFilter();
        breathFilter.type = 'bandpass';
        breathFilter.frequency.value = 2500;
        breathFilter.Q.value = 0.5;
        
        const breathGain = this.audioCtx.createGain();
        breathGain.gain.value = 0.01 + (this.params.humanIdleIntensity * 0.005);
        
        breathNoise.connect(breathFilter).connect(breathGain);
        
        // Master envelope for voice
        const voiceGain = this.audioCtx.createGain();
        const volume = 0.1 + (this.params.humanIdleIntensity * 0.07);
        
        // Rambling speech envelope with variations
        voiceGain.gain.setValueAtTime(0, startTime);
        voiceGain.gain.linearRampToValueAtTime(volume, startTime + 0.05);
        
        // Create syllable-based amplitude variations
        for (let i = 0; i < syllableCount; i++) {
            const syllableStart = startTime + (i * syllableDuration);
            const syllableMiddle = syllableStart + (syllableDuration * 0.3);
            const syllableEnd = syllableStart + syllableDuration;
            
            // Amplitude contour for each syllable
            const emphasisFactor = Math.random() > 0.7 ? 1.2 : 0.9; // Occasional emphasis
            
            voiceGain.gain.setValueAtTime(volume * 0.7, syllableStart);
            voiceGain.gain.linearRampToValueAtTime(volume * emphasisFactor, syllableMiddle);
            voiceGain.gain.linearRampToValueAtTime(volume * 0.7, syllableEnd);
        }
        
        // Final fade out
        voiceGain.gain.linearRampToValueAtTime(volume * 0.5, startTime + totalDuration - 0.1);
        voiceGain.gain.exponentialRampToValueAtTime(0.001, startTime + totalDuration);
        
        // Connect everything to the master gain
        formants[formants.length-1].connect(voiceGain);
        breathGain.connect(voiceGain);
        voiceGain.connect(this.masterGain);
        
        // Start and stop
        vibrato.start(startTime);
        voice.start(startTime);
        breathNoise.start(startTime);
        
        vibrato.stop(startTime + totalDuration);
        voice.stop(startTime + totalDuration);
        breathNoise.stop(startTime + totalDuration);
        
        // Add to active nodes
        this.activeNodes.add(vibrato);
        this.activeNodes.add(voice);
        this.activeNodes.add(breathNoise);
        
        // Clean up when done
        vibrato.onended = () => this.activeNodes.delete(vibrato);
        voice.onended = () => this.activeNodes.delete(voice);
        breathNoise.onended = () => this.activeNodes.delete(breathNoise);
    }

    createYawn(startTime) {
        // Base voice oscillator
        const baseFreq = this.getBaseFrequency() * 0.85; // Slightly lower pitch for yawns
        const voice = this.audioCtx.createOscillator();
        voice.type = 'sawtooth';
        voice.frequency.value = baseFreq;
        
        // Yawn consists of three phases:
        // 1. Inhale (mouth opening)
        // 2. Main vowel sound (aaaaah)
        // 3. Trailing off/closing
        
        // Total duration based on intensity
        const intensity = this.params.humanIdleIntensity;
        const totalDuration = 1.5 + (intensity * 0.5); // 1.5-3.5 seconds
        
        // Phase durations
        const inhalePhase = totalDuration * 0.2;
        const mainPhase = totalDuration * 0.5;
        const trailPhase = totalDuration * 0.3;
        
        // Frequency modulation for natural voice
        const modulator = this.audioCtx.createOscillator();
        modulator.type = 'sine';
        modulator.frequency.value = 4 + Math.random(); // Slow modulation
        
        const modGain = this.audioCtx.createGain();
        modGain.gain.value = baseFreq * 0.01;
        
        modulator.connect(modGain).connect(voice.frequency);
        
        // Pitch contour for yawn
        // Starting low, rising during inhale, peaking, then falling
        voice.frequency.setValueAtTime(baseFreq * 0.9, startTime);
        voice.frequency.linearRampToValueAtTime(baseFreq * 1.2, startTime + inhalePhase);
        voice.frequency.linearRampToValueAtTime(baseFreq * 1.1, startTime + inhalePhase + mainPhase * 0.5);
        voice.frequency.linearRampToValueAtTime(baseFreq * 0.8, startTime + totalDuration);
        
        // Formant filters to shape the yawn sound
        // Opening mouth changes formant frequencies
        const formant1 = this.audioCtx.createBiquadFilter();
        formant1.type = 'bandpass';
        formant1.Q.value = 3;
        
        const formant2 = this.audioCtx.createBiquadFilter();
        formant2.type = 'bandpass';
        formant2.Q.value = 4;
        
        // Formant frequency movement to simulate mouth opening
        formant1.frequency.setValueAtTime(500, startTime); // Closed mouth
        formant1.frequency.linearRampToValueAtTime(800, startTime + inhalePhase); // Opening
        formant1.frequency.linearRampToValueAtTime(950, startTime + inhalePhase + mainPhase); // Open
        formant1.frequency.linearRampToValueAtTime(500, startTime + totalDuration); // Closing
        
        formant2.frequency.setValueAtTime(1200, startTime);
        formant2.frequency.linearRampToValueAtTime(1800, startTime + inhalePhase);
        formant2.frequency.linearRampToValueAtTime(2000, startTime + inhalePhase + mainPhase);
        formant2.frequency.linearRampToValueAtTime(1300, startTime + totalDuration);
        
        // Breath noise component
        const breathNoise = this.audioCtx.createBufferSource();
        breathNoise.buffer = this.createNoiseBuffer(totalDuration);
        
        const breathFilter = this.audioCtx.createBiquadFilter();
        breathFilter.type = 'bandpass';
        breathFilter.frequency.value = 2000;
        breathFilter.Q.value = 1;
        
        const breathGain = this.audioCtx.createGain();
        breathGain.gain.value = 0.01 + (intensity * 0.01);
        
        // Breath noise contour - more at beginning (inhale) and very end (exhale)
        breathGain.gain.setValueAtTime(0.02 + (intensity * 0.01), startTime);
        breathGain.gain.linearRampToValueAtTime(0.005, startTime + inhalePhase);
        breathGain.gain.linearRampToValueAtTime(0.005, startTime + inhalePhase + mainPhase);
        breathGain.gain.linearRampToValueAtTime(0.03 + (intensity * 0.01), startTime + totalDuration);
        
        breathNoise.connect(breathFilter).connect(breathGain);
        
        // Main voice gain for amplitude contour
        const voiceGain = this.audioCtx.createGain();
        const maxVolume = 0.1 + (intensity * 0.08);
        
        // Amplitude contour - gradually rising then falling
        voiceGain.gain.setValueAtTime(0, startTime);
        voiceGain.gain.linearRampToValueAtTime(maxVolume * 0.2, startTime + inhalePhase); // Inhale
        voiceGain.gain.linearRampToValueAtTime(maxVolume, startTime + inhalePhase + mainPhase * 0.5); // Peak
        voiceGain.gain.linearRampToValueAtTime(maxVolume * 0.3, startTime + inhalePhase + mainPhase);
        voiceGain.gain.exponentialRampToValueAtTime(0.001, startTime + totalDuration);
        
        // Connect everything
        voice.connect(formant1).connect(formant2).connect(voiceGain);
        breathGain.connect(voiceGain);
        voiceGain.connect(this.masterGain);
        
        // Start and stop oscillators
        modulator.start(startTime);
        voice.start(startTime);
        breathNoise.start(startTime);
        
        modulator.stop(startTime + totalDuration);
        voice.stop(startTime + totalDuration);
        breathNoise.stop(startTime + totalDuration);
        
        // Add to active nodes for cleanup
        this.activeNodes.add(modulator);
        this.activeNodes.add(voice);
        this.activeNodes.add(breathNoise);
        
        // Clean up when done
        modulator.onended = () => this.activeNodes.delete(modulator);
        voice.onended = () => this.activeNodes.delete(voice);
        breathNoise.onended = () => this.activeNodes.delete(breathNoise);
    }

    continuousBreathing() {
        if (!this.isPlaying) return;
        
        const breathCycleTime = 4 - (this.params.humanIdleIntensity * 0.4); // 2.4-4 seconds per breath cycle
        const currentTime = this.audioCtx.currentTime;
        
        let inhaleTime = breathCycleTime * 0.4; // 40% inhale
        let exhaleTime = breathCycleTime * 0.6; // 60% exhale
        
        // Schedule multiple breath cycles
        const numCycles = 3; // Schedule several cycles ahead
        
        for (let i = 0; i < numCycles; i++) {
            const cycleStart = currentTime + (i * breathCycleTime);
            // Randomly vary the cycle slightly
            const variationFactor = 0.95 + (Math.random() * 0.1); // ±5% variation
            
            this.createBreathCycle(
                cycleStart,
                inhaleTime * variationFactor,
                exhaleTime * variationFactor
            );
        }
        
        // Schedule the next batch of breath cycles
        setTimeout(() => {
            if (this.isPlaying) {
                this.continuousBreathing();
            }
        }, (breathCycleTime * (numCycles - 0.5)) * 1000); // Schedule before the last cycle ends
    }

    createBreathCycle(startTime, inhaleTime = 1.2, exhaleTime = 1.8) {
        // Create noise source
        const breathNoise = this.audioCtx.createBufferSource();
        breathNoise.buffer = this.createNoiseBuffer(inhaleTime + exhaleTime);
        
        // Filters to shape inhale and exhale sounds differently
        const inhaleFilter = this.audioCtx.createBiquadFilter();
        inhaleFilter.type = 'bandpass';
        inhaleFilter.frequency.value = 2000;
        inhaleFilter.Q.value = 1.5;
        
        const exhaleFilter = this.audioCtx.createBiquadFilter();
        exhaleFilter.type = 'bandpass';
        exhaleFilter.frequency.value = 1500;
        exhaleFilter.Q.value = 1;
        
        // Gain nodes for each phase
        const inhaleGain = this.audioCtx.createGain();
        const exhaleGain = this.audioCtx.createGain();
        
        // Crossfade node
        const masterGain = this.audioCtx.createGain();
        
        // Connect inhale path
        breathNoise.connect(inhaleFilter).connect(inhaleGain);
        
        // Connect exhale path
        breathNoise.connect(exhaleFilter).connect(exhaleGain);
        
        // Connect both to master
        inhaleGain.connect(masterGain);
        exhaleGain.connect(masterGain);
        masterGain.connect(this.masterGain);
        
        // Set volumes based on intensity
        const breathVolume = 0.02 + (this.params.humanIdleIntensity * 0.02);
        
        // Inhale envelope (crescendo)
        inhaleGain.gain.setValueAtTime(0, startTime);
        inhaleGain.gain.linearRampToValueAtTime(breathVolume, startTime + inhaleTime * 0.5);
        inhaleGain.gain.linearRampToValueAtTime(0, startTime + inhaleTime);
        
        // Exhale envelope (starts louder, then diminishes)
        exhaleGain.gain.setValueAtTime(0, startTime + inhaleTime);
        exhaleGain.gain.linearRampToValueAtTime(breathVolume * 1.2, startTime + inhaleTime + exhaleTime * 0.1);
        exhaleGain.gain.exponentialRampToValueAtTime(0.001, startTime + inhaleTime + exhaleTime);
        
        // Start and stop
        breathNoise.start(startTime);
        breathNoise.stop(startTime + inhaleTime + exhaleTime);
        
        this.activeNodes.add(breathNoise);
        
        // Clean up when done
        breathNoise.onended = () => this.activeNodes.delete(breathNoise);
    }

    createNoiseBuffer(duration = 1.0) {
        const sampleRate = this.audioCtx.sampleRate;
        const bufferSize = sampleRate * duration;
        const buffer = this.audioCtx.createBuffer(1, bufferSize, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        return buffer;
    }

    // Helper method to get base frequency based on voice type
    getBaseFrequency() {
        // Voice type ranges from 0 (deep) to 4 (high)
        const baseFreqs = {
            0: 85,   // Deep bass voice
            1: 110,  // Bass/baritone
            2: 140,  // Tenor/mid-range
            3: 175,  // Alto/soprano
            4: 210   // High soprano
        };
        
        // Add slight random variation to the base frequency
        const variation = 0.95 + (Math.random() * 0.1); // ±5% variation
        return baseFreqs[this.params.humanIdleVoiceType] * variation;
    }

    updateParams(newParams) {
        this.params = { ...this.params, ...newParams };
        
        // If playing, restart with new parameters if type changed
        if (this.isPlaying) {
            const oldType = this.params.humanIdleSoundType;
            const newType = newParams.soundType;
            
            if (newType && oldType !== newType) {
                this.stop();
                this.start();
            }
        }
    }
}