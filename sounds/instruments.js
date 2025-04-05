import { TonesGenerator } from './tones.js';

export class InstrumentGenerator extends TonesGenerator {
    constructor(audioCtx, masterGain, params = {}) {
        super(audioCtx, masterGain, {
            instrumentType: 'generic', resonance: 0, brightness: 0.5, detune: 0, stereoWidth: 0,
            ...params
        });
        this.presets = {
            generic: { 
                waveform: 'sine', attack: 0.05, decay: 0.1, sustain: 0.7, release: 0.2, vibratoAmount: 0, vibratoRate: 5, harmonics: [1.0, 0, 0, 0, 0], resonance: 0, brightness: 0.5, detune: 0, stereoWidth: 0
            },
            piano: { 
                waveform: 'triangle', attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.5, vibratoAmount: 0, vibratoRate: 5, harmonics: [1.0, 0.5, 0.3, 0.1, 0], resonance: 0.2, brightness: 0.7, detune: 0, stereoWidth: 0.1
            },
            organ: { 
                waveform: 'sine', attack: 0.05, decay: 0.05, sustain: 1.0, release: 0.1, vibratoAmount: 0.5, vibratoRate: 6, harmonics: [1.0, 0.8, 0.6, 0.4, 0.2], resonance: 0.3, brightness: 0.6, detune: 0.1, stereoWidth: 0.2
            },
            guitar: { 
                waveform: 'sawtooth', attack: 0.02, decay: 0.3, sustain: 0.4, release: 0.6, vibratoAmount: 0.2, vibratoRate: 4, harmonics: [1.0, 0.7, 0.4, 0.2, 0], resonance: 0.1, brightness: 0.5, detune: 0, stereoWidth: 0.15
            },
            brass: { 
                waveform: 'square', attack: 0.1, decay: 0.1, sustain: 0.8, release: 0.3, vibratoAmount: 0.3, vibratoRate: 5, harmonics: [1.0, 0.6, 0.3, 0.1, 0], resonance: 0.4, brightness: 0.8, detune: 0.05, stereoWidth: 0.2
            },
            strings: { 
                waveform: 'sawtooth', attack: 0.2, decay: 0.1, sustain: 0.9, release: 0.8, vibratoAmount: 0.4, vibratoRate: 3, harmonics: [1.0, 0.5, 0.2, 0.1, 0], resonance: 0.3, brightness: 0.6, detune: 0.1, stereoWidth: 0.25
            },
            theremin: { 
                waveform: 'sine', attack: 0.05, decay: 0.05, sustain: 1.0, release: 0.2, vibratoAmount: 2.0, vibratoRate: 6, harmonics: [1.0, 0, 0, 0, 0], resonance: 0, brightness: 0.7, detune: 0, stereoWidth: 0.3
            },
            flute: { 
                waveform: 'sine', attack: 0.1, decay: 0.1, sustain: 0.8, release: 0.4, vibratoAmount: 0.3, vibratoRate: 5, harmonics: [1.0, 0.2, 0.1, 0, 0], resonance: 0.2, brightness: 0.9, detune: 0, stereoWidth: 0.1
            }
        };
        this.applyPreset(this.params.instrumentType);
    }

    applyPreset(presetName) {
        const baseInstrument = Object.keys(this.presets).find(key => presetName.toLowerCase().includes(key.toLowerCase())) || 'generic';
        this.updateParams({ ...this.presets[baseInstrument], instrumentType: baseInstrument });
    }

