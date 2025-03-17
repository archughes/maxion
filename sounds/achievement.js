// achievementSound.js
export class AchievementSound {
    constructor(audioCtx, masterGain, params) {
        this.audioCtx = audioCtx;
        this.masterGain = masterGain;
        this.params = {
            achievementType: params.achievementType || 'levelUp', // 'levelUp', 'minorQuest', 'majorQuest'
            achievementImportance: params.achievementImportance || 2, // Significance level (0-4)
            achievementStyle: params.achievementStyle || 'fantasy' // 'fantasy', 'sci-fi', 'minimal'
        };
        this.oscillators = [];
        this.activeSounds = new Set();
    }

    start() {
        const currentTime = this.audioCtx.currentTime;
        
        switch(this.params.achievementType) {
            case 'levelUp':
                this.createLevelUpSound(currentTime);
                break;
            case 'minorQuest':
                this.createMinorQuestSound(currentTime);
                break;
            case 'majorQuest':
                this.createMajorQuestSound(currentTime);
                break;
        }
    }
    
    createLevelUpSound(startTime) {
        // Level up is typically an ascending sequence
        const noteCount = 3 + Math.floor(this.params.achievementImportance);
        const noteDuration = 0.15;
        const totalDuration = noteCount * noteDuration;
        
        // Base frequency depends on style
        let baseFreq = 440; // A4 for fantasy
        if (this.params.achievementStyle === 'sci-fi') {
            baseFreq = 523.25; // C5 for sci-fi
        } else if (this.params.achievementStyle === 'minimal') {
            baseFreq = 392; // G4 for minimal
        }
        
        // Create ascending pattern
        for (let i = 0; i < noteCount; i++) {
            const noteTime = startTime + (i * noteDuration);
            
            // Create main tone
            const osc = this.audioCtx.createOscillator();
            osc.type = this.params.achievementStyle === 'sci-fi' ? 'sawtooth' : 'sine';
            
            // Calculate note frequency - major scale steps
            const interval = [0, 2, 4, 5, 7, 9, 11, 12][i % 8];
            const freq = baseFreq * Math.pow(2, interval/12);
            osc.frequency.setValueAtTime(freq, noteTime);
            
            // Set up envelope
            const gain = this.audioCtx.createGain();
            gain.gain.setValueAtTime(0, noteTime);
            gain.gain.linearRampToValueAtTime(0.2 + (this.params.achievementImportance * 0.05), noteTime + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, noteTime + noteDuration * 0.95);
            
            osc.connect(gain).connect(this.masterGain);
            osc.start(noteTime);
            osc.stop(noteTime + noteDuration);
            this.oscillators.push(osc);
            this.activeSounds.add(osc);
            osc.onended = () => this.activeSounds.delete(osc);
            
            // Add harmonics for fantasy style
            if (this.params.achievementStyle === 'fantasy' && this.params.achievementImportance > 2) {
                this.addHarmonics(noteTime, freq, noteDuration);
            }
            
            // Add shimmer for the final note
            if (i === noteCount - 1) {
                this.addFinalNoteShimmer(noteTime, freq, noteDuration * 2);
            }
        }
        
        // Add a final chord for major achievements
        if (this.params.achievementImportance >= 3) {
            this.addFinalChord(startTime + totalDuration, baseFreq);
        }
    }
    
    createMinorQuestSound(startTime) {
        // Minor quest completion - simple fanfare
        const duration = 0.3 + (this.params.achievementImportance * 0.1);
        
        // Create main tones - two-note fanfare
        const osc1 = this.audioCtx.createOscillator();
        const osc2 = this.audioCtx.createOscillator();
        
        osc1.type = this.params.achievementStyle === 'sci-fi' ? 'square' : 'sine';
        osc2.type = this.params.achievementStyle === 'sci-fi' ? 'square' : 'sine';
        
        // Base frequency depends on style
        let baseFreq = 349.23; // F4 for fantasy/default
        if (this.params.achievementStyle === 'sci-fi') {
            baseFreq = 391.99; // G4 for sci-fi
        } else if (this.params.achievementStyle === 'minimal') {
            baseFreq = 329.63; // E4 for minimal
        }
        
        osc1.frequency.setValueAtTime(baseFreq, startTime);
        osc2.frequency.setValueAtTime(baseFreq * 1.5, startTime + duration * 0.5); // Perfect fifth up
        
        // Set up envelopes
        const gain1 = this.audioCtx.createGain();
        gain1.gain.setValueAtTime(0, startTime);
        gain1.gain.linearRampToValueAtTime(0.15 + (this.params.achievementImportance * 0.04), startTime + 0.05);
        gain1.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 0.6);
        
