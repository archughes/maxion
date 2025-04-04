// tones.js
import { SoundGenerator } from './SoundGenerator.js';

export class TonesGenerator extends SoundGenerator {
    constructor(audioCtx, masterGain, params = {}) {
        super(audioCtx, masterGain, {
            octave: params.octave || 4,
            note: params.note || 'C',
            waveform: params.waveform || 'sine',
            attack: params.attack || 0.05,
            decay: params.decay || 0.1,
            sustain: params.sustain || 0.7,
            release: params.release || 0.2,
            vibratoAmount: params.vibratoAmount || 0,
            vibratoRate: params.vibratoRate || 5,
            harmonics: params.harmonics || [1.0]
        });

        this.noteOffsets = {
            'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 
            'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 
            'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
        };
    }

    getFrequency(note, octave) {
        const A4 = 440;
        const A4Octave = 4;
        const A4NotePosition = 9;
        const noteOffset = this.noteOffsets[note] || 0;
        const octaveOffset = (octave - A4Octave) * 12;
        const semitonesFromA4 = noteOffset - A4NotePosition + octaveOffset;
        return A4 * Math.pow(2, semitonesFromA4 / 12);
    }

    createOscillator(frequency) {
        const oscillator = this.audioCtx.createOscillator();
        oscillator.type = this.params.waveform;
        oscillator.frequency.value = frequency;
        return oscillator;
    }

    applyVibrato(oscillator, baseFrequency) {
        if (this.params.vibratoAmount <= 0) return;
        
        const vibratoOsc = this.audioCtx.createOscillator();
        vibratoOsc.frequency.value = this.params.vibratoRate;
        
        const vibratoGain = this.audioCtx.createGain();
        vibratoGain.gain.value = baseFrequency * (this.params.vibratoAmount / 100);
        
        vibratoOsc.connect(vibratoGain);
        vibratoGain.connect(oscillator.frequency);
        
        vibratoOsc.start();
        this.addActiveNode(vibratoOsc);
    }

    createHarmonics(fundamentalFreq, outputGain) {
        const harmonics = this.params.harmonics || [1.0];
        const createdNodes = [];

        harmonics.forEach((amplitude, index) => {
            if (amplitude <= 0) return;

            const harmonicNumber = index + 1;
            const frequency = fundamentalFreq * harmonicNumber;

            const oscillator = this.createOscillator(frequency);
            const harmonicGain = this.audioCtx.createGain();
            harmonicGain.gain.value = amplitude;

            oscillator.connect(harmonicGain);
            harmonicGain.connect(outputGain);

            if (harmonicNumber === 1) {
                this.applyVibrato(oscillator, frequency);
            }

            oscillator.start();
            this.addActiveNode(oscillator);
            this.addActiveNode(harmonicGain);

            createdNodes.push({ oscillator, harmonicGain });
        });

        return createdNodes; // Return for subclasses to use
    }

    start() {
        if (this.timeout) return;
        
        const frequency = this.getFrequency(this.params.note, this.params.octave);
        const mainGain = this.audioCtx.createGain();
        const now = this.audioCtx.currentTime;
        
        mainGain.gain.setValueAtTime(0, now);
        mainGain.gain.linearRampToValueAtTime(1, now + this.params.attack);
        mainGain.gain.linearRampToValueAtTime(this.params.sustain, now + this.params.attack + this.params.decay);
        
        mainGain.connect(this.masterGain);
        this.addActiveNode(mainGain);
        
        this.createHarmonics(frequency, mainGain);
    }

    stop(immediate = false) {
        const now = this.audioCtx.currentTime;
    
        this.activeNodes.forEach(node => {
            if (node instanceof GainNode) {
                node.gain.cancelScheduledValues(now);
                if (immediate) {
                    node.gain.setValueAtTime(0, now); // Immediate stop
                } else {
                    node.gain.setValueAtTime(node.gain.value, now);
                    node.gain.linearRampToValueAtTime(0, now + this.params.release);
                }
            }
        });
    
        if (immediate) {
            super.stop(); // Clean up immediately
        } else {
            this.timeout = setTimeout(() => {
                super.stop();
            }, this.params.release * 1000 + 100);
        }
    }

    playBurst(duration = 0.5) {
        if (this.timeout) return;
        
        const frequency = this.getFrequency(this.params.note, this.params.octave);
        const mainGain = this.audioCtx.createGain();
        const now = this.audioCtx.currentTime;
        
        mainGain.gain.setValueAtTime(0, now);
        mainGain.gain.linearRampToValueAtTime(1, now + this.params.attack);
        mainGain.gain.linearRampToValueAtTime(this.params.sustain, now + this.params.attack + this.params.decay);
        mainGain.gain.linearRampToValueAtTime(0, now + this.params.attack + this.params.decay + duration);
        
        mainGain.connect(this.masterGain);
        this.addActiveNode(mainGain);
        
        this.createHarmonics(frequency, mainGain);
        
        const totalDuration = this.params.attack + this.params.decay + duration + this.params.release;
        this.timeout = setTimeout(() => {
            super.stop();
            this.timeout = null;
        }, totalDuration * 1000 + 100);
    }

    playScale(intervals, rootNote, octave, speed = 250, duration = 0.2) {
        if (this.timeout) return;

        const notes = [];
        const rootIndex = Object.keys(this.noteOffsets).indexOf(rootNote);

        intervals.forEach(interval => {
            const noteIndex = (rootIndex + interval) % 12;
            const adjustedOctave = octave + Math.floor((rootIndex + interval) / 12);
            const noteName = Object.keys(this.noteOffsets)[noteIndex];
            notes.push({ note: noteName, octave: adjustedOctave });
        });

        let currentTime = 0;
        notes.forEach(noteObj => {
            setTimeout(() => {
                const frequency = this.getFrequency(noteObj.note, noteObj.octave);
                const mainGain = this.audioCtx.createGain();
                const now = this.audioCtx.currentTime;

                mainGain.gain.setValueAtTime(0, now);
                mainGain.gain.linearRampToValueAtTime(1, now + this.params.attack);
                mainGain.gain.linearRampToValueAtTime(this.params.sustain, now + this.params.attack + this.params.decay);
                mainGain.gain.linearRampToValueAtTime(0, now + this.params.attack + this.params.decay + duration);

                mainGain.connect(this.masterGain);
                this.addActiveNode(mainGain);
                this.createHarmonics(frequency, mainGain);
            }, currentTime);
            currentTime += speed;
        });

        this.timeout = setTimeout(() => {
            this.timeout = null;
        }, currentTime + (duration + this.params.release) * 1000 + 100);
    }

    updateParams(newParams) {
        super.updateParams(newParams);
    }
}