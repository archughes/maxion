import { InstrumentGenerator } from './instruments.js';


export class SongGenerator extends InstrumentGenerator {
    constructor(audioCtx, masterGain, params = {}) {
        super(audioCtx, masterGain, { tempo: 120, globalDynamics: 'mf', ...params });
        this.songs = {};
        this.progressions = this.collectProgressions();
        this.instrumentInstances = {};
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
        
    }

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
            this.instrumentInstances = {}; // Reset instrument instances
    
            let isFirstInstrument = true;
            for (const [instrument, config] of Object.entries(songData.instruments)) {
                const instrumentGen = new InstrumentGenerator(this.audioCtx, this.masterGain, {
                    instrumentType: instrument, ...config
                });
                this.instrumentInstances[instrument] = instrumentGen;
    
                // Assign the first instrument's properties to `this`
                if (isFirstInstrument) {
                    Object.assign(this, instrumentGen); // Copy all properties, including activeNodes
                    this.params = { ...this.params, instrumentType: instrument }; // Ensure params reflect the first instrument
                    isFirstInstrument = false;
                }
            }
    
            return songData;
        } catch (error) {
            console.error(`Error loading song ${songName}:`, error.message);
            return null;
        }
    }

    getSongConfig(songName) {
        const song = this.songs[songName];
        if (!song) return null;
        return {
            tempo: song.tempo,
            instruments: Object.keys(song.instruments),
            configs: song.instruments
        };
    }

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

    applyDynamics(gainNode, dynamics, time) {
        const levels = { 'pp': 0.2, 'p': 0.4, 'mp': 0.6, 'mf': 0.8, 'f': 1.0, 'ff': 1.2 };
        gainNode.gain.setValueAtTime(levels[dynamics] || levels['mf'], time);
    }

    async playSong(songName) {
        this.stop();
        const song = this.songs[songName] || await this.loadSong(songName);
        if (!song) return;

        const msPerBeat = 60000 / (this.userOverrides.tempo ? this.tempo : song.tempo || this.tempo);
        let maxTime = 0;

        for (const [instrument, config] of Object.entries(song.instruments)) {
            const gen = this.instrumentInstances[instrument];
            const sequence = this.buildSequence(config, song.repeatPattern || 'v');
            let currentTime = 0;

            // Apply overrides if not set in config
            if (!config.waveform && this.userOverrides.waveform) instrumentGen.updateParams({ waveform: this.params.waveform });
            if (!config.vibratoAmount && this.userOverrides.vibratoAmount) instrumentGen.updateParams({ vibratoAmount: this.params.vibratoAmount });
            if (!config.vibratoRate && this.userOverrides.vibratoRate) instrumentGen.updateParams({ vibratoRate: this.params.vibratoRate });
            if (!config.harmonics && this.userOverrides.harmonics) instrumentGen.updateParams({ harmonics: this.params.harmonics });
            if (!config.resonance && this.userOverrides.resonance) instrumentGen.updateParams({ resonance: this.params.resonance });
            if (!config.brightness && this.userOverrides.brightness) instrumentGen.updateParams({ brightness: this.params.brightness });
            if (!config.detune && this.userOverrides.detune) instrumentGen.updateParams({ detune: this.params.detune });
            if (!config.stereoWidth && this.userOverrides.stereoWidth) instrumentGen.updateParams({ stereoWidth: this.params.stereoWidth });


            sequence.forEach(event => {
                const durationMs = event.duration * msPerBeat;
                this.scheduleSound(() => {
                    const octave = this.userOverrides.octave ? this.params.octave : config.octave || 4;
                    if (event.type === 'chord') {
                        const notes = gen.createChordNotes(event.root, event.chordType, octave);
                        const gain = gen.playNotes(notes.map(n => gen.getFrequency(n.note, n.octave)), durationMs / 1000 * 0.95);
                        this.applyDynamics(gain, event.dynamics || this.globalDynamics, this.audioCtx.currentTime);
                        if (event.crescendo || event.decrescendo) {
                            gain.gain.linearRampToValueAtTime(event.crescendo ? 1.2 : 0.2, this.audioCtx.currentTime + durationMs / 1000);
                        }
                    } else if (event.type === 'tone') {
                        const gain = gen.playNotes([gen.getFrequency(event.note, octave)], durationMs / 1000 * 0.95);
                        this.applyDynamics(gain, event.dynamics || this.globalDynamics, this.audioCtx.currentTime);
                    }
                }, currentTime);
                currentTime += durationMs;
            });
            maxTime = Math.max(maxTime, currentTime);
        }

        this.scheduleSound(() => this.stop(), maxTime + 1000);
    }

    buildSequence(config, pattern) {
        const sequence = [];
        pattern.split(' ').forEach(part => {
            if (part === 'v' && config.verse) sequence.push(...config.verse);
            else if (part === 'c' && config.chorus) sequence.push(...config.chorus);
            else if (part === 'b' && config.bridge) sequence.push(...config.bridge);
        });
        return sequence;
    }

    getProgression(progressionStr, root = 'C', scaleType = 'major') {
        const scale = this.scales[scaleType] || this.scales.major;
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
    
    playProgression(progression, octave, speed = 250, duration = 0.5) {
        this.stop();
        let currentTime = 0;
        progression.forEach(chord => {
            this.scheduleSound(() => {
                const notes = this.createChordNotes(chord.root, chord.type, octave);
                this.playNotes(notes.map(n => this.getFrequency(n.note, n.octave)), duration);
            }, currentTime);
            currentTime += speed + (duration * 1000);
        });
        this.scheduleSound(() => this.stop(), currentTime + (this.params.release * 1000) + 100);
    }
}