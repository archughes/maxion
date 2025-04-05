// tonesTest.js
import { TonesGenerator } from './tones.js';
import { SoundTestCommon, ControlManager } from './soundTestCommon.js';

class TonesTest extends SoundTestCommon {
    constructor() {
        super(null, null, null);
        this.initAudio();
        this.toneGenerator = new TonesGenerator(this.audioCtx, this.masterGain, {
            waveform: 'sine',
            attack: 0.05,
            decay: 0.1,
            sustain: 0.7,
            release: 0.2,
            vibratoAmount: 0,
            vibratoRate: 5,
            harmonics: [1.0]
        });
        this.controlManager = new ControlManager(this.toneGenerator); // Recommendation 2
        this.setupControls();
        this.setupVisualizations();
    }

    setupControls() {
        // Recommendation 1: Use enhanced setupControls from SoundTestCommon
        const controlConfig = {
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
            playScale: { id: 'playScale', onClick: () => this.playScale() }
        };
        super.setupControls(controlConfig, buttonConfig);
        this.setupHarmonicsControls();

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
        const harmonics = [];
        for (let i = 0; i < 5; i++) {
            const value = parseFloat(document.getElementById(`harmonic${i}`).value);
            harmonics.push(value);
        }
        this.toneGenerator.updateParams({ harmonics });
    }

    // Recommendation 5: Use updateGeneratorParams
    updateToneParams() {
        super.updateGeneratorParams(this.toneGenerator, [
            'waveform', 'octave', 'note', 'attack', 'decay', 'sustain', 'release',
            'vibratoAmount', 'vibratoRate'
        ]);
    }

    playNote() {
        const note = this.controls.note.value;
        const octave = parseInt(this.controls.octave.value);
        // Recommendation 6: Use playSound
        super.playSound(this.toneGenerator, { note, octave }, this.toneGenerator.playBurst, 0.5);
        this.addNoteToHistory(note, octave);
    }

    startTone() {
        const note = this.controls.note.value;
        const octave = parseInt(this.controls.octave.value);
        // Recommendation 6: Use playSound
        super.playSound(this.toneGenerator, { note, octave }, this.toneGenerator.start);
        this.addNoteToHistory(note, octave);
    }

    stopTone() {
        this.toneGenerator.stop();
    }

    playScale() {
        const rootNote = this.controls.note.value;
        const octave = parseInt(this.controls.octave.value);
        const scaleType = document.getElementById('scaleType').value;
        const playbackSpeed = parseInt(document.getElementById('playbackSpeed').value);
        const scaleIntervals = this.toneGenerator.scales[scaleType]; // Recommendation 4*: Use generator's scales

        scaleIntervals.forEach(interval => {
            const noteIndex = this.getNoteIndex(rootNote) + interval;
            const adjustedOctave = octave + Math.floor(noteIndex / 12);
            const noteName = this.getNoteByIndex(noteIndex % 12);
            this.addNoteToHistory(noteName, adjustedOctave);
        });

        // Recommendation 6: Use playSound
        super.playSound(this.toneGenerator, null, this.toneGenerator.playScale, scaleIntervals, rootNote, octave, playbackSpeed, 0.2);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const tonesTest = new TonesTest();
});