// sounds/songsTest.js
import { SongGenerator } from './songs.js';
import { SoundTestCommon } from './soundTestCommon.js';

class SongsTest extends SoundTestCommon {
    constructor() {
        super(null, null, null);
        this.initAudio();
        this.songGenerator = new SongGenerator(this.audioCtx, this.masterGain, { instrumentType: 'generic' });
        this.songsList = ['fairy-fountain', 'twinkle-twinkle', 'mary-had-a-little-lamb', 'row-row-row-your-boat'];
        this.scales = {
            major: [0, 2, 4, 5, 7, 9, 11],
            minor: [0, 2, 3, 5, 7, 8, 10]
        };
        this.isRecording = false;
        this.mediaRecorder = null;
        this.audioChunks = [];
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

        this.controls.songs.addEventListener('change', () => {
            if (this.controls.songs.value) {
                this.loadAndUpdateSong(this.controls.songs.value);
            }
        });

        this.controls.instrument.addEventListener('change', () => {
            this.songGenerator.setOverride('instrument', this.controls.instrument.value);
            this.updateInstrument();
        });
        this.controls.tempo.addEventListener('input', () => {
            this.controls.tempoValue.textContent = this.controls.tempo.value;
            this.songGenerator.setOverride('tempo', parseInt(this.controls.tempo.value));
        });
        this.controls.dynamics.addEventListener('change', () => {
            this.songGenerator.globalDynamics = this.controls.dynamics.value;
        });
        this.controls.octave.addEventListener('input', () => {
            this.controls.octaveValue.textContent = this.controls.octave.value;
            this.songGenerator.setOverride('octave', parseInt(this.controls.octave.value));
        });
        this.controls.scale.addEventListener('change', () => {
            this.songGenerator.setOverride('scale', this.controls.scale.value);
        });
        this.controls.root.addEventListener('change', () => {
            this.songGenerator.setOverride('root', this.controls.root.value);
        });

        document.getElementById('playSong').addEventListener('click', () => this.playSong());
        document.getElementById('playProgression').addEventListener('click', () => this.playProgression());
        document.getElementById('stop').addEventListener('click', () => this.stop(true));
        document.getElementById('recordSong').addEventListener('click', () => this.recordSong());
    }

    populateDropdowns() {
        const songSelect = this.controls.songs;
        // Clear existing options except the placeholder
        while (songSelect.options.length > 1) {
            songSelect.remove(1);
        }
        
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

    async loadAndUpdateSong(songName) {
        await this.songGenerator.loadSong(songName);
        this.updateUIFromSongConfig(songName);
    }

    updateInstrument() {
        const instrumentType = this.controls.instrument.value;
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
    
        // Set up audio context destination for recording
        const dest = this.audioCtx.createMediaStreamDestination();
        this.masterGain.connect(dest);
    
        this.mediaRecorder = new MediaRecorder(dest.stream);
        this.audioChunks = [];
    
        this.mediaRecorder.ondataavailable = (event) => {
            this.audioChunks.push(event.data);
        };
    
        this.mediaRecorder.onstop = () => {
            this.saveRecording(songName);
            this.masterGain.disconnect(dest); // Disconnect recording destination
        };
    
        this.isRecording = true;
        this.mediaRecorder.start();
    
        // Only disconnect from speakers if connected
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

        // Update tempo only if present
        if (config.tempo !== undefined) {
            this.controls.tempo.value = config.tempo;
            this.controls.tempoValue.textContent = config.tempo;
            this.songGenerator.tempo = config.tempo;
        }

        // Update instrument only if instruments array exists and has entries
        if (config.instruments?.length > 0) {
            this.controls.instrument.value = config.instruments[0];
            this.songGenerator.setOverride('instrument', config.instruments[0], false);
        }

        // Get first instrument's config if it exists
        const firstConfig = config.configs && Object.values(config.configs)[0];
        if (firstConfig) {
            // Update octave only if present
            if (firstConfig.octave !== undefined) {
                this.controls.octave.value = firstConfig.octave;
                this.controls.octaveValue.textContent = firstConfig.octave;
                this.songGenerator.setOverride('octave', firstConfig.octave, false);
            }

            // Update scale only if present
            if (firstConfig.scale !== undefined) {
                this.controls.scale.value = firstConfig.scale;
                this.songGenerator.setOverride('scale', firstConfig.scale, false);
            }

            // Update root only if present
            if (firstConfig.root !== undefined) {
                this.controls.root.value = firstConfig.root;
                this.songGenerator.setOverride('root', firstConfig.root, false);
            }
        }

        // Update dynamics only if globalDynamics has been explicitly set
        if (this.songGenerator.globalDynamics !== undefined) {
            this.controls.dynamics.value = this.songGenerator.globalDynamics;
        }
    }

    async playSong() {
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
        const songName = this.controls.songs.value;
        if (!songName) return; // Don't play if no song selected
        
        await this.songGenerator.loadSong(songName);
        const config = this.songGenerator.getSongConfig(songName);
        this.updateUIFromSongConfig(songName); // Update UI before playing
        
        if (!this.isRecording) {
            this.songGenerator.playSong(songName);
            this.startVisualizations(this.songGenerator);
        }
        if (config) {
            if (!this.songGenerator.userOverrides.tempo) {
                this.controls.tempo.value = config.tempo;
                this.controls.tempoValue.textContent = config.tempo;
                this.songGenerator.tempo = config.tempo;
            }
            if (!this.songGenerator.userOverrides.instrument) {
                this.controls.instrument.value = config.instruments[0]; // Default to first instrument
            }
            const firstConfig = Object.values(config.configs)[0];
            if (!this.songGenerator.userOverrides.octave) {
                this.controls.octave.value = firstConfig.octave;
                this.controls.octaveValue.textContent = firstConfig.octave;
            }
            if (!this.songGenerator.userOverrides.scale) {
                this.controls.scale.value = firstConfig.scale;
            }
            if (!this.songGenerator.userOverrides.root) {
                this.controls.root.value = firstConfig.root;
            }
        }

        this.songGenerator.playSong(songName);
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

        if (!this.isRecording) {
            this.songGenerator.playProgression(progression, octave, 250, 0.5);
            this.startVisualizations(this.songGenerator);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const songsTest = new SongsTest();
});