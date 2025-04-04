# 🎵 Song JSON Creation Guide
This guide shows how to write a song in a JSON file for the SongGenerator class.
Songs are stored in sounds/songs/ (e.g., my-song.json) and support tones, chords, and detailed instrument settings.

## 📦 Basic Structure
```json
{
  "tempo": <integer>,
  "repeatPattern": "<string>",
  "instruments": {
    "<instrument>": {
      "octave": <integer>,
      "waveform": "<string>",
      "attack": <float>,
      "decay": <float>,
      "sustain": <float>,
      "release": <float>,
      "vibratoAmount": <float>,
      "vibratoRate": <float>,
      "harmonics": [<float>, ...],
      "resonance": <float>,
      "brightness": <float>,
      "detune": <float>,
      "stereoWidth": <float>,
      "verse": [<event>, ...],
      "chorus": [<event>, ...],
      "bridge": [<event>, ...]
    }
  }
}
```

## 🎵 Top-Level Fields
- `tempo` (required): BPM (e.g., 120)
- `repeatPattern` (optional): "v c b" (verse, chorus, bridge). Default: "v"
- `instruments` (required): Object of instrument configs:
   - generic
   - piano
   - organ
   - guitar
   - brass
   - strings
   - theremin
   - flute

## 🎺 Instrument Fields
### General
- `octave`: 0-8, default: 4

### Sound
- `waveform`: "sine", "sawtooth", "square", "triangle" (default: "sine")
- `attack`: seconds, default: 0.05
- `decay`: seconds, default: 0.1
- `sustain`: 0-1, default: 0.7
- `release`: seconds, default: 0.2
- `vibratoAmount`: 0–2.0, default: 0
- `vibratoRate`: Hz, default: 5
- `harmonics`: array of floats, default: [1.0]

### Tone Shaping
- `resonance`: 0–1, default: 0
- `brightness`: 0–1, default: 0.5
- `detune`: -100 to 100, default: 0
- `stereoWidth`: 0–1, default: 0

Note: Although you can do other tone shapes and sound settings, these are already contained uniquely in each instrument, and as such is quite redundant to re-set, unless you have a very good reason to.

### Sequences
- `verse`: array of events (optional)
- `chorus`: array of events (optional)
- `bridge`: array of events (optional)

## 🎼 Events
### Tone
- `type`: "tone"
- `note`: "C", "C#", etc.
- `duration`: beats (e.g., 1)
- `dynamics` (optional): "pp", "p", "mp", "mf", "f", "ff" (default: "mf")

### Chord
- `type`: "chord"
- `root`: e.g., "G#"
- `chordType`: "major", "minor", "dim", "aug", "sus4", "sus2", "dom7", "maj7", "min7", "halfDim7", "dim7", "minMaj7", "augMaj7", "aug7", "maj9", "min9", "dom9", "min7b9", "dom7b9", "dom7sharp9", "maj11", "min11", "dom11", "min7b11", "maj13", "min13", "dom13", "dom7b13", "dom7b5", "dom7sharp5", "dom7b9b13", "power", "add9", "minAdd9", "six", "min6"
- `duration`: beats
- `dynamics` (optional): "pp", "p", "mp", "mf", "f", "ff" (default: "mf")
- `crescendo / decrescendo` (optional): true / false

🧪 Example: my-song.json
```json
{
  "tempo": 100,
  "repeatPattern": "v c",
  "instruments": {
    "piano": {
      "octave": 4,
      "waveform": "triangle",
      "harmonics": [1.0, 0.5],
      "brightness": 0.7,
      "verse": [
        {"type": "tone", "note": "C", "duration": 1, "dynamics": "mf"},
        {"type": "chord", "root": "G", "chordType": "major", "duration": 2}
      ],
      "chorus": [
        {"type": "chord", "root": "F", "chordType": "major", "duration": 1, "crescendo": true}
      ]
    }
  }
}
```

## 🚀 Usage
- Save as <song-name>.json in sounds/songs/
- Load/play in app (e.g., songsTest.js)
- Override settings like tempo or octave in the UI

## 💡 Tips
- Use multiple instruments for layering
- Adjust harmonics or vibrato for unique textures
- Ensure required fields (tempo, type) are present
- twinkle-twinkle.json is a good starting point for a full example that best extends these options.
- Timing:
Keep in mind all the durations should be aligned across all the instruments in each verse, chorus, and bridge.  So if the verse of the first piano has 16 1 second duration, but the timing stipulate the second piano should only have 4 notes, those notes durations must sum to 16 to keep all the instruments aligned.

Enjoy composing!