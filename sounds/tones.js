import { SoundGenerator } from './SoundGenerator.js';

export class TonesGenerator extends SoundGenerator {
    constructor(audioCtx, masterGain, params = {}) {
        super(audioCtx, masterGain, {
            octave: 4, note: 'C', waveform: 'sine', attack: 0.05, decay: 0.1,
            sustain: 0.7, release: 0.2, vibratoAmount: 0, vibratoRate: 5, harmonics: [1.0],
            ...params
        });

        this.noteOffsets = {
            'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 
            'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 
            'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
        };
        this.scales = {
            major: [0, 2, 4, 5, 7, 9, 11, 12],
            minor: [0, 2, 3, 5, 7, 8, 10, 12],
            pentatonicMajor: [0, 2, 4, 7, 9, 12],
            pentatonicMinor: [0, 3, 5, 7, 10, 12],
            blues: [0, 3, 5, 6, 7, 10, 12],
            chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
        };
    }

    getFrequency(note, octave) {
        const A4 = 440, A4Octave = 4, A4NotePosition = 9;
        const noteOffset = this.noteOffsets[note] || 0;
        const semitonesFromA4 = noteOffset - A4NotePosition + (octave - A4Octave) * 12;
        return A4 * Math.pow(2, semitonesFromA4 / 12);
    }

    createSound(frequency, output, options = {}) {
        const osc = this.audioCtx.createOscillator();
        osc.type = this.params.waveform;
        osc.frequency.value = frequency;

        const harmonics = this.params.harmonics || [1.0];
        harmonics.forEach((amp, i) => {
            if (amp <= 0 || i === 0) return; // Skip fundamental (handled by main osc)
            const harmonicOsc = this.audioCtx.createOscillator();
            harmonicOsc.type = this.params.waveform;
            harmonicOsc.frequency.value = frequency * (i + 1);
            const gain = this.audioCtx.createGain();
            gain.gain.value = amp;
            harmonicOsc.connect(gain).connect(output);
            harmonicOsc.start();
            this.addActiveNode(harmonicOsc);
            this.addActiveNode(gain);
        });

        if (this.params.vibratoAmount > 0) {
            const vibratoOsc = this.audioCtx.createOscillator();
            vibratoOsc.frequency.value = this.params.vibratoRate;
            const vibratoGain = this.audioCtx.createGain();
            vibratoGain.gain.value = frequency * (this.params.vibratoAmount / 100);
            vibratoOsc.connect(vibratoGain).connect(osc.frequency);
            vibratoOsc.start();
            this.addActiveNode(vibratoOsc);
            this.addActiveNode(vibratoGain);
        }

        osc.start();
        this.addActiveNode(osc);
        osc.connect(output);
    }

    start() {
        const freq = this.getFrequency(this.params.note, this.params.octave);
        this.playNotes([freq], Infinity); // Continuous playback
    }

    playBurst(duration = 0.5) {
        const freq = this.getFrequency(this.params.note, this.params.octave);
        this.playNotes([freq], duration);
        this.scheduleSound(() => this.stop(), (duration + this.params.release) * 1000 + 100);
    }

    playScale(intervals, rootNote, octave, speed = 250, duration = 0.2) {
        const rootIndex = Object.keys(this.noteOffsets).indexOf(rootNote);
        let currentTime = 0;

        intervals.forEach(interval => {
            const noteIndex = (rootIndex + interval) % 12;
            const adjustedOctave = octave + Math.floor((rootIndex + interval) / 12);
            const note = Object.keys(this.noteOffsets)[noteIndex];
            this.scheduleSound(() => {
                this.playNotes([this.getFrequency(note, adjustedOctave)], duration);
            }, currentTime);
            currentTime += speed;
        });
    }
}