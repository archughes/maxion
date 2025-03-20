import { SoundGenerator } from './SoundGenerator.js';

export class BirdSound extends SoundGenerator {
    constructor(audioCtx, masterGain, params = {}) {
        // Call parent constructor with required parameters
        super(audioCtx, masterGain, params);
        
        // Set bird-specific params with defaults
        this.params = {
            birdActivity: params.birdActivity || 0,
            birdPitch: params.birdPitch || 0,
            birdType: params.birdType || 'robin'
        };
        
        this.lastBurstTime = 0;
        this.params.birdType = this.params.birdType.toLowerCase();
    }

    start() {
        if (this.params.birdActivity <= 0 || this.timeout) return; // Use parent's timeout property
        
        const scheduleBurst = () => {
            this.playBurst();
            const { minDelay, maxDelay } = this.getBirdSpecificBurstTiming();
            const activityFactor = 1 - (this.params.birdActivity / 8);
            const nextBurstDelay = (minDelay + Math.random() * (maxDelay - minDelay)) * activityFactor;
            
            // Use parent's timeout property
            this.timeout = setTimeout(scheduleBurst, nextBurstDelay * 1000);
        };
        
        scheduleBurst();
    }

    getBirdSpecificBurstTiming() {
        switch (this.params.birdType) {
            case 'robin': return { minDelay: 3, maxDelay: 8 };
            case 'warbler': return { minDelay: 2, maxDelay: 5 };
            case 'thrush': return { minDelay: 4, maxDelay: 10 };
            case 'owl': return { minDelay: 8, maxDelay: 20 };
            case 'cardinal': return { minDelay: 3, maxDelay: 7 };
            default: return { minDelay: 3, maxDelay: 8 };
        }
    }

    // Inherit stop() from SoundGenerator - no need to override unless specific cleanup is required

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
        
        let vibratoGain, tremoloDepth;
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
            
