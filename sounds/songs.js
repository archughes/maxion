// songs.js
import { InstrumentGenerator } from './instruments.js';

export class SongGenerator extends InstrumentGenerator {
    constructor(audioCtx, masterGain, params = {}) {
        super(audioCtx, masterGain, params);
        this.tempo = params.tempo || 120;
        this.globalDynamics = params.globalDynamics || 'mf';
        this.songs = {}; // Store loaded song data
        this.progressions = this.collectProgressions();
        this.instrumentInstances = {}; // Instances of InstrumentGenerator for each instrument
        this.userOverrides = {
            tempo: false,
            instrument: false,
            octave: false,
            scale: false,
            root: false,
            waveform: false,
            vibratoAmount: false,
            vibratoRate: false,
            harmonics: false,
            resonance: false,
            brightness: false,
            detune: false,
            stereoWidth: false
        };
        this.timeouts = []; // Track all scheduled timeouts
        this.isStopped = false; // Flag to prevent playback after stop
    }

    // Define common chord progressions for each instrument
    collectProgressions() {
        return {
            generic: ['I-IV-V', 'I-vi-IV-V'],
            piano: ['I-IV-V-I', 'I-vi-IV-V', 'ii-V-I'],
            organ: ['ii-V-I', 'I-IV-ii-V', 'I-vi-ii-V'],
            guitar: ['I-IV-V', 'I-vi-IV-V', 'I-IV-ii-V'],
            brass: ['I-IV-V-I', 'ii-V-I', 'I-IV-ii-V'],
            strings: ['I-vi-IV-V', 'vi-IV-I-V', 'I-IV-ii-V'],
            theremin: ['I-V', 'I-IV', 'I-vi'],
            flute: ['I-IV-V', 'I-V-I', 'ii-IV-I']
        };
    }

    // Load song data from JSON file
    async loadSong(songName) {
        try {
            const songFile = `./sounds/songs/${songName}.json`;
            console.log('Loading song:', songFile);
            const response = await fetch(songFile);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const songData = await response.json();

            if (!songData || !songData.instruments || typeof songData.instruments !== 'object') {
                throw new Error('Invalid song data format: missing or invalid instruments');
            }

            this.songs[songName] = songData;

            // Create instrument instances for each instrument in the song
            for (const [instrument, config] of Object.entries(songData.instruments)) {
                const instrParams = {
                    instrumentType: instrument,
                    octave: config.octave || 4,
                    waveform: config.waveform || this.params.waveform,
                    attack: config.attack || this.params.attack,
                    decay: config.decay || this.params.decay,
                    sustain: config.sustain || this.params.sustain,
                    release: config.release || this.params.release,
                    vibratoAmount: config.vibratoAmount || this.params.vibratoAmount,
                    vibratoRate: config.vibratoRate || this.params.vibratoRate,
                    harmonics: config.harmonics || this.params.harmonics,
                    resonance: config.resonance || this.params.resonance,
                    brightness: config.brightness || this.params.brightness,
                    detune: config.detune || this.params.detune,
                    stereoWidth: config.stereoWidth || this.params.stereoWidth
                };
                this.instrumentInstances[instrument] = new InstrumentGenerator(
                    this.audioCtx,
                    this.masterGain,
                    instrParams
                );
            }

            return songData;
        } catch (error) {
            console.error(`Error loading song ${songName}:`, error.message);
            return null;
        }
    }

    // Get song configuration for UI updates
    getSongConfig(songName) {
        const song = this.songs[songName];
        if (!song) return null;
        return {
            tempo: song.tempo,
            instruments: Object.keys(song.instruments),
            configs: song.instruments
        };
    }

    // Set user overrides for controls
    setOverride(control, value, markAsUserOverride = true) {
        if (markAsUserOverride) {
            this.userOverrides[control] = true;
        }
        switch (control) {
            case 'tempo': this.tempo = value; break;
            case 'instrument':
                for (const inst of Object.values(this.instrumentInstances)) {
                    inst.applyPreset(value);
                }
                this.instrumentType = value;
                break;
            case 'octave': this.params.octave = value; break;
            case 'scale': this.params.scale = value; break;
            case 'root': this.params.root = value; break;
            case 'waveform': this.params.waveform = value; break;
            case 'vibratoAmount': this.params.vibratoAmount = value; break;
            case 'vibratoRate': this.params.vibratoRate = value; break;
            case 'harmonics': this.params.harmonics = value; break;
            case 'resonance': this.params.resonance = value; break;
            case 'brightness': this.params.brightness = value; break;
            case 'detune': this.params.detune = value; break;
            case 'stereoWidth': this.params.stereoWidth = value; break;
        }
    }

