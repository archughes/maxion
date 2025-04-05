// soundTestCommon.js
export class SoundTestCommon {
    constructor(audioCtx, masterGain, analyser) {
        this.audioCtx = audioCtx;
        this.masterGain = masterGain;
        this.analyser = analyser;
        this.noteHistory = [];
        this.notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        this.visualizationFrame = null;
    }

    initAudio() {
        this.audioCtx = this.audioCtx || new (window.AudioContext || window.webkitAudioContext)();
        this.audioCtx.onstatechange = () => console.log('AudioContext state:', this.audioCtx.state);
        this.masterGain = this.audioCtx.createGain();
        this.masterGain.gain.value = 0.5;
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 2048;
        this.analyser.smoothingTimeConstant = 0.8;
        this.masterGain.connect(this.analyser);
        this.analyser.connect(this.audioCtx.destination);
    }

    // Recommendation 1: Generic control setup
    setupControls(controlConfig, buttonConfig) {
        this.controls = {};
        Object.entries(controlConfig).forEach(([key, config]) => {
            this.controls[key] = document.getElementById(config.id);
            if (config.type === 'range') {
                this.controls[`${key}Value`] = document.getElementById(`${config.id}Value`);
                this.controls[key].addEventListener('input', () => {
                    this.controls[`${key}Value`].textContent = this.controls[key].value;
                    if (config.onChange) config.onChange(this.controls[key].value);
                });
            } else if (config.type === 'select') {
                this.controls[key].addEventListener('change', () => {
                    if (config.onChange) config.onChange(this.controls[key].value);
                });
            }
        });
        Object.entries(buttonConfig).forEach(([key, config]) => {
            document.getElementById(config.id).addEventListener('click', config.onClick);
        });
    }

    // Recommendation 5: Standardize generator parameter updates
    updateGeneratorParams(generator, controlIds) {
        const params = {};
        controlIds.forEach(id => {
            const control = document.getElementById(id);
            params[id] = control.type === 'range' ? parseFloat(control.value) : control.value;
        });
        generator.updateParams(params);
    }

    // Recommendation 6: Reduce duplication in playback logic
    playSound(generator, updateParams, playMethod, ...args) {
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
        if (updateParams) generator.updateParams(updateParams);
        playMethod.call(generator, ...args);
        this.startVisualizations(generator);
    }

    addNoteToHistory(note, octave) {
        this.noteHistory.push({ note, octave, time: Date.now() });
        if (this.noteHistory.length > 20) this.noteHistory.shift();
        this.drawNoteBar();
    }

    getNoteIndex(note) {
        return this.notes.indexOf(note);
    }

    getNoteByIndex(index) {
        while (index >= this.notes.length) index -= this.notes.length;
        while (index < 0) index += this.notes.length;
        return this.notes[index];
    }

    setupVisualizations() {
        this.fftCanvas = document.getElementById('fftCanvas');
        this.waveformCanvas = document.getElementById('waveformCanvas');
        this.noteBarCanvas = document.getElementById('noteBar');

        if (!this.fftCanvas || !this.waveformCanvas || !this.noteBarCanvas) {
            console.error('Canvas elements not found');
            return;
        }

        this.fftCanvas.width = this.fftCanvas.offsetWidth;
        this.fftCanvas.height = this.fftCanvas.offsetHeight;
        this.waveformCanvas.width = this.waveformCanvas.offsetWidth;
        this.waveformCanvas.height = this.waveformCanvas.offsetHeight;
        this.noteBarCanvas.width = this.noteBarCanvas.offsetWidth;
        this.noteBarCanvas.height = this.noteBarCanvas.offsetHeight;

        this.drawNoteBar();

        window.addEventListener('resize', () => this.resizeCanvases());
    }

    resizeCanvases() {
        if (this.fftCanvas) {
            this.fftCanvas.width = this.fftCanvas.offsetWidth;
            this.fftCanvas.height = this.fftCanvas.offsetHeight;
        }
        if (this.waveformCanvas) {
            this.waveformCanvas.width = this.waveformCanvas.offsetWidth;
            this.waveformCanvas.height = this.waveformCanvas.offsetHeight;
        }
        if (this.noteBarCanvas) {
            this.noteBarCanvas.width = this.noteBarCanvas.offsetWidth;
            this.noteBarCanvas.height = this.noteBarCanvas.offsetHeight;
            this.drawNoteBar();
        }
    }

