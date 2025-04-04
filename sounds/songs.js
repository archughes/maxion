// sounds/songs.js
import { InstrumentGenerator } from './instruments.js';

export class SongGenerator extends InstrumentGenerator {
    constructor(audioCtx, masterGain, params = {}) {
        super(audioCtx, masterGain, params);
        this.tempo = params.tempo || 120;
        this.globalDynamics = params.globalDynamics || 'mf';
        this.songs = {};
        this.progressions = this.collectProgressions();
        this.instrumentInstances = {};
        this.userOverrides = {
            tempo: false,
            instrument: false,
            octave: false,
            scale: false,
            root: false
        };
    }

    // Collect progressions from original instruments.js presets
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

    // Load song from JSON file with improved error handling
    async loadSong(songName) {
        try {
            const songFile = `./sounds/songs/${songName}.json`;
            console.log('Loading song:', songFile);
            const response = await fetch(songFile);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const songData = await response.json();

            if (!songData || !songData.instruments || typeof songData.instruments !== 'object') {
                if (songData) console.log(songData);
                throw new Error('Invalid song data format: missing or invalid instruments');
            }

            this.songs[songName] = songData;
            
            // Initialize instrument instances
            for (const [instrument, config] of Object.entries(songData.instruments)) {
                this.instrumentInstances[instrument] = new InstrumentGenerator(
                    this.audioCtx,
                    this.masterGain,
                    { instrumentType: instrument }
                );
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

    setOverride(control, value) {
        this.userOverrides[control] = true;
        switch(control) {
            case 'tempo': this.tempo = value; break;
            case 'instrument': 
                for (const inst of Object.values(this.instrumentInstances)) {
                    inst.instrumentType = value;
                }
                break;
            case 'octave': this.params.octave = value; break;
        }
    }

    // Apply dynamics to gain
    applyDynamics(dynamics, gainNode, time) {
        const dynamicLevels = {
            'pp': 0.2,  // pianissimo
            'p': 0.4,   // piano
            'mp': 0.6,  // mezzo-piano
            'mf': 0.8,  // mezzo-forte
            'f': 1.0,   // forte
            'ff': 1.2   // fortissimo
        };
        const level = dynamicLevels[dynamics] || dynamicLevels['mf'];
        gainNode.gain.setValueAtTime(level, time);
    }

    // Play song with dynamics and tempo, now with octave parameter
    async playSong(songName) {
        if (this.timeout) return;
        const song = this.songs[songName] || await this.loadSong(songName);
        if (!song) {
            console.error(`Song ${songName} could not be loaded.`);
            return;
        }

        const msPerBeat = 60000 / (this.userOverrides.tempo ? this.tempo : song.tempo || this.tempo);
        let maxTime = 0;

        // Build sequences for each instrument
        for (const [instrument, config] of Object.entries(song.instruments)) {
            const fullSequence = [];
            const pattern = song.repeatPattern || 'v';
            const parts = pattern.split(' ');
            parts.forEach(part => {
                if (part === 'v' && config.verse) {
                    fullSequence.push(...config.verse);
                } else if (part === 'c' && config.chorus) {
                    fullSequence.push(...config.chorus);
                }
            });

            let currentTime = 0;
            const instrumentGen = this.instrumentInstances[instrument];
            
            fullSequence.forEach((event) => {
                const durationMs = event.duration * msPerBeat;
                setTimeout(() => {
                    if (event.type === 'chord') {
                        const octave = this.userOverrides.octave ? this.params.octave : config.octave || 4;
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
                    }
                }, currentTime);
                currentTime += durationMs;
            });

            maxTime = Math.max(maxTime, currentTime);
        }

        this.timeout = setTimeout(() => {
            super.stop();
            this.timeout = null;
        }, maxTime + 1000);
    }

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

    // Updated playProgression to use octave parameter
    playProgression(progression, octave, speed = 250, duration = 0.5) {
        console.log('Starting progression, timeout:', this.timeout);
        if (this.timeout) {
            clearTimeout(this.timeout); // Force clear any stale timeout
            this.timeout = null;
        }
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume().then(() => console.log('Resumed')).catch(err => console.error('Resume error:', err));
        }

        let currentTime = 0;
        progression.forEach(chord => {
            setTimeout(() => {
                const chordNotes = this.createChordNotes(chord.root, chord.type, octave);
                this.playChord(chordNotes, duration);
            }, currentTime);
            currentTime += speed + (duration * 1000);
        });

        this.timeout = setTimeout(() => {
            this.timeout = null;
        }, currentTime + (this.params.release * 1000) + 100);
    }
}