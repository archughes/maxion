// sounds/instrumentsTest.js
import { InstrumentGenerator } from './instruments.js';
import { SoundTestCommon, ControlManager } from './soundTestCommon.js';

class InstrumentsTest extends SoundTestCommon {
    constructor() {
        super(null, null, null);
        this.initAudio();
        this.instrumentGenerator = new InstrumentGenerator(this.audioCtx, this.masterGain, { instrumentType: 'generic' });
        this.controlManager = new ControlManager(this.instrumentGenerator); // Recommendation 2
        this.setupControls();
        this.setupVisualizations();
    }

    setupControls() {
        // Recommendation 1: Use enhanced setupControls from SoundTestCommon
        const controlConfig = {
            instrument: { id: 'instrument', type: 'select', onChange: (val) => this.updateInstrument(val) },
            waveform: { id: 'waveform', type: 'select', onChange: () => this.updateToneParams() },
            octave: { id: 'octave', type: 'range', onChange: () => this.updateToneParams() },
            note: { id: 'note', type: 'select', onChange: () => this.updateToneParams() },
            attack: { id: 'attack', type: 'range', onChange: () => this.updateToneParams() },
            decay: { id: 'decay', type: 'range', onChange: () => this.updateToneParams() },
            sustain: { id: 'sustain', type: 'range', onChange: () => this.updateToneParams() },
            release: { id: 'release', type: 'range', onChange: () => this.updateToneParams() },
            vibratoAmount: { id: 'vibratoAmount', type: 'range', onChange: () => this.updateToneParams() },
            vibratoRate: { id: 'vibratoRate', type: 'range', onChange: () => this.updateToneParams() }
        };
        const buttonConfig = {
            playNote: { id: 'playNote', onClick: () => this.playNote() },
            startTone: { id: 'startTone', onClick: () => this.startTone() },
            stopTone: { id: 'stopTone', onClick: () => this.stopTone() },
            playChord: { id: 'playChord', onClick: () => this.playChord() },
            playScale: { id: 'playScale', onClick: () => this.playScale() }
        };
        super.setupControls(controlConfig, buttonConfig);
        this.setupHarmonicsControls();
        this.updateSlidersFromPreset();

        document.getElementById('playbackSpeed').addEventListener('input', () => {
            document.getElementById('playbackSpeedValue').textContent = document.getElementById('playbackSpeed').value;
        });
    }

    setupHarmonicsControls() {
        const harmonicsControl = document.getElementById('harmonicsControl');
        harmonicsControl.innerHTML = '';

        for (let i = 0; i < 5; i++) {
            const harmonicDiv = document.createElement('div');
            harmonicDiv.className = 'control-row';
            const label = document.createElement('label');
            label.textContent = `Harmonic ${i + 1}:`;
            const slider = document.createElement('input');
            slider.type = 'range';
            slider.id = `harmonic${i}`;
            slider.min = '0';
            slider.max = '1';
            slider.step = '0.01';
            slider.value = i === 0 ? '1' : '0';
            const valueDisplay = document.createElement('span');
            valueDisplay.id = `harmonic${i}Value`;
            valueDisplay.className = 'value-display';
            valueDisplay.textContent = slider.value;

            slider.addEventListener('input', () => {
                valueDisplay.textContent = slider.value;
                this.updateHarmonics();
            });

            harmonicDiv.appendChild(label);
            harmonicDiv.appendChild(slider);
            harmonicDiv.appendChild(valueDisplay);
            harmonicsControl.appendChild(harmonicDiv);
        }
    }

    updateHarmonics() {
        const harmonics = Array.from({ length: 5 }, (_, i) => parseFloat(document.getElementById(`harmonic${i}`).value));
        this.instrumentGenerator.updateParams({ harmonics });
    }