    startVisualizations(generator) {
        if (!this.fftCanvas || !this.waveformCanvas) return;
        if (this.visualizationFrame) return;

        const fftCtx = this.fftCanvas.getContext('2d');
        const waveformCtx = this.waveformCanvas.getContext('2d');
        const fftData = new Uint8Array(this.analyser.frequencyBinCount);
        const waveformData = new Uint8Array(this.analyser.fftSize);

        const draw = () => {
            const isActive = generator.activeNodes.size > 0;
            
            this.analyser.getByteFrequencyData(fftData);
            fftCtx.fillStyle = 'white';
            fftCtx.fillRect(0, 0, this.fftCanvas.width, this.fftCanvas.height);
            fftCtx.fillStyle = 'blue';
            const barWidth = (this.fftCanvas.width / fftData.length) * 2.5;
            let x = 0;
            for (let i = 0; i < fftData.length; i++) {
                const barHeight = (fftData[i] / 255) * this.fftCanvas.height;
                fftCtx.fillRect(x, this.fftCanvas.height - barHeight, barWidth, barHeight);
                x += barWidth + 1;
                if (x > this.fftCanvas.width) break;
            }

            this.analyser.getByteTimeDomainData(waveformData);
            waveformCtx.fillStyle = 'white';
            waveformCtx.fillRect(0, 0, this.waveformCanvas.width, this.waveformCanvas.height);
            waveformCtx.strokeStyle = 'red';
            waveformCtx.beginPath();
            const sliceWidth = this.waveformCanvas.width / waveformData.length;
            let wx = 0;
            for (let i = 0; i < waveformData.length; i++) {
                const v = waveformData[i] / 128.0;
                const y = (v * this.waveformCanvas.height) / 2;
                if (i === 0) waveformCtx.moveTo(wx, y);
                else waveformCtx.lineTo(wx, y);
                wx += sliceWidth;
            }
            waveformCtx.lineTo(this.waveformCanvas.width, this.waveformCanvas.height / 2);
            waveformCtx.stroke();

            if (isActive) {
                this.visualizationFrame = requestAnimationFrame(draw);
            } else {
                setTimeout(() => {
                    if (generator.activeNodes.size === 0) {
                        cancelAnimationFrame(this.visualizationFrame);
                        this.visualizationFrame = null;
                    } else {
                        this.visualizationFrame = requestAnimationFrame(draw);
                    }
                }, 100);
            }
        };

        this.visualizationFrame = requestAnimationFrame(draw);
    }

    drawNoteBar() {
        if (!this.noteBarCanvas) return;

        const ctx = this.noteBarCanvas.getContext('2d');
        const width = this.noteBarCanvas.width;
        const height = this.noteBarCanvas.height;

        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;

        for (let octave = 1; octave <= 7; octave++) {
            const y = height - (octave / 7) * height;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
            ctx.fillStyle = '#999';
            ctx.font = '10px Arial';
            ctx.fillText(`Octave ${octave}`, 5, y - 2);
        }

        for (let i = 0; i < this.notes.length; i++) {
            const x = (i / this.notes.length) * width;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
            ctx.fillStyle = '#999';
            ctx.font = '10px Arial';
            ctx.fillText(this.notes[i], x + 2, height - 2);
        }

        if (this.noteHistory.length === 0) return;

        const now = Date.now();
        const oldestTime = now - 10000;

        this.noteHistory.forEach(entry => {
            if (entry.time < oldestTime) return;

            const ageRatio = (now - entry.time) / 10000;
            const alpha = 1 - ageRatio;
            const y = height - (entry.octave / 7) * height;
            const noteIndex = this.getNoteIndex(entry.note);
            const x = ((noteIndex + 0.5) / this.notes.length) * width;

            ctx.fillStyle = `rgba(0, 128, 255, ${alpha})`;
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
            ctx.font = '10px Arial';
            ctx.fillText(`${entry.note}${entry.octave}`, x + 8, y + 4);
        });
    }
}

// controlManager.js
export class ControlManager {
    constructor(generator) {
        this.controls = {};
        this.generator = generator;
    }

    addControl(id, type, onChange) {
        const control = document.getElementById(id);
        this.controls[id] = control;
        if (type === 'range') {
            this.controls[`${id}Value`] = document.getElementById(`${id}Value`);
            control.addEventListener('input', () => {
                this.controls[`${id}Value`].textContent = control.value;
                onChange(control.value);
            });
        } else if (type === 'select') {
            control.addEventListener('change', () => onChange(control.value));
        }
        return control;
    }

    addButton(id, onClick) {
        document.getElementById(id).addEventListener('click', onClick);
    }
}