        const gain2 = this.audioCtx.createGain();
        gain2.gain.setValueAtTime(0, startTime + duration * 0.5);
        gain2.gain.linearRampToValueAtTime(0.15 + (this.params.achievementImportance * 0.04), startTime + duration * 0.55);
        gain2.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 1.2);
        
        osc1.connect(gain1).connect(this.masterGain);
        osc2.connect(gain2).connect(this.masterGain);
        
        osc1.start(startTime);
        osc1.stop(startTime + duration * 0.7);
        osc2.start(startTime + duration * 0.5);
        osc2.stop(startTime + duration * 1.3);
        
        this.oscillators.push(osc1, osc2);
        this.activeSounds.add(osc1);
        this.activeSounds.add(osc2);
        osc1.onended = () => this.activeSounds.delete(osc1);
        osc2.onended = () => this.activeSounds.delete(osc2);
        
        // Add a subtle background shimmer for higher importance
        if (this.params.achievementImportance >= 2) {
            this.addBackgroundShimmer(startTime, baseFreq, duration * 1.5);
        }
    }
    
    createMajorQuestSound(startTime) {
        // Major quest completion - full fanfare with multiple phrases
        const noteDuration = 0.15;
        const pauseDuration = 0.4;
        
        // Base frequency depends on style
        let baseFreq = 440; // A4 for fantasy
        if (this.params.achievementStyle === 'sci-fi') {
            baseFreq = 523.25; // C5 for sci-fi
        } else if (this.params.achievementStyle === 'minimal') {
            baseFreq = 392; // G4 for minimal
        }
        
        // First section - ascending theme similar to level up
        const noteCount = 4 + Math.floor(this.params.achievementImportance / 2);
        for (let i = 0; i < noteCount; i++) {
            const noteTime = startTime + (i * noteDuration);
            
            // Create main tone
            const osc = this.audioCtx.createOscillator();
            osc.type = this.params.achievementStyle === 'sci-fi' ? 'sawtooth' : 'sine';
            
            // Calculate note frequency - major scale steps for chord progression
            const intervals = [0, 4, 7, 12, 7, 4, 7, 12]; // More dramatic pattern
            const freq = baseFreq * Math.pow(2, intervals[i % intervals.length]/12);
            osc.frequency.setValueAtTime(freq, noteTime);
            
            // Set up envelope
            const gain = this.audioCtx.createGain();
            gain.gain.setValueAtTime(0, noteTime);
            gain.gain.linearRampToValueAtTime(0.2 + (this.params.achievementImportance * 0.05), noteTime + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, noteTime + noteDuration * 0.95);
            
            osc.connect(gain).connect(this.masterGain);
            osc.start(noteTime);
            osc.stop(noteTime + noteDuration);
            this.oscillators.push(osc);
            this.activeSounds.add(osc);
            osc.onended = () => this.activeSounds.delete(osc);
            
            // Add harmonics for richer sound
            this.addHarmonics(noteTime, freq, noteDuration);
        }
        
        // Add dramatic pause and triumphant rise
        const riseTime = startTime + (noteCount * noteDuration) + pauseDuration;
        this.addTriumphantRise(riseTime, baseFreq * 0.5);
        
        // Add final chord progression
        const chordTime = riseTime + 0.5;
        this.addFinalChord(chordTime, baseFreq);
        
        // Add shimmer effect throughout
        this.addBackgroundShimmer(startTime, baseFreq, chordTime + 1.2 - startTime);
    }
    
    addHarmonics(startTime, freq, duration) {
        // Add octave and fifth harmonics
        const harmonic1 = this.audioCtx.createOscillator(); // Octave
        const harmonic2 = this.audioCtx.createOscillator(); // Fifth
        
        harmonic1.type = 'sine';
        harmonic2.type = 'sine';
        
        harmonic1.frequency.setValueAtTime(freq * 2, startTime);
        harmonic2.frequency.setValueAtTime(freq * 1.5, startTime);
        
        const gain1 = this.audioCtx.createGain();
        const gain2 = this.audioCtx.createGain();
        
        gain1.gain.setValueAtTime(0, startTime);
        gain1.gain.linearRampToValueAtTime(0.1, startTime + 0.03);
        gain1.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 0.9);
        
        gain2.gain.setValueAtTime(0, startTime);
        gain2.gain.linearRampToValueAtTime(0.07, startTime + 0.03);
        gain2.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 0.85);
        
        harmonic1.connect(gain1).connect(this.masterGain);
        harmonic2.connect(gain2).connect(this.masterGain);
        
        harmonic1.start(startTime);
        harmonic1.stop(startTime + duration);
        harmonic2.start(startTime);
        harmonic2.stop(startTime + duration);
        
        this.oscillators.push(harmonic1, harmonic2);
        this.activeSounds.add(harmonic1);
        this.activeSounds.add(harmonic2);
        harmonic1.onended = () => this.activeSounds.delete(harmonic1);
        harmonic2.onended = () => this.activeSounds.delete(harmonic2);
    }
    
    addFinalNoteShimmer(startTime, freq, duration) {
        // Add sparkling effect for final note using granular synthesis approach
        const shimmerCount = 8 + Math.floor(this.params.achievementImportance * 2);
        
        for (let i = 0; i < shimmerCount; i++) {
            const shimmerTime = startTime + (Math.random() * duration * 0.8);
            const shimmerDuration = 0.1 + (Math.random() * 0.2);
            
            const shimmerOsc = this.audioCtx.createOscillator();
            shimmerOsc.type = 'sine';
            
            // Random high frequency based on the base tone
            const shimmerFreq = freq * (2 + Math.random() * 2);
            shimmerOsc.frequency.setValueAtTime(shimmerFreq, shimmerTime);
            
            const shimmerGain = this.audioCtx.createGain();
            shimmerGain.gain.setValueAtTime(0, shimmerTime);
            shimmerGain.gain.linearRampToValueAtTime(0.02 + (Math.random() * 0.03), shimmerTime + 0.01);
            shimmerGain.gain.exponentialRampToValueAtTime(0.001, shimmerTime + shimmerDuration);
            
            shimmerOsc.connect(shimmerGain).connect(this.masterGain);
            shimmerOsc.start(shimmerTime);
            shimmerOsc.stop(shimmerTime + shimmerDuration);
            
            this.oscillators.push(shimmerOsc);
            this.activeSounds.add(shimmerOsc);
            shimmerOsc.onended = () => this.activeSounds.delete(shimmerOsc);
        }
    }
    
    addFinalChord(startTime, baseFreq) {
        // Add a final major chord
        const chordNotes = [0, 4, 7, 12]; // Major triad + octave
        const duration = 0.8 + (this.params.achievementImportance * 0.3);
        
        for (let i = 0; i < chordNotes.length; i++) {
            const osc = this.audioCtx.createOscillator();
            osc.type = this.params.achievementStyle === 'sci-fi' ? 'sawtooth' : 'sine';
            
            // Calculate note frequency - steps in the chord
            const interval = chordNotes[i];
            const freq = baseFreq * Math.pow(2, interval/12);
            osc.frequency.setValueAtTime(freq, startTime);
            
            // Set up envelope
            const gain = this.audioCtx.createGain();
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.1 + (this.params.achievementImportance * 0.03), startTime + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
            
            osc.connect(gain).connect(this.masterGain);
            osc.start(startTime);
            osc.stop(startTime + duration);
            this.oscillators.push(osc);
            this.activeSounds.add(osc);
            osc.onended = () => this.activeSounds.delete(osc);
            
            // Add vibrato for extended notes
            if (this.params.achievementImportance >= 3) {
                this.addVibrato(osc, startTime + 0.3, duration - 0.3);
            }
        }
    }
    
    addBackgroundShimmer(startTime, baseFreq, duration) {
        // Create a subtle background shimmer effect
        const shimmerCount = 15 + Math.floor(this.params.achievementImportance * 5);
        
        // Use higher frequencies for shimmer
        const shimmerBaseFreq = baseFreq * 3;
        
        for (let i = 0; i < shimmerCount; i++) {
            // Spread shimmers throughout the duration
            const shimmerTime = startTime + (Math.random() * duration);
            const shimmerDuration = 0.05 + (Math.random() * 0.15);
            
            const shimmerOsc = this.audioCtx.createOscillator();
            shimmerOsc.type = 'sine';
            
            // Calculate frequency with slight variations
            const freqMultiplier = 1 + (Math.random() * 0.5);
            const shimmerFreq = shimmerBaseFreq * freqMultiplier;
            shimmerOsc.frequency.setValueAtTime(shimmerFreq, shimmerTime);
            
            // Very subtle gain
            const shimmerGain = this.audioCtx.createGain();
            shimmerGain.gain.setValueAtTime(0, shimmerTime);
            shimmerGain.gain.linearRampToValueAtTime(0.01 + (Math.random() * 0.02 * this.params.achievementImportance / 4), shimmerTime + 0.01);
            shimmerGain.gain.exponentialRampToValueAtTime(0.001, shimmerTime + shimmerDuration);
            
            shimmerOsc.connect(shimmerGain).connect(this.masterGain);
            shimmerOsc.start(shimmerTime);
            shimmerOsc.stop(shimmerTime + shimmerDuration);
            
            this.oscillators.push(shimmerOsc);
            this.activeSounds.add(shimmerOsc);
            shimmerOsc.onended = () => this.activeSounds.delete(shimmerOsc);
        }
    }
    
    addTriumphantRise(startTime, baseFreq) {
        // Create a rising sweep for dramatic effect
        const riseDuration = 0.4 + (this.params.achievementImportance * 0.1);
        
        // Create main sweep oscillator
        const sweepOsc = this.audioCtx.createOscillator();
        sweepOsc.type = this.params.achievementStyle === 'sci-fi' ? 'sawtooth' : 'triangle';
        sweepOsc.frequency.setValueAtTime(baseFreq, startTime);
        sweepOsc.frequency.exponentialRampToValueAtTime(baseFreq * 2, startTime + riseDuration);
        
        // Set up envelope
        const sweepGain = this.audioCtx.createGain();
        sweepGain.gain.setValueAtTime(0, startTime);
        sweepGain.gain.linearRampToValueAtTime(0.15 + (this.params.achievementImportance * 0.05), startTime + riseDuration * 0.7);
        sweepGain.gain.exponentialRampToValueAtTime(0.001, startTime + riseDuration);
        
        sweepOsc.connect(sweepGain).connect(this.masterGain);
        sweepOsc.start(startTime);
        sweepOsc.stop(startTime + riseDuration);
        
        this.oscillators.push(sweepOsc);
        this.activeSounds.add(sweepOsc);
        sweepOsc.onended = () => this.activeSounds.delete(sweepOsc);
        
        // Add supporting notes during the rise
        if (this.params.achievementImportance >= 2) {
            // Add arpeggiated notes during rise
            const noteCount = 3 + Math.floor(this.params.achievementImportance);
            const noteInterval = riseDuration / noteCount;
            
            for (let i = 0; i < noteCount; i++) {
                const noteTime = startTime + (i * noteInterval);
                const noteFreq = baseFreq * (1 + (i / noteCount));
                
                const noteOsc = this.audioCtx.createOscillator();
                noteOsc.type = 'sine';
                noteOsc.frequency.setValueAtTime(noteFreq, noteTime);
                
                const noteGain = this.audioCtx.createGain();
                noteGain.gain.setValueAtTime(0, noteTime);
                noteGain.gain.linearRampToValueAtTime(0.1, noteTime + 0.02);
                noteGain.gain.exponentialRampToValueAtTime(0.001, noteTime + noteInterval * 0.9);
                
                noteOsc.connect(noteGain).connect(this.masterGain);
                noteOsc.start(noteTime);
                noteOsc.stop(noteTime + noteInterval);
                
                this.oscillators.push(noteOsc);
                this.activeSounds.add(noteOsc);
                noteOsc.onended = () => this.activeSounds.delete(noteOsc);
            }
        }
    }
    
    addVibrato(oscillator, startTime, duration) {
        // Add vibrato to a note by modulating frequency
        const vibratoDepth = 3 + (this.params.achievementImportance * 2); // Hz
        const vibratoRate = 6 + (this.params.achievementImportance * 0.5); // Hz
        
        // Store original frequency
        const originalFreq = oscillator.frequency.value;
        
        // Create LFO for vibrato
        const lfo = this.audioCtx.createOscillator();
        const lfoGain = this.audioCtx.createGain();
        
        lfo.type = 'sine';
        lfo.frequency.value = vibratoRate;
        lfoGain.gain.value = vibratoDepth;
        
        lfo.connect(lfoGain).connect(oscillator.frequency);
        lfo.start(startTime);
        lfo.stop(startTime + duration);
        
        this.oscillators.push(lfo);
        this.activeSounds.add(lfo);
        lfo.onended = () => this.activeSounds.delete(lfo);
        
        // Reset frequency after vibrato ends to avoid issues
        oscillator.frequency.setValueAtTime(originalFreq, startTime + duration);
    }
    
    stop() {
        // Clean up oscillators
        this.oscillators.forEach(osc => {
            try {
                osc.stop();
                osc.disconnect();
            } catch (e) {
                // Ignore if already stopped
            }
        });
        this.activeSounds.forEach(sound => {
            try {
                sound.stop();
                sound.disconnect();
            } catch (e) {
                // Ignore if already stopped
            }
        });
        this.oscillators = [];
        this.activeSounds.clear();
    }
    
    playBurst() {
        // For achievement sounds, playBurst is essentially the same as play
        // since these are one-shot sounds already
        console.log(this.params);
        this.start();
    }
    
    updateParams(newParams) {
        // Update parameters
        this.params = { ...this.params, ...newParams };
    }
}