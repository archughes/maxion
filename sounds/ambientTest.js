// ambientTest.js
import { RainSoundManager } from './ambient.js';

document.addEventListener('DOMContentLoaded', () => {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioCtx.createAnalyser();
    const rainManager = new RainSoundManager(audioCtx, analyser);

    const fftCanvas = document.getElementById('fftCanvas');
    const waveformCanvas = document.getElementById('waveformCanvas');
    if (fftCanvas && waveformCanvas) {
        rainManager.setupVisualizations(fftCanvas, waveformCanvas);
    } else {
        console.error('Canvas elements not found');
    }

    const currentConfig = {
        windLevel: 0,
        windTurbidity: 1,
        rainDensity: 0,
        rainSpeed: 2,
        raindropSize: 2,
        thunderFreq: 0,
        thunderDistance: 3,
        surfaceType: 'water'
    };

    function updateConfigDisplay() {
        document.getElementById('currentWindLevel').textContent = currentConfig.windLevel;
        document.getElementById('currentWindTurbidity').textContent = currentConfig.windTurbidity;
        document.getElementById('currentRainDensity').textContent = currentConfig.rainDensity;
        document.getElementById('currentRainSpeed').textContent = currentConfig.rainSpeed;
        document.getElementById('currentRaindropSize').textContent = currentConfig.raindropSize;
        document.getElementById('currentThunderFreq').textContent = currentConfig.thunderFreq;
        document.getElementById('currentThunderDistance').textContent = currentConfig.thunderDistance;
        document.getElementById('currentSurfaceType').textContent = currentConfig.surfaceType;
    }

    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            button.classList.add('active');
            document.getElementById(button.getAttribute('data-tab')).classList.add('active');
        });
    });

    const toggleButton = document.getElementById('toggleButton');
    toggleButton.addEventListener('click', async () => {
        if (rainManager.isPlayingContinuous) {
            rainManager.stopContinuous();
            toggleButton.textContent = 'Start';
        } else {
            await rainManager.updateParams(currentConfig); // Apply initial config
            await rainManager.startContinuous();
            toggleButton.textContent = 'Stop';
        }
    });

    document.getElementById('saveButton').addEventListener('click', () => {
        console.log('WAV saving not implemented. Use a library like audiobuffer-to-wav.');
    });

    async function restartContinuous() {
        if (rainManager.isPlayingContinuous) {
            rainManager.stopContinuous();
            setTimeout(async () => {
                await rainManager.startContinuous();
            }, 500);
        }
    }

    // Tab 1: Slider controls
    document.getElementById('windLevel').addEventListener('input', async (e) => {
        currentConfig.windLevel = parseInt(e.target.value);
        await rainManager.updateParams({ windLevel: currentConfig.windLevel });
        await restartContinuous();
        updateConfigDisplay();
    });
    document.getElementById('windTurbidity').addEventListener('input', async (e) => {
        currentConfig.windTurbidity = parseInt(e.target.value);
        await rainManager.updateParams({ windTurbidity: currentConfig.windTurbidity });
        await restartContinuous();
        updateConfigDisplay();
    });
    document.getElementById('surfaceType').addEventListener('change', async (e) => {
        currentConfig.surfaceType = e.target.value;
        await rainManager.updateParams({ surfaceType: currentConfig.surfaceType });
        await restartContinuous();
        updateConfigDisplay();
    });
    document.getElementById('rainDensity').addEventListener('input', async (e) => {
        currentConfig.rainDensity = parseInt(e.target.value);
        await rainManager.updateParams({ rainDensity: currentConfig.rainDensity });
        await restartContinuous();
        updateConfigDisplay();
    });
    document.getElementById('rainSpeed').addEventListener('input', async (e) => {
        currentConfig.rainSpeed = parseInt(e.target.value);
        await rainManager.updateParams({ rainSpeed: currentConfig.rainSpeed });
        await restartContinuous();
        updateConfigDisplay();
    });
    document.getElementById('raindropSize').addEventListener('input', async (e) => {
        currentConfig.raindropSize = parseInt(e.target.value);
        await rainManager.updateParams({ raindropSize: currentConfig.raindropSize });
        await restartContinuous();
        updateConfigDisplay();
    });
    document.getElementById('thunderFreq').addEventListener('input', async (e) => {
        currentConfig.thunderFreq = parseInt(e.target.value);
        await rainManager.updateParams({ thunderFreq: currentConfig.thunderFreq });
        await restartContinuous();
        updateConfigDisplay();
    });
    document.getElementById('thunderDistance').addEventListener('input', async (e) => {
        currentConfig.thunderDistance = parseInt(e.target.value);
        await rainManager.updateParams({ thunderDistance: currentConfig.thunderDistance });
        await restartContinuous();
        updateConfigDisplay();
    });

    // Tab 2: Manual scheduling buttons
    const valueButtons = document.querySelectorAll('.value-button');
    valueButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const param = button.getAttribute('data-param');
            const value = parseInt(button.getAttribute('data-value'));
            currentConfig[param] = value;
            updateConfigDisplay();
            console.log(`Scheduling sound with ${param} = ${value}`);

            await rainManager.updateParams(currentConfig);

            const soundId = `${param}-${value}-${Date.now()}`;
            rainManager.activeManualSounds.add(soundId);
            rainManager.startVisualizations();

            if (param === 'windLevel' || param === 'windTurbidity') {
                await rainManager.playWindManual();
                setTimeout(() => {
                    rainManager.activeManualSounds.delete(soundId);
                    rainManager.checkVisualizationState();
                }, 2000);
            } else if (param === 'rainDensity' || param === 'rainSpeed' || param === 'raindropSize') {
                await rainManager.playRainManual();
                setTimeout(() => {
                    rainManager.activeManualSounds.delete(soundId);
                    rainManager.checkVisualizationState();
                }, 2000);
            } else if (param === 'thunderFreq' || param === 'thunderDistance') {
                await rainManager.playThunderManual();
                setTimeout(() => {
                    rainManager.activeManualSounds.delete(soundId);
                    rainManager.checkVisualizationState();
                }, 6000);
            }
        });
    });

    document.getElementById('manualSurfaceType').addEventListener('change', async (e) => {
        currentConfig.surfaceType = e.target.value;
        updateConfigDisplay();
        console.log(`Surface type set to ${currentConfig.surfaceType}`);
        await rainManager.updateParams({ surfaceType: currentConfig.surfaceType });
    });

    updateConfigDisplay();
});