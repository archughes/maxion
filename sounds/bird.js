export class BirdSound {
    constructor(audioCtx, masterGain, params) {
        if (!audioCtx || !masterGain) {
            throw new Error('AudioContext or masterGain is not provided');
        }
        this.audioCtx = audioCtx;
        this.masterGain = masterGain;
        this.params = {
            birdActivity: params.birdActivity || 0,
            birdPitch: params.birdPitch || 0,
            birdType: params.birdType || 'robin'
        };
        this.activeOscillators = new Set();
        this.burstTimeout = null;
        this.lastBurstTime = 0;
        this.params.birdType = this.params.birdType.toLowerCase();
    }

    start() {
        if (this.params.birdActivity <= 0 || this.burstTimeout) return; // Check for existing timeout
        
        const scheduleBurst = () => {
            this.playBurst();
            const { minDelay, maxDelay } = this.getBirdSpecificBurstTiming();
            const activityFactor = 1 - (this.params.birdActivity / 8);
            const nextBurstDelay = (minDelay + Math.random() * (maxDelay - minDelay)) * activityFactor;
            
            this.burstTimeout = setTimeout(scheduleBurst, nextBurstDelay * 1000);
        };
        
        scheduleBurst();
    }

    getBirdSpecificBurstTiming() {
        // Different birds have different singing patterns
        switch (this.params.birdType) {
            case 'robin': return { minDelay: 3, maxDelay: 8 };
            case 'warbler': return { minDelay: 2, maxDelay: 5 }; // Warblers sing more frequently
            case 'thrush': return { minDelay: 4, maxDelay: 10 }; // Thrushes have longer pauses
            case 'owl': return { minDelay: 8, maxDelay: 20 }; // Owls call less frequently
            case 'cardinal': return { minDelay: 3, maxDelay: 7 };
            default: return { minDelay: 3, maxDelay: 8 };
        }
    }

    stop() {
        if (this.burstTimeout) {
            clearTimeout(this.burstTimeout);
            this.burstTimeout = null;
        }
        this.activeOscillators.forEach(osc => {
            osc.stop(); // Stop immediately
            osc.disconnect(); // Disconnect from all destinations
        });
        this.activeOscillators.clear();
    }

    scheduleNote(startTime, freq, duration, amplitude, options = {}) {
        const defaultOptions = {
            type: 'sine',
            detune: 0,
            frequencyEnvelope: null,
            harmonics: [],
            vibratoRate: 0,
            vibratoDepth: 0,
            tremolo: 0
        };
        const opts = { ...defaultOptions, ...options };
        
        const modFreq = freq * (0.98 + Math.random() * 0.04);
        const modDuration = duration * (0.95 + Math.random() * 0.1);
        
        const osc = this.audioCtx.createOscillator();
        osc.type = opts.type;
        osc.frequency.setValueAtTime(modFreq, startTime);
        if (opts.detune) osc.detune.setValueAtTime(opts.detune, startTime);
    
        const gain = this.audioCtx.createGain();
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(amplitude, startTime + 0.01);
        
        if (opts.frequencyEnvelope) {
            opts.frequencyEnvelope.forEach(point => {
                const time = startTime + point.time * modDuration;
                if (point.curve === 'linear') {
                    osc.frequency.linearRampToValueAtTime(point.value, time);
                } else {
                    osc.frequency.exponentialRampToValueAtTime(Math.max(0.01, point.value), time);
                }
            });
        }
        
        let vibratoGain, tremoloDepth; // Declare variables for cleanup
        if (opts.vibratoRate > 0 && opts.vibratoDepth > 0) {
            const vibrato = this.audioCtx.createOscillator();
            vibrato.type = 'sine';
            vibrato.frequency.setValueAtTime(opts.vibratoRate, startTime);
            vibratoGain = this.audioCtx.createGain();
            vibratoGain.gain.setValueAtTime(opts.vibratoDepth, startTime);
            
            vibrato.connect(vibratoGain);
            vibratoGain.connect(osc.frequency);
            vibrato.start(startTime);
            vibrato.stop(startTime + modDuration);
            this.activeOscillators.add(vibrato);
            vibrato.onended = () => {
                this.activeOscillators.delete(vibrato);
                vibratoGain.disconnect();
            };
        }
        
        if (opts.tremolo > 0) {
            const tremolo = this.audioCtx.createOscillator();
            tremolo.type = 'sine';
            tremolo.frequency.setValueAtTime(opts.tremolo, startTime);
            const tremoloGain = this.audioCtx.createGain();
            tremoloGain.gain.setValueAtTime(0.5, startTime);
            tremoloDepth = this.audioCtx.createGain();
            tremoloDepth.gain.setValueAtTime(amplitude * 0.7, startTime);
            
            tremolo.connect(tremoloGain);
            tremoloGain.connect(tremoloDepth.gain);
            gain.connect(this.masterGain);
            osc.connect(tremoloDepth);
            tremoloDepth.connect(this.masterGain);
            
            tremolo.start(startTime);
            tremolo.stop(startTime + modDuration);
            this.activeOscillators.add(tremolo);
            tremolo.onended = () => {
                this.activeOscillators.delete(tremolo);
                tremoloDepth.disconnect();
            };
        } else {
            osc.connect(gain).connect(this.masterGain);
        }
        
        const decayStart = startTime + (modDuration * 0.4);
        gain.gain.setValueAtTime(amplitude, decayStart);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + modDuration);
        
        osc.start(startTime);
        osc.stop(startTime + modDuration);
        this.activeOscillators.add(osc);
        osc.onended = () => {
            this.activeOscillators.delete(osc);
            gain.disconnect(); // Disconnect gain node
            if (tremoloDepth) tremoloDepth.disconnect(); // Ensure tremolo cleanup
        };
    
        if (opts.harmonics.length > 0) {
            opts.harmonics.forEach(harmonic => {
                const harmonicOsc = this.audioCtx.createOscillator();
                harmonicOsc.type = harmonic.type || opts.type;
                harmonicOsc.frequency.setValueAtTime(modFreq * harmonic.ratio, startTime);
                const harmonicGain = this.audioCtx.createGain();
                harmonicGain.gain.setValueAtTime(0, startTime);
                harmonicGain.gain.linearRampToValueAtTime(amplitude * harmonic.gain, startTime + 0.01);
                harmonicGain.gain.exponentialRampToValueAtTime(0.001, startTime + modDuration);
                
                harmonicOsc.connect(harmonicGain).connect(this.masterGain);
                harmonicOsc.start(startTime);
                harmonicOsc.stop(startTime + modDuration);
                this.activeOscillators.add(harmonicOsc);
                harmonicOsc.onended = () => {
                    this.activeOscillators.delete(harmonicOsc);
                    harmonicGain.disconnect();
                };
            });
        }
    }
    
    // Add noise for certain bird sounds
    scheduleNoise(startTime, duration, amplitude, options = {}) {
        const bufferSize = 2 * this.audioCtx.sampleRate;
        const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        
        const noiseSource = this.audioCtx.createBufferSource();
        noiseSource.buffer = noiseBuffer;
        const filter = this.audioCtx.createBiquadFilter();
        filter.type = options.filterType || 'bandpass';
        filter.frequency.value = options.filterFreq || 2000;
        filter.Q.value = options.filterQ || 1;
        
        const gain = this.audioCtx.createGain();
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(amplitude, startTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        
        noiseSource.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        
        noiseSource.start(startTime);
        noiseSource.stop(startTime + duration);
        this.activeOscillators.add(noiseSource);
        noiseSource.onended = () => {
            this.activeOscillators.delete(noiseSource);
            gain.disconnect();
            filter.disconnect(); // Disconnect filter as well
        };
    }

    scheduleChirp(startTime) {
        const amplitude = 0.1 + (this.params.birdActivity / 10);
        const pitchModifier = 0.8 + (this.params.birdPitch / 4);
        
        // Time since last burst to introduce variety
        const timeSinceLast = startTime - this.lastBurstTime;
        
        // Different spectral patterns for each bird
        switch (this.params.birdType) {
            case 'robin': {
                this.scheduleRobinChirp(startTime, amplitude, pitchModifier);
                break;
            }
            case 'warbler': {
                this.scheduleWarblerChirp(startTime, amplitude, pitchModifier);
                break;
            }
            case 'thrush': {
                this.scheduleThrushChirp(startTime, amplitude, pitchModifier);
                break;
            }
            case 'owl': {
                this.scheduleOwlHoot(startTime, amplitude, pitchModifier);
                break;
            }
            case 'cardinal': {
                this.scheduleCardinalChirp(startTime, amplitude, pitchModifier);
                break;
            }
            default:
                return;
        }
    }
    
    scheduleRobinChirp(startTime, amplitude, pitchModifier) {
        // Robin's "cheerily, cheer up, cheerio" pattern
        // Base frequency in the 2-3kHz range
        const baseFreq = (2200 + this.params.birdPitch * 400) * pitchModifier;
        
        // Robin phrases have multiple notes with clear separation
        const numPhrases = 1 + Math.floor(Math.random() * 3); // 1-3 phrases
        
        for (let phrase = 0; phrase < numPhrases; phrase++) {
            const phraseStartTime = startTime + phrase * (0.8 + Math.random() * 0.4);
            const notesInPhrase = 3 + Math.floor(Math.random() * 3); // 3-5 notes per phrase
            
            for (let i = 0; i < notesInPhrase; i++) {
                const noteTime = phraseStartTime + i * 0.15;
                
                // Robin notes often start higher and drop in pitch
                const noteFreq = baseFreq * (1 + (Math.random() * 0.2 - 0.1));
                
                this.scheduleNote(noteTime, noteFreq, 0.12, amplitude, {
                    type: 'sine',
                    frequencyEnvelope: [
                        { time: 0, value: noteFreq * 1.05, curve: 'linear' },
                        { time: 0.3, value: noteFreq, curve: 'linear' },
                        { time: 1, value: noteFreq * 0.95, curve: 'linear' }
                    ],
                    harmonics: [
                        { ratio: 2, gain: 0.4, type: 'sine' },
                        { ratio: 3, gain: 0.2, type: 'sine' }
                    ],
                    vibratoRate: 15,
                    vibratoDepth: 15
                });
            }
        }
    }
    
    scheduleWarblerChirp(startTime, amplitude, pitchModifier) {
        // Warblers have rapid, high-pitched trills that cascade up or down
        const baseFreq = (3500 + this.params.birdPitch * 500) * pitchModifier;
        const numNotes = 6 + Math.floor(Math.random() * 8); // 6-13 notes in rapid succession
        
        // Determine if this trill goes up or down
        const direction = Math.random() > 0.5 ? 1 : -1;
        const interval = 80 + Math.random() * 50; // Pitch change per note
        
        // Add some pre-trill notes occasionally
        if (Math.random() > 0.7) {
            const preNotes = 1 + Math.floor(Math.random() * 2);
            for (let i = 0; i < preNotes; i++) {
                const preTime = startTime + i * 0.1;
                const preFreq = baseFreq * (0.8 + Math.random() * 0.2);
                
                this.scheduleNote(preTime, preFreq, 0.08, amplitude * 0.7, {
                    type: 'sine',
                    harmonics: [
                        { ratio: 2, gain: 0.5, type: 'sine' },
                        { ratio: 3, gain: 0.2, type: 'sine' }
                    ]
                });
            }
        }
        
        // Main trill
        for (let i = 0; i < numNotes; i++) {
            const noteTime = startTime + 0.3 + i * 0.04; // Rapid succession of notes
            const noteFreq = baseFreq + (direction * i * interval);
            
            this.scheduleNote(noteTime, noteFreq, 0.06, amplitude, {
                type: 'sine',
                vibratoRate: 30,
                vibratoDepth: 10,
                harmonics: [
                    { ratio: 2, gain: 0.4, type: 'sine' },
                    { ratio: 3, gain: 0.15, type: 'sine' }
                ]
            });
        }
    }
    
    scheduleThrushChirp(startTime, amplitude, pitchModifier) {
        // Thrush songs have clear, flute-like quality with distinct phrases
        const baseFreq = (1800 + this.params.birdPitch * 400) * pitchModifier;
        
        // Wood thrush has a distinctive three-part song
        const numPhrases = 2 + Math.floor(Math.random() * 2); // 2-3 phrases
        
        for (let phrase = 0; phrase < numPhrases; phrase++) {
            const phraseStartTime = startTime + phrase * (0.6 + Math.random() * 0.4);
            
            // First part - flute-like introductory notes
            const introNotes = 1 + Math.floor(Math.random() * 2);
            for (let i = 0; i < introNotes; i++) {
                const noteTime = phraseStartTime + i * 0.3;
                const noteFreq = baseFreq * (0.9 + Math.random() * 0.2);
                
                this.scheduleNote(noteTime, noteFreq, 0.25, amplitude, {
                    type: 'sine',
                    frequencyEnvelope: [
                        { time: 0, value: noteFreq * 1.02, curve: 'linear' },
                        { time: 0.2, value: noteFreq, curve: 'linear' },
                        { time: 1, value: noteFreq * 0.98, curve: 'linear' }
                    ],
                    harmonics: [
                        { ratio: 2, gain: 0.5, type: 'sine' },
                        { ratio: 3, gain: 0.3, type: 'sine' }
                    ],
                    vibratoRate: 8,
                    vibratoDepth: 10
                });
            }
            
            // Second part - rolling, echoing sound (wood thrush specialty)
            if (Math.random() > 0.3) { // 70% chance for this distinctive part
                const rollTime = phraseStartTime + introNotes * 0.35;
                const rollFreq = baseFreq * (1.1 + Math.random() * 0.1);
                
                // Create bi-tonal effect (characteristic of wood thrush)
                this.scheduleNote(rollTime, rollFreq, 0.3, amplitude, {
                    type: 'sine',
                    tremolo: 20,
                    harmonics: [
                        { ratio: 2, gain: 0.6, type: 'sine' }, // Strong second harmonic
                        { ratio: 3, gain: 0.4, type: 'sine' }  // Significant third harmonic
                    ]
                });
                
                // Simultaneous second tone for the "ee-oh-lay" effect
                this.scheduleNote(rollTime + 0.05, rollFreq * 1.5, 0.25, amplitude * 0.7, {
                    type: 'sine',
                    tremolo: 20,
                    harmonics: [
                        { ratio: 1.5, gain: 0.4, type: 'sine' }
                    ]
                });
            }
        }
    }
    
    scheduleOwlHoot(startTime, amplitude, pitchModifier) {
        // Create a classic "who-who-whooo" pattern for an owl
        const baseFreq = (200 + this.params.birdPitch * 80) * pitchModifier;
        
        // Determine pattern type: classic "who-who-whooo" (most common) or single/double hoots
        const patternType = Math.random();
        
        if (patternType < 0.7) {
            // Classic "who-who-whooo" pattern (70% chance)
            
            // First "who"
            this.scheduleNote(startTime, baseFreq, 0.3, amplitude, {
                type: 'triangle',
                frequencyEnvelope: [
                    { time: 0, value: baseFreq * 1.05, curve: 'linear' },
                    { time: 0.2, value: baseFreq, curve: 'linear' },
                    { time: 1, value: baseFreq * 0.95, curve: 'linear' }
                ],
                harmonics: [
                    { ratio: 0.5, gain: 0.3, type: 'sine' }, // Sub-harmonic
                    { ratio: 2, gain: 0.2, type: 'sine' },
                    { ratio: 3, gain: 0.1, type: 'sine' }
                ]
            });
            
            // Second "who"
            this.scheduleNote(startTime + 0.5, baseFreq, 0.3, amplitude, {
                type: 'triangle',
                frequencyEnvelope: [
                    { time: 0, value: baseFreq * 1.05, curve: 'linear' },
                    { time: 0.2, value: baseFreq, curve: 'linear' },
                    { time: 1, value: baseFreq * 0.95, curve: 'linear' }
                ],
                harmonics: [
                    { ratio: 0.5, gain: 0.3, type: 'sine' }, // Sub-harmonic
                    { ratio: 2, gain: 0.2, type: 'sine' },
                    { ratio: 3, gain: 0.1, type: 'sine' }
                ]
            });
            
            // Final longer "whooo"
            this.scheduleNote(startTime + 1.0, baseFreq * 0.95, 0.6, amplitude, {
                type: 'triangle',
                frequencyEnvelope: [
                    { time: 0, value: baseFreq, curve: 'linear' },
                    { time: 0.1, value: baseFreq * 0.98, curve: 'linear' },
                    { time: 1, value: baseFreq * 0.9, curve: 'linear' }
                ],
                harmonics: [
                    { ratio: 0.5, gain: 0.4, type: 'sine' }, // Sub-harmonic
                    { ratio: 2, gain: 0.15, type: 'sine' }
                ]
            });
            
            // Add subtle wind/breath noise to each hoot
            this.scheduleNoise(startTime, 0.3, amplitude * 0.05, {
                filterType: 'bandpass',
                filterFreq: 300,
                filterQ: 2
            });
            
            this.scheduleNoise(startTime + 0.5, 0.3, amplitude * 0.05, {
                filterType: 'bandpass',
                filterFreq: 300,
                filterQ: 2
            });
            
            this.scheduleNoise(startTime + 1.0, 0.6, amplitude * 0.08, {
                filterType: 'bandpass',
                filterFreq: 280,
                filterQ: 2
            });
            
        } else if (patternType < 0.9) {
            // Double hoot pattern (20% chance)
            
            for (let i = 0; i < 2; i++) {
                const hootTime = startTime + i * 0.7;
                
                this.scheduleNote(hootTime, baseFreq, 0.4, amplitude, {
                    type: 'triangle',
                    frequencyEnvelope: [
                        { time: 0, value: baseFreq * 1.03, curve: 'linear' },
                        { time: 0.3, value: baseFreq, curve: 'linear' },
                        { time: 1, value: baseFreq * 0.97, curve: 'linear' }
                    ],
                    harmonics: [
                        { ratio: 0.5, gain: 0.3, type: 'sine' },
                        { ratio: 2, gain: 0.2, type: 'sine' }
                    ]
                });
                
                this.scheduleNoise(hootTime, 0.4, amplitude * 0.05, {
                    filterType: 'bandpass',
                    filterFreq: 250,
                    filterQ: 2
                });
            }
            
        } else {
            // Single hoot (10% chance)
            this.scheduleNote(startTime, baseFreq, 0.5, amplitude, {
                type: 'triangle',
                frequencyEnvelope: [
                    { time: 0, value: baseFreq * 1.02, curve: 'linear' },
                    { time: 0.2, value: baseFreq, curve: 'linear' },
                    { time: 1, value: baseFreq * 0.95, curve: 'linear' }
                ],
                harmonics: [
                    { ratio: 0.5, gain: 0.4, type: 'sine' },
                    { ratio: 2, gain: 0.15, type: 'sine' }
                ]
            });
            
            this.scheduleNoise(startTime, 0.5, amplitude * 0.06, {
                filterType: 'bandpass',
                filterFreq: 270,
                filterQ: 2
            });
        }
    }
    
    scheduleCardinalChirp(startTime, amplitude, pitchModifier) {
        // Cardinals have clear, whistling songs often described as "what-cheer, what-cheer"
        const baseFreq = (2400 + this.params.birdPitch * 500) * pitchModifier;
        
        // Cardinals have several song types; let's implement a few common ones
        const songType = Math.floor(Math.random() * 3);
        
        if (songType === 0) {
            // "What-cheer" pattern
            const numPhrases = 2 + Math.floor(Math.random() * 3); // 2-4 repetitions
            
            for (let phrase = 0; phrase < numPhrases; phrase++) {
                const phraseStart = startTime + phrase * 0.5;
                
                // First note - usually higher "what"
                this.scheduleNote(phraseStart, baseFreq * 1.2, 0.15, amplitude, {
                    type: 'sine',
                    frequencyEnvelope: [
                        { time: 0, value: baseFreq * 1.25, curve: 'linear' },
                        { time: 1, value: baseFreq * 1.15, curve: 'linear' }
                    ],
                    harmonics: [
                        { ratio: 2, gain: 0.3, type: 'sine' }
                    ],
                    vibratoRate: 20,
                    vibratoDepth: 10
                });
                
                // Second note - usually lower "cheer"
                this.scheduleNote(phraseStart + 0.2, baseFreq * 0.9, 0.2, amplitude, {
                    type: 'sine',
                    frequencyEnvelope: [
                        { time: 0, value: baseFreq * 0.95, curve: 'linear' },
                        { time: 0.5, value: baseFreq * 0.85, curve: 'linear' }
                    ],
                    harmonics: [
                        { ratio: 2, gain: 0.3, type: 'sine' }
                    ],
                    vibratoRate: 25,
                    vibratoDepth: 15
                });
            }
            
        } else if (songType === 1) {
            // "Purty-purty-purty" pattern (rapid descending notes)
            const numPhrases = 1 + Math.floor(Math.random() * 2); // 1-2 repetitions
            
            for (let phrase = 0; phrase < numPhrases; phrase++) {
                const phraseStart = startTime + phrase * 0.8;
                const notesInPhrase = 3 + Math.floor(Math.random() * 3); // 3-5 notes
                
                for (let i = 0; i < notesInPhrase; i++) {
                    const noteTime = phraseStart + i * 0.15;
                    
                    // Descending pattern
                    const noteFreq = baseFreq * (1.1 - (i * 0.1));
                    
                    this.scheduleNote(noteTime, noteFreq, 0.12, amplitude, {
                        type: 'sine',
                        frequencyEnvelope: [
                            { time: 0, value: noteFreq * 1.05, curve: 'linear' },
                            { time: 0.5, value: noteFreq * 0.95, curve: 'linear' }
                        ],
                        harmonics: [
                            { ratio: 2, gain: 0.4, type: 'sine' }
                        ],
                        vibratoRate: 15,
                        vibratoDepth: 10
                    });
                }
            }
            
        } else {
            // Clear whistle pattern with sharp changes
            const numNotes = 4 + Math.floor(Math.random() * 4); // 4-7 notes
            
            for (let i = 0; i < numNotes; i++) {
                const noteTime = startTime + i * 0.2;
                
                // Cardinals often have sharp pitch changes in their songs
                let noteFreq;
                if (i % 2 === 0) {
                    noteFreq = baseFreq * (1 + Math.random() * 0.2);
                } else {
                    noteFreq = baseFreq * (0.8 + Math.random() * 0.1);
                }
                
                this.scheduleNote(noteTime, noteFreq, 0.15, amplitude, {
                    type: 'sine',
                    harmonics: [
                        { ratio: 2, gain: 0.35, type: 'sine' },
                        { ratio: 0.5, gain: 0.15, type: 'sine' } // Some subtones
                    ],
                    vibratoRate: 20,
                    vibratoDepth: 15
                });
            }
        }
    }

    playBurst() {
        const currentTime = this.audioCtx.currentTime;
        this.lastBurstTime = currentTime;
        
        // Number of chirps based on bird activity and bird type
        let numChirps = Math.max(1, Math.floor(this.params.birdActivity * 1.2));
        
        // Different birds have different burst patterns
        switch (this.params.birdType) {
            case 'robin':
                numChirps = Math.max(1, Math.floor(this.params.birdActivity * 1.5));
                break;
            case 'warbler':
                numChirps = Math.max(1, Math.floor(this.params.birdActivity * 2));
                break;
            case 'thrush':
                numChirps = Math.max(1, Math.floor(this.params.birdActivity * 1.8));
                break;
            case 'owl':
                numChirps = Math.max(1, Math.floor(this.params.birdActivity * 1.2));
                break;
            case 'cardinal':
                numChirps = Math.max(1, Math.floor(this.params.birdActivity * 1.5));
                break;
        }

        for (let i = 0; i < numChirps; i++) {
            const chirpTime = currentTime + Math.random() * 3;
            this.scheduleChirp(chirpTime);
        }
    }


    updateParams(newParams) {
        this.params = { ...this.params, ...newParams };
        if (this.params.birdActivity <= 0 && this.burstTimeout) {
            this.stop();
        } else if (this.params.birdActivity > 0 && !this.burstTimeout) {
            this.start();
        }
    }
}
