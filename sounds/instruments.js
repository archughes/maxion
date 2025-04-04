// sounds/instruments.js
import { TonesGenerator } from './tones.js';

export class InstrumentGenerator extends TonesGenerator {
    constructor(audioCtx, masterGain, params = {}) {
        const defaultParams = {
            octave: params.octave || 4,
            note: params.note || 'C',
            waveform: params.waveform || 'sine',
            attack: params.attack || 0.05,
            decay: params.decay || 0.1,
            sustain: params.sustain || 0.7,
            release: params.release || 0.5,
            vibratoAmount: params.vibratoAmount || 0,
            vibratoRate: params.vibratoRate || 5,
            harmonics: params.harmonics || [1.0],
            instrumentType: params.instrumentType || 'generic',
            resonance: params.resonance !== undefined ? params.resonance : 0,
            brightness: params.brightness !== undefined ? params.brightness : 0.5,
            detune: params.detune !== undefined ? params.detune : 0,
            stereoWidth: params.stereoWidth !== undefined ? params.stereoWidth : 0
        };
        super(audioCtx, masterGain, defaultParams);

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

        this.instrumentType = defaultParams.instrumentType;
        this.applyPreset(this.instrumentType);
    }

    applyPreset(presetName) {
        if (this.presets[presetName]) {
            const preset = this.presets[presetName];
            this.updateParams({ ...preset, instrumentType: presetName, note: this.params.note, octave: this.params.octave });
        }
    }

    applyToneShaping(source, output) {
        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 350 + ((isFinite(this.params.brightness) ? this.params.brightness : 0.5) * 15000);
        filter.Q.value = (isFinite(this.params.resonance) ? this.params.resonance : 0) * 10;

        if (this.params.detune !== 0 && source instanceof OscillatorNode) {
            source.detune.value = isFinite(this.params.detune) ? this.params.detune : 0;
        }

        if (this.params.stereoWidth > 0) {
            const panner = this.audioCtx.createStereoPanner();
            panner.pan.value = Math.random() * 2 * (isFinite(this.params.stereoWidth) ? this.params.stereoWidth : 0) - (isFinite(this.params.stereoWidth) ? this.params.stereoWidth : 0);
            source.connect(filter);
            filter.connect(panner);
            panner.connect(output);
            this.addActiveNode(panner);
        } else {
            source.connect(filter);
            filter.connect(output);
        }
        
        this.addActiveNode(filter);
    }

    createHarmonics(fundamentalFreq, outputGain) {
        const nodes = super.createHarmonics(fundamentalFreq, outputGain);
        nodes.forEach(({ oscillator, harmonicGain }) => {
            oscillator.disconnect();
            this.applyToneShaping(oscillator, harmonicGain);
            harmonicGain.connect(outputGain);
        });
    }

    playBurst(duration = 0.5) {
        if (this.timeout) return;
        super.playBurst(duration);
    }

    getChordIntervals(chordType) {
        const chords = {
            major: [0, 4, 7],
            minor: [0, 3, 7],
            dim: [0, 3, 6],
            aug: [0, 4, 8],
            sus4: [0, 5, 7],
            sus2: [0, 2, 7],
            dom7: [0, 4, 7, 10],
            maj7: [0, 4, 7, 11],
            min7: [0, 3, 7, 10],
            maj9: [0, 4, 7, 11, 14],
            min9: [0, 3, 7, 10, 14],
            dom9: [0, 4, 7, 10, 14],
            halfDim7: [0, 3, 6, 10]
        };
        return chords[chordType] || chords.major;
    }

    getNoteIndex(note) {
        return Object.keys(this.noteOffsets).indexOf(note);
    }

    getNoteName(index) {
        return Object.keys(this.noteOffsets)[index % 12];
    }

    createChordNotes(rootNote, chordType, octave) {
        const rootIndex = this.getNoteIndex(rootNote);
        const intervals = this.getChordIntervals(chordType);
        return intervals.map(interval => {
            const noteIndex = rootIndex + interval;
            const adjustedOctave = octave + Math.floor(noteIndex / 12);
            return { note: this.getNoteName(noteIndex), octave: adjustedOctave };
        });
    }

    playNotesWithEnvelope(frequencies, duration, output) {
        const now = this.audioCtx.currentTime;
        const mainGain = this.audioCtx.createGain();
        mainGain.gain.setValueAtTime(0, now);
        mainGain.gain.linearRampToValueAtTime(1, now + this.params.attack);
        mainGain.gain.linearRampToValueAtTime(this.params.sustain, now + this.params.attack + this.params.decay);
        mainGain.gain.linearRampToValueAtTime(0, now + this.params.attack + this.params.decay + duration);
        mainGain.connect(this.masterGain);
        this.addActiveNode(mainGain);
        frequencies.forEach(freq => this.createHarmonics(freq, mainGain));
        return mainGain;
    }

    playChord(chordNotes, duration = 0.5) {
        console.log('Playing chord, timeout:', this.timeout);
        if (this.timeout) {
            clearTimeout(this.timeout); // Force clear
            this.timeout = null;
        }

        const frequencies = chordNotes.map(noteObj => this.getFrequency(noteObj.note, noteObj.octave));
        this.playNotesWithEnvelope(frequencies, duration, this.masterGain);

        const totalDuration = this.params.attack + this.params.decay + duration + this.params.release;
        this.timeout = setTimeout(() => {
            this.stop();
            this.timeout = null;
        }, totalDuration * 1000 + 100);
    }

    playScale(intervals, rootNote, octave, speed = 250, duration = 0.2) {
        if (this.timeout) return;
        super.playScale(intervals, rootNote, octave, speed, duration);
    }

    playSequence(sequence = [], tempo = 120) {
        if (this.timeout) return;
        const msPerBeat = 60000 / tempo;
        let currentTime = 0;
        
        sequence.forEach(noteObj => {
            const note = typeof noteObj === 'string' ? noteObj : noteObj.note;
            const duration = typeof noteObj === 'string' ? 1 : (noteObj.duration || 1);
            const durationMs = duration * msPerBeat;
            
            setTimeout(() => {
                const currentNote = this.params.note;
                this.updateParams({ note });
                this.playBurst(durationMs / 1000 * 0.95);
                this.updateParams({ note: currentNote });
            }, currentTime);
            
            currentTime += durationMs;
        });
        
        this.timeout = setTimeout(() => {
            this.timeout = null;
        }, currentTime + 1000);
    }

    loadPreset(presetName) {
        if (this.presets[presetName]) {
            this.updateParams(this.presets[presetName]);
            this.params.instrumentType = presetName;
        }
    }
}