    getChordIntervals(chordType) {
        const chords = {
            // Triads
            major: [0, 4, 7],         // C, E, G
            minor: [0, 3, 7],         // C, Eb, G
            dim: [0, 3, 6],           // C, Eb, Gb (diminished)
            aug: [0, 4, 8],           // C, E, G# (augmented)
            sus4: [0, 5, 7],          // C, F, G
            sus2: [0, 2, 7],          // C, D, G
        
            // Seventh Chords
            dom7: [0, 4, 7, 10],      // C, E, G, Bb (dominant 7th)
            maj7: [0, 4, 7, 11],      // C, E, G, B
            min7: [0, 3, 7, 10],      // C, Eb, G, Bb
            halfDim7: [0, 3, 6, 10],   // C, Eb, Gb, Bb (m7b5)
            dim7: [0, 3, 6, 9],       // C, Eb, Gb, A (fully diminished 7th)
            minMaj7: [0, 3, 7, 11],    // C, Eb, G, B (minor with major 7th)
            augMaj7: [0, 4, 8, 11],    // C, E, G#, B (augmented with major 7th)
            aug7: [0, 4, 8, 10],      // C, E, G#, Bb (augmented with dominant 7th)
        
            // Ninth Chords
            maj9: [0, 4, 7, 11, 14],  // C, E, G, B, D
            min9: [0, 3, 7, 10, 14],  // C, Eb, G, Bb, D
            dom9: [0, 4, 7, 10, 14],  // C, E, G, Bb, D
            min7b9: [0, 3, 7, 10, 13], // C, Eb, G, Bb, Db (minor 7th with flat 9)
            dom7b9: [0, 4, 7, 10, 13], // C, E, G, Bb, Db (dominant 7th with flat 9)
            dom7sharp9: [0, 4, 7, 10, 15], // C, E, G, Bb, D# (dominant 7th with sharp 9)
        
            // Eleventh Chords
            maj11: [0, 4, 7, 11, 14, 17], // C, E, G, B, D, F
            min11: [0, 3, 7, 10, 14, 17], // C, Eb, G, Bb, D, F
            dom11: [0, 4, 7, 10, 14, 17], // C, E, G, Bb, D, F
            min7b11: [0, 3, 7, 10, 13, 16], // C, Eb, G, Bb, Db, E (minor 7th with flat 9 and 11)
        
            // Thirteenth Chords
            maj13: [0, 4, 7, 11, 14, 17, 21], // C, E, G, B, D, F, A
            min13: [0, 3, 7, 10, 14, 17, 21], // C, Eb, G, Bb, D, F, A
            dom13: [0, 4, 7, 10, 14, 17, 21], // C, E, G, Bb, D, F, A
            dom7b13: [0, 4, 7, 10, 14, 20],   // C, E, G, Bb, D, Ab (dominant 7th with flat 13)
        
            // Altered Dominant Chords
            dom7b5: [0, 4, 6, 10],     // C, E, Gb, Bb (dominant 7th with flat 5)
            dom7sharp5: [0, 4, 8, 10], // C, E, G#, Bb (dominant 7th with sharp 5)
            dom7b9b13: [0, 4, 7, 10, 13, 20], // C, E, G, Bb, Db, Ab (dominant 7th with flat 9 and flat 13)
        
            // Miscellaneous
            power: [0, 7],             // C, G (power chord, root and fifth)
            add9: [0, 4, 7, 14],       // C, E, G, D (major triad with added 9th)
            minAdd9: [0, 3, 7, 14],    // C, Eb, G, D (minor triad with added 9th)
            six: [0, 4, 7, 9],         // C, E, G, A (major 6th)
            min6: [0, 3, 7, 9]         // C, Eb, G, A (minor 6th)
        };
        return chords[chordType] || chords.major;
    }

    getNoteIndex(note) {
        return Object.keys(this.noteOffsets).indexOf(note);
    }

    getNoteName(index) {
        return Object.keys(this.noteOffsets)[index % 12];
    }

    createSound(frequency, output, options = {}) {
        const osc = this.audioCtx.createOscillator();
        osc.type = this.params.waveform;
        osc.frequency.value = frequency;
        if (this.params.detune) osc.detune.value = this.params.detune;

        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 350 + (this.params.brightness * 15000);
        filter.Q.value = this.params.resonance * 10;

        const finalOutput = this.params.stereoWidth > 0 ? this.audioCtx.createStereoPanner() : output;
        if (finalOutput instanceof StereoPannerNode) {
            finalOutput.pan.value = Math.random() * 2 * this.params.stereoWidth - this.params.stereoWidth;
            finalOutput.connect(output);
            this.addActiveNode(finalOutput);
        }

        super.createSound(frequency, filter, options); // Add harmonics/vibrato
        osc.connect(filter).connect(finalOutput);
    }

    createChordNotes(rootNote, chordType, octave) {
        const rootIndex = this.getNoteIndex(rootNote);
        const intervals = this.getChordIntervals(chordType);
        return intervals.map(interval => {
            const noteIndex = rootIndex + interval;
            return { note: this.getNoteName(noteIndex % 12), octave: octave + Math.floor(noteIndex / 12) };
        });
    }

    playChord(chordNotes, duration = 0.5) {
        const frequencies = chordNotes.map(note => this.getFrequency(note.note, note.octave));
        this.playNotes(frequencies, duration);
        this.scheduleSound(() => this.stop(), (duration + this.params.release) * 1000 + 100);
    }
}