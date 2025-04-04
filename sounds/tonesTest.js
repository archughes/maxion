// tonesTest.js
import { TonesGenerator } from './tones.js';
import { SoundTestCommon } from './soundTestCommon.js';

class TonesTest extends SoundTestCommon {
    constructor() {
        super(null, null, null);
        this.initAudio();
        this.scales = {
            major: [0, 2, 4, 5, 7, 9, 11, 12],
            minor: [0, 2, 3, 5, 7, 8, 10, 12],
            pentatonicMajor: [0, 2, 4, 7, 9, 12],
            pentatonicMinor: [0, 3, 5, 7, 10, 12],
            blues: [0, 3, 5, 6, 7, 10, 12],
            chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
        };
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
        this.setupControls();
        this.setupVisualizations();
    }

    setupControls() {
        this.controls = {
            waveform: document.getElementById('waveform'),
            octave: document.getElementById('octave'),
            octaveValue: document.getElementById('octaveValue'),
            note: document.getElementById('note'),
            attack: document.getElementById('attack'),
            attackValue: document.getElementById('attackValue'),
            decay: document.getElementById('decay'),
            decayValue: document.getElementById('decayValue'),
            sustain: document.getElementById('sustain'),
            sustainValue: document.getElementById('sustainValue'),
            release: document.getElementById('release'),
            releaseValue: document.getElementById('releaseValue'),
            vibratoAmount: document.getElementById('vibratoAmount'),
            vibratoAmountValue: document.getElementById('vibratoAmountValue'),
            vibratoRate: document.getElementById('vibratoRate'),
            vibratoRateValue: document.getElementById('vibratoRateValue'),
        };

        this.setupHarmonicsControls();

        this.controls.waveform.addEventListener('change', () => this.updateToneParams());
        this.controls.octave.addEventListener('input', () => {
            this.controls.octaveValue.textContent = this.controls.octave.value;
            this.updateToneParams();
        });
        this.controls.note.addEventListener('change', () => this.updateToneParams());
        this.controls.attack.addEventListener('input', () => {
            this.controls.attackValue.textContent = this.controls.attack.value;
            this.updateToneParams();
        });
        this.controls.decay.addEventListener('input', () => {
            this.controls.decayValue.textContent = this.controls.decay.value;
            this.updateToneParams();
        });
        this.controls.sustain.addEventListener('input', () => {
            this.controls.sustainValue.textContent = this.controls.sustain.value;
            this.updateToneParams();
        });
        this.controls.release.addEventListener('input', () => {
            this.controls.releaseValue.textContent = this.controls.release.value;
            this.updateToneParams();
        });
        this.controls.vibratoAmount.addEventListener('input', () => {
            this.controls.vibratoAmountValue.textContent = this.controls.vibratoAmount.value;
            this.updateToneParams();
        });
        this.controls.vibratoRate.addEventListener('input', () => {
            this.controls.vibratoRateValue.textContent = this.controls.vibratoRate.value;
            this.updateToneParams();
        });

        document.getElementById('playNote').addEventListener('click', () => this.playNote());
        document.getElementById('startTone').addEventListener('click', () => this.startTone());
        document.getElementById('stopTone').addEventListener('click', () => this.stopTone());
        document.getElementById('playScale').addEventListener('click', () => this.playScale());

        document.getElementById('playbackSpeed').addEventListener('input', () => {
            document.getElementById('playbackSpeedValue').textContent = 
                document.getElementById('playbackSpeed').value;
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

    updateToneParams() {
        const params = {
            waveform: document.getElementById('waveform').value,
            octave: parseInt(document.getElementById('octave').value),
            note: document.getElementById('note').value,
            attack: parseFloat(document.getElementById('attack').value),
            decay: parseFloat(document.getElementById('decay').value),
            sustain: parseFloat(document.getElementById('sustain').value),
            release: parseFloat(document.getElementById('release').value),
            vibratoAmount: parseFloat(document.getElementById('vibratoAmount').value),
            vibratoRate: parseFloat(document.getElementById('vibratoRate').value)
        };
        this.toneGenerator.updateParams(params);
    }

    playNote() {
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
        const note = document.getElementById('note').value;
        const octave = parseInt(document.getElementById('octave').value);
        this.toneGenerator.updateParams({ note, octave });
        this.addNoteToHistory(note, octave);
        this.toneGenerator.playBurst(0.5);
        this.startVisualizations(this.toneGenerator);
    }

    startTone() {
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
        const note = document.getElementById('note').value;
        const octave = parseInt(document.getElementById('octave').value);
        this.toneGenerator.updateParams({ note, octave });
        this.addNoteToHistory(note, octave);
        this.toneGenerator.start();
        this.startVisualizations(this.toneGenerator);
    }

    stopTone() {
        this.toneGenerator.stop();
    }

    playScale() {
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
        const rootNote = document.getElementById('note').value;
        const octave = parseInt(document.getElementById('octave').value);
        const scaleType = document.getElementById('scaleType').value;
        const playbackSpeed = parseInt(document.getElementById('playbackSpeed').value);
        const scaleIntervals = this.scales[scaleType];

        scaleIntervals.forEach(interval => {
            const noteIndex = this.getNoteIndex(rootNote) + interval;
            const adjustedOctave = octave + Math.floor(noteIndex / 12);
            const noteName = this.getNoteByIndex(noteIndex % 12);
            this.addNoteToHistory(noteName, adjustedOctave);
        });

        this.toneGenerator.playScale(scaleIntervals, rootNote, octave, playbackSpeed, 0.2);
        this.startVisualizations(this.toneGenerator);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const tonesTest = new TonesTest();
});