    // Apply dynamics to gain node
    applyDynamics(dynamics, gainNode, time) {
        const dynamicLevels = {
            'pp': 0.2, 'p': 0.4, 'mp': 0.6, 'mf': 0.8, 'f': 1.0, 'ff': 1.2
        };
        const level = dynamicLevels[dynamics] || dynamicLevels['mf'];
        gainNode.gain.setValueAtTime(level, time);
    }

    // Clear all scheduled timeouts
    clearTimeouts() {
        this.timeouts.forEach(timeout => clearTimeout(timeout));
        this.timeouts = [];
        this.timeout = null;
    }

    // Stop playback, optionally immediately
    stop(immediate = false) {
        this.isStopped = true; // Prevent new audio events
        this.clearTimeouts(); // Cancel all pending timeouts
        for (const instrument of Object.values(this.instrumentInstances)) {
            instrument.stop(immediate); // Stop all instrument instances
        }
        super.stop(immediate); // Stop active nodes in parent class
    }

    // Play a song with sequence of notes/chords
    async playSong(songName) {
        this.clearTimeouts();
        this.isStopped = false; // Reset stop flag
        const song = this.songs[songName] || await this.loadSong(songName);
        if (!song) {
            console.error(`Song ${songName} could not be loaded.`);
            return;
        }

        const msPerBeat = 60000 / (this.userOverrides.tempo ? this.tempo : song.tempo || this.tempo);
        let maxTime = 0;

        for (const [instrument, config] of Object.entries(song.instruments)) {
            const fullSequence = [];
            const pattern = song.repeatPattern || 'v';
            const parts = pattern.split(' ');
            parts.forEach(part => {
                if (part === 'v' && config.verse) fullSequence.push(...config.verse);
                else if (part === 'c' && config.chorus) fullSequence.push(...config.chorus);
                else if (part === 'b' && config.bridge) fullSequence.push(...config.bridge);
            });

            let currentTime = 0;
            const instrumentGen = this.instrumentInstances[instrument];

            // Apply overrides if not set in config
            if (!config.waveform && this.userOverrides.waveform) instrumentGen.updateParams({ waveform: this.params.waveform });
            if (!config.vibratoAmount && this.userOverrides.vibratoAmount) instrumentGen.updateParams({ vibratoAmount: this.params.vibratoAmount });
            if (!config.vibratoRate && this.userOverrides.vibratoRate) instrumentGen.updateParams({ vibratoRate: this.params.vibratoRate });
            if (!config.harmonics && this.userOverrides.harmonics) instrumentGen.updateParams({ harmonics: this.params.harmonics });
            if (!config.resonance && this.userOverrides.resonance) instrumentGen.updateParams({ resonance: this.params.resonance });
            if (!config.brightness && this.userOverrides.brightness) instrumentGen.updateParams({ brightness: this.params.brightness });
            if (!config.detune && this.userOverrides.detune) instrumentGen.updateParams({ detune: this.params.detune });
            if (!config.stereoWidth && this.userOverrides.stereoWidth) instrumentGen.updateParams({ stereoWidth: this.params.stereoWidth });

            fullSequence.forEach((event) => {
                if (this.isStopped) return; // Exit if stopped

                const durationMs = event.duration * msPerBeat;
                const timeoutId = setTimeout(() => {
                    if (this.isStopped) return; // Check again before playing

                    const octave = this.userOverrides.octave ? this.params.octave : config.octave || 4;
                    if (event.type === 'chord') {
                        const chordNotes = instrumentGen.createChordNotes(event.root, event.chordType, octave);
                        const gainNode = instrumentGen.playNotesWithEnvelope(
                            chordNotes.map(note => instrumentGen.getFrequency(note.note, note.octave)),
                            durationMs / 1000 * 0.95,
                            this.masterGain
                        );
                        this.applyDynamics(event.dynamics || this.globalDynamics, gainNode, this.audioCtx.currentTime);
                        if (event.crescendo || event.decrescendo) {
                            const endLevel = event.crescendo ? 1.2 : 0.2;
                            gainNode.gain.linearRampToValueAtTime(endLevel, this.audioCtx.currentTime + durationMs / 1000);
                        }
                    } else if (event.type === 'tone') {
                        const frequency = instrumentGen.getFrequency(event.note, octave);
                        const gainNode = instrumentGen.playNotesWithEnvelope(
                            [frequency],
                            durationMs / 1000 * 0.95,
                            this.masterGain
                        );
                        this.applyDynamics(event.dynamics || this.globalDynamics, gainNode, this.audioCtx.currentTime);
                    }
                }, currentTime);
                this.timeouts.push(timeoutId); // Track timeout
                currentTime += durationMs;
            });

            maxTime = Math.max(maxTime, currentTime);
        }

        if (!this.isStopped) {
            const endTimeout = setTimeout(() => {
                if (!this.isStopped) super.stop();
                this.clearTimeouts();
            }, maxTime + 1000);
            this.timeouts.push(endTimeout);
        }
    }

