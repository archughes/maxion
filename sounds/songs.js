// sounds/songs.js
import { InstrumentGenerator } from './instruments.js';

export class SongGenerator extends InstrumentGenerator {
    constructor(audioCtx, masterGain, params = {}) {
        super(audioCtx, masterGain, params);
        this.tempo = params.tempo || 120;
        this.globalDynamics = params.globalDynamics || 'mf'; // mezzo-forte as default
        this.songs = {};
        this.progressions = this.collectProgressions();
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
            const response = await fetch(`./sounds/songs/${songName}.json`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const songData = await response.json();
            this.songs[songName] = songData;
            return songData;
        } catch (error) {
            console.error(`Error loading song ${songName}:`, error.message);
            return null; // Return null to indicate failure
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
    async playSong(songName, octave) {
        if (this.timeout) return;
        const song = this.songs[songName] || await this.loadSong(songName);
        if (!song) {
            console.error(`Song ${songName} could not be loaded.`);
            return;
        }

        const msPerBeat = 60000 / (song.tempo || this.tempo);
        let currentTime = 0;

        // Build the full sequence based on repeat pattern
        const fullSequence = [];
        const pattern = song.repeatPattern || 'v'; // Default to verse if no pattern
        const parts = pattern.split(' ');
        parts.forEach(part => {
            if (part === 'v' && song.verse) {
                fullSequence.push(...song.verse);
            } else if (part === 'c' && song.chorus) {
                fullSequence.push(...song.chorus);
            }
        });
        console.log('Full sequence:', fullSequence);

        fullSequence.forEach((event) => {
            const durationMs = event.duration * msPerBeat;
            setTimeout(() => {
                if (event.type === 'chord') {
                    const chordNotes = super.createChordNotes(event.root, event.chordType, octave);
                    const gainNode = super.playNotesWithEnvelope(
                        chordNotes.map(note => super.getFrequency(note.note, note.octave)),
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

        this.timeout = setTimeout(() => {
            super.stop();
            this.timeout = null;
        }, currentTime + 1000);
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