    // Recommendation 5: Use updateGeneratorParams
    updateToneParams() {
        super.updateGeneratorParams(this.instrumentGenerator, [
            'waveform', 'octave', 'note', 'attack', 'decay', 'sustain', 'release',
            'vibratoAmount', 'vibratoRate'
        ]);
    }

    updateInstrument(instrumentType) {
        this.instrumentGenerator = new InstrumentGenerator(this.audioCtx, this.masterGain, {
            instrumentType,
            note: this.controls.note.value,
            octave: parseInt(this.controls.octave.value)
        });
        this.instrumentGenerator.applyPreset(instrumentType);
        this.updateSlidersFromPreset();
    }

    updateSlidersFromPreset() {
        const params = this.instrumentGenerator.params;
        this.controls.waveform.value = params.waveform;
        this.controls.octave.value = params.octave;
        this.controls.octaveValue.textContent = params.octave;
        this.controls.note.value = params.note;
        this.controls.attack.value = params.attack;
        this.controls.attackValue.textContent = params.attack;
        this.controls.decay.value = params.decay;
        this.controls.decayValue.textContent = params.decay;
        this.controls.sustain.value = params.sustain;
        this.controls.sustainValue.textContent = params.sustain;
        this.controls.release.value = params.release;
        this.controls.releaseValue.textContent = params.release;
        this.controls.vibratoAmount.value = params.vibratoAmount;
        this.controls.vibratoAmountValue.textContent = params.vibratoAmount;
        this.controls.vibratoRate.value = params.vibratoRate;
        this.controls.vibratoRateValue.textContent = params.vibratoRate;
        params.harmonics.forEach((value, i) => {
            if (i < 5) {
                document.getElementById(`harmonic${i}`).value = value;
                document.getElementById(`harmonic${i}Value`).textContent = value;
            }
        });
    }

    playNote() {
        const note = this.controls.note.value;
        const octave = parseInt(this.controls.octave.value);
        // Recommendation 6: Use playSound
        super.playSound(this.instrumentGenerator, { note, octave }, this.instrumentGenerator.playBurst, 0.5);
        this.addNoteToHistory(note, octave);
    }

    startTone() {
        const note = this.controls.note.value;
        const octave = parseInt(this.controls.octave.value);
        // Recommendation 6: Use playSound
        super.playSound(this.instrumentGenerator, { note, octave }, this.instrumentGenerator.start);
        this.addNoteToHistory(note, octave);
    }

    stopTone() {
        this.instrumentGenerator.stop();
    }

    playChord() {
        const rootNote = this.controls.note.value;
        const octave = parseInt(this.controls.octave.value);
        const chordType = document.getElementById('chordType').value;
        const chordNotes = this.instrumentGenerator.createChordNotes(rootNote, chordType, octave);

        chordNotes.forEach(noteObj => this.addNoteToHistory(noteObj.note, noteObj.octave));
        // Recommendation 6: Use playSound
        super.playSound(this.instrumentGenerator, null, this.instrumentGenerator.playChord, chordNotes, 0.5);
    }

    playScale() {
        const rootNote = this.controls.note.value;
        const octave = parseInt(this.controls.octave.value);
        const scaleType = document.getElementById('scaleType').value;
        const playbackSpeed = parseInt(document.getElementById('playbackSpeed').value);
        const scaleIntervals = this.instrumentGenerator.scales[scaleType]; // Recommendation 4*: Use generator's scales

        scaleIntervals.forEach(interval => {
            const noteIndex = this.instrumentGenerator.getNoteIndex(rootNote) + interval;
            const adjustedOctave = octave + Math.floor(noteIndex / 12);
            const noteName = this.instrumentGenerator.getNoteName(noteIndex);
            this.addNoteToHistory(noteName, adjustedOctave);
        });

        // Recommendation 6: Use playSound
        super.playSound(this.instrumentGenerator, null, this.instrumentGenerator.playScale, scaleIntervals, rootNote, octave, playbackSpeed, 0.2);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const instrumentsTest = new InstrumentsTest();
});