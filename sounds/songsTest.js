// sounds/songsTest.js
import { SongGenerator } from './songs.js';
import { SoundTestCommon, ControlManager } from './soundTestCommon.js';

class SongsTest extends SoundTestCommon {
    constructor() {
        super(null, null, null);
        this.initAudio();
        this.songGenerator = new SongGenerator(this.audioCtx, this.masterGain, { instrumentType: 'generic' });
        this.songsList = ['fairy-fountain', 'twinkle-twinkle', 'mary-had-a-little-lamb', 'row-row-row-your-boat'];
        this.isRecording = false;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.controlManager = new ControlManager(this.songGenerator); // Recommendation 2
        this.setupControls();
        this.setupVisualizations();
    }

    setupControls() {
        // Recommendation 1: Use enhanced setupControls from SoundTestCommon
        const controlConfig = {
            instrument: { id: 'instrument', type: 'select', onChange: (val) => this.updateInstrument(val) },
            songs: { id: 'songs', type: 'select', onChange: (val) => val && this.loadAndUpdateSong(val) },
            progressions: { id: 'progressions', type: 'select', onChange: () => {} },
            scale: { id: 'scale', type: 'select', onChange: (val) => this.songGenerator.setOverride('scale', val) },
            root: { id: 'note', type: 'select', onChange: (val) => this.songGenerator.setOverride('root', val) },
            tempo: { id: 'tempo', type: 'range', onChange: (val) => this.songGenerator.setOverride('tempo', parseInt(val)) },
            dynamics: { id: 'dynamics', type: 'select', onChange: (val) => this.songGenerator.globalDynamics = val },
            octave: { id: 'octave', type: 'range', onChange: (val) => this.songGenerator.setOverride('octave', parseInt(val)) }
        };
        const buttonConfig = {
            playSong: { id: 'playSong', onClick: () => this.playSong() },
            playProgression: { id: 'playProgression', onClick: () => this.playProgression() },
            stop: { id: 'stop', onClick: () => this.stop(true) },
            recordSong: { id: 'recordSong', onClick: () => this.recordSong() }
        };
        super.setupControls(controlConfig, buttonConfig);
        this.populateDropdowns();
    }

    populateDropdowns() {
        const songSelect = this.controls.songs;
        while (songSelect.options.length > 1) songSelect.remove(1);
        this.songsList.forEach(song => {
            const option = document.createElement('option');
            option.value = song;
            option.textContent = song.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            songSelect.appendChild(option);
        });

        const progressionSelect = this.controls.progressions;
        progressionSelect.innerHTML = '';
        const progressions = this.songGenerator.progressions[this.songGenerator.params.instrumentType];
        progressions.forEach(prog => {
            const option = document.createElement('option');
            option.value = prog;
            option.textContent = prog;
            progressionSelect.appendChild(option);
        });
    }

    async loadAndUpdateSong(songName) {
        await this.songGenerator.loadSong(songName);
        this.updateUIFromSongConfig(songName);
    }

    updateInstrument(instrumentType) {
        this.songGenerator.setOverride('instrument', instrumentType);
        this.controls.progressions.innerHTML = '';
        this.populateDropdowns();
    }

    stop(immediate = false) {
        this.songGenerator.stop(immediate);
    }

    async recordSong() {
        if (this.isRecording) {
            this.stopRecording();
            return;
        }

        const songName = this.controls.songs.value;
        await this.songGenerator.loadSong(songName);

        const dest = this.audioCtx.createMediaStreamDestination();
        this.masterGain.connect(dest);

        this.mediaRecorder = new MediaRecorder(dest.stream);
        this.audioChunks = [];

        this.mediaRecorder.ondataavailable = (event) => this.audioChunks.push(event.data);
        this.mediaRecorder.onstop = () => {
            this.saveRecording(songName);
            this.masterGain.disconnect(dest);
        };

        this.isRecording = true;
        this.mediaRecorder.start();

        try {
            this.masterGain.disconnect(this.audioCtx.destination);
        } catch (e) {
            console.warn("masterGain was not connected to destination:", e.message);
        }

        this.songGenerator.playSong(songName);
    }

    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            this.masterGain.connect(this.audioCtx.destination);
            this.songGenerator.stop();
        }
    }

    saveRecording(songName) {
        const blob = new Blob(this.audioChunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${songName}-${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }

    updateUIFromSongConfig(songName) {
        const config = this.songGenerator.getSongConfig(songName);
        if (!config) return;

        if (config.tempo !== undefined) {
            this.controls.tempo.value = config.tempo;
            this.controls.tempoValue.textContent = config.tempo;
            this.songGenerator.tempo = config.tempo;
        }

        if (config.instruments?.length > 0) {
            this.controls.instrument.value = config.instruments[0];
            this.songGenerator.setOverride('instrument', config.instruments[0], false);
        }

        const firstConfig = config.configs && Object.values(config.configs)[0];
        if (firstConfig) {
            if (firstConfig.octave !== undefined) {
                this.controls.octave.value = firstConfig.octave;
                this.controls.octaveValue.textContent = firstConfig.octave;
                this.songGenerator.setOverride('octave', firstConfig.octave, false);
            }
            if (firstConfig.scale !== undefined) {
                this.controls.scale.value = firstConfig.scale;
                this.songGenerator.setOverride('scale', firstConfig.scale, false);
            }
            if (firstConfig.root !== undefined) {
                this.controls.root.value = firstConfig.root;
                this.songGenerator.setOverride('root', firstConfig.root, false);
            }
        }

        if (this.songGenerator.globalDynamics !== undefined) {
            this.controls.dynamics.value = this.songGenerator.globalDynamics;
        }
    }

    async playSong() {
        const songName = this.controls.songs.value;
        if (!songName) return;

        await this.songGenerator.loadSong(songName);
        this.updateUIFromSongConfig(songName);
        if (!this.isRecording) {
            super.playSound(this.songGenerator, null, this.songGenerator.playSong, songName);
        }
    }

    playProgression() {
        const progressionStr = this.controls.progressions.value;
        const rootNote = this.controls.root.value;
        const scaleType = this.controls.scale.value;
        const octave = parseInt(this.controls.octave.value);
        const progression = this.songGenerator.getProgression(progressionStr, rootNote, scaleType);

        if (!this.isRecording) {
            super.playSound(this.songGenerator, null, this.songGenerator.playProgression, progression, octave, 250, 0.5);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const songsTest = new SongsTest();
});