    // Generate a chord progression
    getProgression(progressionStr, root = 'C', scaleType = 'major') {
        const scales = {
            major: [0, 2, 4, 5, 7, 9, 11],
            minor: [0, 2, 3, 5, 7, 8, 10]
        };
        const scale = scales[scaleType] || scales.major;
        const rootIndex = this.getNoteIndex(root);
        const romanToInterval = {
            'I': 0, 'ii': 2, 'iii': 4, 'IV': 5, 'V': 7, 'vi': 9, 'vii': 11
        };
        const romanToType = {
            'I': 'major', 'ii': 'minor', 'iii': 'minor', 'IV': 'major', 'V': 'major', 'vi': 'minor', 'vii': 'dim',
            'V7': 'dom7', 'ii7': 'min7', 'vii7': 'halfDim7'
        };

        return progressionStr.split('-').map(roman => {
            const isSeventh = roman.endsWith('7');
            const baseRoman = isSeventh ? roman.slice(0, -1) : roman;
            const degree = romanToInterval[baseRoman.toLowerCase()] || 0;
            const noteIndex = (rootIndex + scale[degree / 2]) % 12;
            const note = this.getNoteName(noteIndex);
            const type = romanToType[roman] || romanToType[baseRoman] || 'major';
            return { root: note, type };
        });
    }

    // Play a chord progression
    playProgression(progression, octave, speed = 250, duration = 0.5) {
        this.clearTimeouts();
        this.isStopped = false; // Reset stop flag
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

        let currentTime = 0;
        progression.forEach(chord => {
            if (this.isStopped) return; // Exit if stopped

            const timeoutId = setTimeout(() => {
                if (this.isStopped) return; // Check again before playing

                const chordNotes = this.createChordNotes(chord.root, chord.type, octave);
                this.playChord(chordNotes, duration);
            }, currentTime);
            this.timeouts.push(timeoutId); // Track timeout
            currentTime += speed + (duration * 1000);
        });

        if (!this.isStopped) {
            const endTimeout = setTimeout(() => {
                if (!this.isStopped) this.stop();
                this.clearTimeouts();
            }, currentTime + (this.params.release * 1000) + 100);
            this.timeouts.push(endTimeout);
        }
    }

    // Play a single chord
    playChord(chordNotes, duration = 0.5) {
        if (this.isStopped) return;

        const frequencies = chordNotes.map(noteObj => this.getFrequency(noteObj.note, noteObj.octave));
        this.playNotesWithEnvelope(frequencies, duration, this.masterGain);

        if (!this.isStopped) {
            const totalDuration = this.params.attack + this.params.decay + duration + this.params.release;
            const timeoutId = setTimeout(() => {
                if (!this.isStopped) this.stop();
                this.timeout = null;
            }, totalDuration * 1000 + 100);
            this.timeouts.push(timeoutId);
        }
    }

    // Play a single tone
    playTone(note, octave, duration = 0.5) {
        if (this.isStopped) return;

        const frequency = this.getFrequency(note, octave);
        this.playNotesWithEnvelope([frequency], duration, this.masterGain);
    }
}