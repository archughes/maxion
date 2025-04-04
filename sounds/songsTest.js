// sounds/songsTest.js
import { SongGenerator } from './songs.js';
import { SoundTestCommon } from './soundTestCommon.js';

class SongsTest extends SoundTestCommon {
    constructor() {
        super(null, null, null);
        this.initAudio();
        this.songGenerator = new SongGenerator(this.audioCtx, this.masterGain, { instrumentType: 'generic' });
        this.songsList = ['twinkle-twinkle', 'mary-had-a-little-lamb', 'row-row-row-your-boat'];
        this.scales = {
            major: [0, 2, 4, 5, 7, 9, 11],
            minor: [0, 2, 3, 5, 7, 8, 10]
        };
        this.setupControls();
        this.setupVisualizations();
    }

    setupControls() {
        this.controls = {
            instrument: document.getElementById('instrument'),
            songs: document.getElementById('songs'),
            progressions: document.getElementById('progressions'),
            scale: document.getElementById('scale'),
            root: document.getElementById('note'),
            tempo: document.getElementById('tempo'),
            tempoValue: document.getElementById('tempoValue'),
            dynamics: document.getElementById('dynamics'),
            octave: document.getElementById('octave'),
            octaveValue: document.getElementById('octaveValue')
        };

        this.populateDropdowns();

        this.controls.instrument.addEventListener('change', () => this.updateInstrument());
        this.controls.tempo.addEventListener('input', () => {
            this.controls.tempoValue.textContent = this.controls.tempo.value;
            this.songGenerator.tempo = parseInt(this.controls.tempo.value);
        });
        this.controls.dynamics.addEventListener('change', () => {
            this.songGenerator.globalDynamics = this.controls.dynamics.value;
        });
        this.controls.octave.addEventListener('input', () => {
            this.controls.octaveValue.textContent = this.controls.octave.value;
        });

        document.getElementById('playSong').addEventListener('click', () => this.playSong());
        document.getElementById('playProgression').addEventListener('click', () => this.playProgression());
    }

    populateDropdowns() {
        const songSelect = this.controls.songs;
        this.songsList.forEach(song => {
            const option = document.createElement('option');
            option.value = song;
            option.textContent = song.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            songSelect.appendChild(option);
        });

        const progressionSelect = this.controls.progressions;
        const progressions = this.songGenerator.progressions[this.songGenerator.instrumentType];
        progressions.forEach(prog => {
            const option = document.createElement('option');
            option.value = prog;
            option.textContent = prog;
            progressionSelect.appendChild(option);
        });
    }

    updateInstrument() {
        const instrumentType = this.controls.instrument.value;
        this.songGenerator = new SongGenerator(this.audioCtx, this.masterGain, { instrumentType });
        this.controls.progressions.innerHTML = '';
        this.populateDropdowns();
    }

    playSong() {
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
        const songName = this.controls.songs.value;
        const octave = parseInt(this.controls.octave.value);
        this.songGenerator.playSong(songName, octave);
        this.startVisualizations(this.songGenerator);
    }

    playProgression() {
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
        const progressionStr = this.controls.progressions.value;
        const rootNote = this.controls.root.value;
        const scaleType = this.controls.scale.value;
        const octave = parseInt(this.controls.octave.value);
        const progression = this.songGenerator.getProgression(progressionStr, rootNote, scaleType);
        this.songGenerator.playProgression(progression, octave, 250, 0.5);
        this.startVisualizations(this.songGenerator);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const songsTest = new SongsTest();
});