            this.addActiveNode(vibrato);
            vibrato.onended = () => {
                this.activeNodes.delete(vibrato);
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
            
            this.addActiveNode(tremolo);
            tremolo.onended = () => {
                this.activeNodes.delete(tremolo);
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
        
        this.addActiveNode(osc);
        osc.onended = () => {
            this.activeNodes.delete(osc);
            gain.disconnect();
            if (tremoloDepth) tremoloDepth.disconnect();
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
                
                this.addActiveNode(harmonicOsc);
                harmonicOsc.onended = () => {
                    this.activeNodes.delete(harmonicOsc);
                    harmonicGain.disconnect();
                };
            });
        }
    }
    
    scheduleNoise(startTime, duration, amplitude, options = {}) {
        const noiseBuffer = this.createNoiseBuffer(duration * 2);
        
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
        
        this.addActiveNode(noiseSource);
        noiseSource.onended = () => {
            this.activeNodes.delete(noiseSource);
            gain.disconnect();
            filter.disconnect();
        };
    }

    scheduleChirp(startTime) {
        const amplitude = 0.1 + (this.params.birdActivity / 10);
        const pitchModifier = 0.8 + (this.params.birdPitch / 4);
        
        const timeSinceLast = startTime - this.lastBurstTime;
        
        switch (this.params.birdType) {
            case 'robin': this.scheduleRobinChirp(startTime, amplitude, pitchModifier); break;
            case 'warbler': this.scheduleWarblerChirp(startTime, amplitude, pitchModifier); break;
            case 'thrush': this.scheduleThrushChirp(startTime, amplitude, pitchModifier); break;
            case 'owl': this.scheduleOwlHoot(startTime, amplitude, pitchModifier); break;
            case 'cardinal': this.scheduleCardinalChirp(startTime, amplitude, pitchModifier); break;
            default: return;
        }
    }
    
    scheduleRobinChirp(startTime, amplitude, pitchModifier) {
        const baseFreq = (2200 + this.params.birdPitch * 400) * pitchModifier;
        const numPhrases = 1 + Math.floor(Math.random() * 3);
        
        for (let phrase = 0; phrase < numPhrases; phrase++) {
            const phraseStartTime = startTime + phrase * (0.8 + Math.random() * 0.4);
            const notesInPhrase = 3 + Math.floor(Math.random() * 3);
            
            for (let i = 0; i < notesInPhrase; i++) {
                const noteTime = phraseStartTime + i * 0.15;
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
        const baseFreq = (3500 + this.params.birdPitch * 500) * pitchModifier;
        const numNotes = 6 + Math.floor(Math.random() * 8);
        const direction = Math.random() > 0.5 ? 1 : -1;
        const interval = 80 + Math.random() * 50;
        
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
        
        for (let i = 0; i < numNotes; i++) {
            const noteTime = startTime + 0.3 + i * 0.04;
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
        const baseFreq = (1800 + this.params.birdPitch * 400) * pitchModifier;
        const numPhrases = 2 + Math.floor(Math.random() * 2);
        
        for (let phrase = 0; phrase < numPhrases; phrase++) {
            const phraseStartTime = startTime + phrase * (0.6 + Math.random() * 0.4);
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
            
            if (Math.random() > 0.3) {
                const rollTime = phraseStartTime + introNotes * 0.35;
                const rollFreq = baseFreq * (1.1 + Math.random() * 0.1);
                
                this.scheduleNote(rollTime, rollFreq, 0.3, amplitude, {
                    type: 'sine',
                    tremolo: 20,
                    harmonics: [
                        { ratio: 2, gain: 0.6, type: 'sine' },
                        { ratio: 3, gain: 0.4, type: 'sine' }
                    ]
                });
                
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
        const baseFreq = (200 + this.params.birdPitch * 80) * pitchModifier;
        const patternType = Math.random();
        
        if (patternType < 0.7) {
            this.scheduleNote(startTime, baseFreq, 0.3, amplitude, {
                type: 'triangle',
                frequencyEnvelope: [
                    { time: 0, value: baseFreq * 1.05, curve: 'linear' },
                    { time: 0.2, value: baseFreq, curve: 'linear' },
                    { time: 1, value: baseFreq * 0.95, curve: 'linear' }
                ],
                harmonics: [
                    { ratio: 0.5, gain: 0.3, type: 'sine' },
                    { ratio: 2, gain: 0.2, type: 'sine' },
                    { ratio: 3, gain: 0.1, type: 'sine' }
                ]
            });
            
            this.scheduleNote(startTime + 0.5, baseFreq, 0.3, amplitude, {
                type: 'triangle',
                frequencyEnvelope: [
                    { time: 0, value: baseFreq * 1.05, curve: 'linear' },
                    { time: 0.2, value: baseFreq, curve: 'linear' },
                    { time: 1, value: baseFreq * 0.95, curve: 'linear' }
                ],
                harmonics: [
                    { ratio: 0.5, gain: 0.3, type: 'sine' },
                    { ratio: 2, gain: 0.2, type: 'sine' },
                    { ratio: 3, gain: 0.1, type: 'sine' }
                ]
            });
            
            this.scheduleNote(startTime + 1.0, baseFreq * 0.95, 0.6, amplitude, {
                type: 'triangle',
                frequencyEnvelope: [
                    { time: 0, value: baseFreq, curve: 'linear' },
                    { time: 0.1, value: baseFreq * 0.98, curve: 'linear' },
                    { time: 1, value: baseFreq * 0.9, curve: 'linear' }
                ],
                harmonics: [
                    { ratio: 0.5, gain: 0.4, type: 'sine' },
                    { ratio: 2, gain: 0.15, type: 'sine' }
                ]
            });
            
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
        const baseFreq = (2400 + this.params.birdPitch * 500) * pitchModifier;
        const songType = Math.floor(Math.random() * 3);
        
        if (songType === 0) {
            const numPhrases = 2 + Math.floor(Math.random() * 3);
            for (let phrase = 0; phrase < numPhrases; phrase++) {
                const phraseStart = startTime + phrase * 0.5;
                this.scheduleNote(phraseStart, baseFreq * 1.2, 0.15, amplitude, {
                    type: 'sine',
                    frequencyEnvelope: [
                        { time: 0, value: baseFreq * 1.25, curve: 'linear' },
                        { time: 1, value: baseFreq * 1.15, curve: 'linear' }
                    ],
                    harmonics: [{ ratio: 2, gain: 0.3, type: 'sine' }],
                    vibratoRate: 20,
                    vibratoDepth: 10
                });
                this.scheduleNote(phraseStart + 0.2, baseFreq * 0.9, 0.2, amplitude, {
                    type: 'sine',
                    frequencyEnvelope: [
                        { time: 0, value: baseFreq * 0.95, curve: 'linear' },
                        { time: 0.5, value: baseFreq * 0.85, curve: 'linear' }
                    ],
                    harmonics: [{ ratio: 2, gain: 0.3, type: 'sine' }],
                    vibratoRate: 25,
                    vibratoDepth: 15
                });
            }
        } else if (songType === 1) {
            const numPhrases = 1 + Math.floor(Math.random() * 2);
            for (let phrase = 0; phrase < numPhrases; phrase++) {
                const phraseStart = startTime + phrase * 0.8;
                const notesInPhrase = 3 + Math.floor(Math.random() * 3);
                for (let i = 0; i < notesInPhrase; i++) {
                    const noteTime = phraseStart + i * 0.15;
                    const noteFreq = baseFreq * (1.1 - (i * 0.1));
                    this.scheduleNote(noteTime, noteFreq, 0.12, amplitude, {
                        type: 'sine',
                        frequencyEnvelope: [
                            { time: 0, value: noteFreq * 1.05, curve: 'linear' },
                            { time: 0.5, value: noteFreq * 0.95, curve: 'linear' }
                        ],
                        harmonics: [{ ratio: 2, gain: 0.4, type: 'sine' }],
                        vibratoRate: 15,
                        vibratoDepth: 10
                    });
                }
            }
        } else {
            const numNotes = 4 + Math.floor(Math.random() * 4);
            for (let i = 0; i < numNotes; i++) {
                const noteTime = startTime + i * 0.2;
                const noteFreq = i % 2 === 0 ? baseFreq * (1 + Math.random() * 0.2) : baseFreq * (0.8 + Math.random() * 0.1);
                this.scheduleNote(noteTime, noteFreq, 0.15, amplitude, {
                    type: 'sine',
                    harmonics: [
                        { ratio: 2, gain: 0.35, type: 'sine' },
                        { ratio: 0.5, gain: 0.15, type: 'sine' }
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
        
        let numChirps = Math.max(1, Math.floor(this.params.birdActivity * 1.2));
        let burstDuration = 0; // Duration in seconds to ensure all sounds complete
        
        switch (this.params.birdType) {
            case 'robin':
                numChirps = Math.max(1, Math.floor(this.params.birdActivity * 1.5));
                burstDuration = 3; // Based on max 3 phrases * (0.8 + 0.4) + notes * 0.15
                break;
            case 'warbler':
                numChirps = Math.max(1, Math.floor(this.params.birdActivity * 2));
                burstDuration = 2; // Based on pre-notes + 13 notes * 0.04 + 0.3 offset
                break;
            case 'thrush':
                numChirps = Math.max(1, Math.floor(this.params.birdActivity * 1.8));
                burstDuration = 4; // Based on 3 phrases * (0.6 + 0.4) + intro + roll
                break;
            case 'owl':
                numChirps = Math.max(1, Math.floor(this.params.birdActivity * 1.2));
                burstDuration = 5; // Based on "who-who-whooo" pattern (1.0 + 0.6) or double/single hoots
                break;
            case 'cardinal':
                numChirps = Math.max(1, Math.floor(this.params.birdActivity * 1.5));
                burstDuration = 3.5; // Based on max 4 phrases * 0.5 + notes or 7 notes * 0.2
                break;
            default:
                burstDuration = 3;
        }

        for (let i = 0; i < numChirps; i++) {
            const chirpTime = currentTime + (i * (burstDuration / numChirps));
            this.scheduleChirp(chirpTime);
        }
        
        // Schedule cleanup after the burst duration plus a small buffer
        const cleanupDelay = (burstDuration + 0.5) * 1000; // Convert to milliseconds
        setTimeout(() => {
            // No explicit cleanup needed here since stop() handles it,
            // but this ensures resources are kept alive until sounds complete
        }, cleanupDelay);
    }

    // updateParams is inherited from SoundGenerator
}