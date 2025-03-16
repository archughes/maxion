// ambientTest.js
import { AmbientSoundManager } from './ambient.js';

document.addEventListener('DOMContentLoaded', () => {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioCtx.createAnalyser();
    const ambientManager = new AmbientSoundManager(audioCtx, analyser);

    const fftCanvas = document.getElementById('fftCanvas');
    const waveformCanvas = document.getElementById('waveformCanvas');
    if (fftCanvas && waveformCanvas) {
        ambientManager.setupVisualizations(fftCanvas, waveformCanvas);
    } else {
        console.error('Canvas elements not found');
    }

    const currentConfig = {
        windLevel: 0,
        windTurbidity: 0,
        surfaceType: 'grass',
        rainDensity: 0,
        rainSpeed: 1,
        raindropSize: 1,
        thunderFreq: 0,
        thunderDistance: 0,
        waveIntensity: 0,
        waveFrequency: 1,
        fireIntensity: 0,
        fireCrackleRate: 1,
        birdActivity: 0,
        birdPitch: 1,
        birdType: 'Robin',
        cricketDensity: 0,
        cricketSpeed: 1,
        riverFlow: 0,
        riverDepth: 1,
        iceIntensity: 0,
        iceFractureRate: 1,
        rumbleIntensity: 0,
        ventActivity: 1
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
        document.getElementById('currentWaveIntensity').textContent = currentConfig.waveIntensity;
        document.getElementById('currentWaveFrequency').textContent = currentConfig.waveFrequency;
        document.getElementById('currentFireIntensity').textContent = currentConfig.fireIntensity;
        document.getElementById('currentFireCrackleRate').textContent = currentConfig.fireCrackleRate;
        document.getElementById('currentBirdActivity').textContent = currentConfig.birdActivity;
        document.getElementById('currentBirdPitch').textContent = currentConfig.birdPitch;
        document.getElementById('currentBirdType').textContent = currentConfig.birdType;
        document.getElementById('currentCricketDensity').textContent = currentConfig.cricketDensity;
        document.getElementById('currentCricketSpeed').textContent = currentConfig.cricketSpeed;
        document.getElementById('currentRiverFlow').textContent = currentConfig.riverFlow;
        document.getElementById('currentRiverDepth').textContent = currentConfig.riverDepth;
        document.getElementById('currentIceIntensity').textContent = currentConfig.iceIntensity;
        document.getElementById('currentIceFractureRate').textContent = currentConfig.iceFractureRate;
        document.getElementById('currentRumbleIntensity').textContent = currentConfig.rumbleIntensity;
        document.getElementById('currentVentActivity').textContent = currentConfig.ventActivity;
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
        if (ambientManager.isPlayingContinuous) {
            ambientManager.stopContinuous();
            toggleButton.textContent = 'Start';
        } else {
            await ambientManager.updateParams(currentConfig); // Apply initial config
            await ambientManager.startContinuous();
            toggleButton.textContent = 'Stop';
        }
    });

    document.getElementById('saveButton').addEventListener('click', () => {
        console.log('WAV saving not implemented. Use a library like audiobuffer-to-wav.');
    });

    async function restartContinuous() {
        if (ambientManager.isPlayingContinuous) {
            ambientManager.stopContinuous();
            setTimeout(async () => {
                await ambientManager.startContinuous();
            }, 500);
        }
    }

    // Tab 1: Slider controls
    document.getElementById('windLevel').addEventListener('input', async (e) => {
        currentConfig.windLevel = parseInt(e.target.value);
        await ambientManager.updateParams({ windLevel: currentConfig.windLevel });
        await restartContinuous();
        updateConfigDisplay();
    });
    document.getElementById('windTurbidity').addEventListener('input', async (e) => {
        currentConfig.windTurbidity = parseInt(e.target.value);
        await ambientManager.updateParams({ windTurbidity: currentConfig.windTurbidity });
        await restartContinuous();
        updateConfigDisplay();
    });
    document.getElementById('surfaceType').addEventListener('change', async (e) => {
        currentConfig.surfaceType = e.target.value;
        await ambientManager.updateParams({ surfaceType: currentConfig.surfaceType });
        await restartContinuous();
        updateConfigDisplay();
    });
    document.getElementById('rainDensity').addEventListener('input', async (e) => {
        currentConfig.rainDensity = parseInt(e.target.value);
        await ambientManager.updateParams({ rainDensity: currentConfig.rainDensity });
        await restartContinuous();
        updateConfigDisplay();
    });
    document.getElementById('rainSpeed').addEventListener('input', async (e) => {
        currentConfig.rainSpeed = parseInt(e.target.value);
        await ambientManager.updateParams({ rainSpeed: currentConfig.rainSpeed });
        await restartContinuous();
        updateConfigDisplay();
    });
    document.getElementById('raindropSize').addEventListener('input', async (e) => {
        currentConfig.raindropSize = parseInt(e.target.value);
        await ambientManager.updateParams({ raindropSize: currentConfig.raindropSize });
        await restartContinuous();
        updateConfigDisplay();
    });
    document.getElementById('thunderFreq').addEventListener('input', async (e) => {
        currentConfig.thunderFreq = parseInt(e.target.value);
        await ambientManager.updateParams({ thunderFreq: currentConfig.thunderFreq });
        await restartContinuous();
        updateConfigDisplay();
    });
    document.getElementById('thunderDistance').addEventListener('input', async (e) => {
        currentConfig.thunderDistance = parseInt(e.target.value);
        await ambientManager.updateParams({ thunderDistance: currentConfig.thunderDistance });
        await restartContinuous();
        updateConfigDisplay();
    });
    document.getElementById('waveIntensity').addEventListener('input', async (e) => {
        currentConfig.waveIntensity = parseInt(e.target.value);
        await ambientManager.updateParams({ waveIntensity: currentConfig.waveIntensity });
        await restartContinuous();
        updateConfigDisplay();
    });
    document.getElementById('waveFrequency').addEventListener('input', async (e) => {
        currentConfig.waveFrequency = parseInt(e.target.value);
        await ambientManager.updateParams({ waveFrequency: currentConfig.waveFrequency });
        await restartContinuous();
        updateConfigDisplay();
    });
    document.getElementById('fireIntensity').addEventListener('input', async (e) => {
        currentConfig.fireIntensity = parseInt(e.target.value);
        await ambientManager.updateParams({ fireIntensity: currentConfig.fireIntensity });
        await restartContinuous();
        updateConfigDisplay();
    });
    document.getElementById('fireCrackleRate').addEventListener('input', async (e) => {
        currentConfig.fireCrackleRate = parseInt(e.target.value);
        await ambientManager.updateParams({ fireCrackleRate: currentConfig.fireCrackleRate });
        await restartContinuous();
        updateConfigDisplay();
    });
    document.getElementById('birdActivity').addEventListener('input', async (e) => {
        currentConfig.birdActivity = parseInt(e.target.value);
        await ambientManager.updateParams({ birdActivity: currentConfig.birdActivity });
        await restartContinuous();
        updateConfigDisplay();
    });
    document.getElementById('birdPitch').addEventListener('input', async (e) => {
        currentConfig.birdPitch = parseInt(e.target.value);
        await ambientManager.updateParams({ birdPitch: currentConfig.birdPitch });
        await restartContinuous();
        updateConfigDisplay();
    });
    document.getElementById('birdType').addEventListener('input', async (e) => {
        currentConfig.birdType = parseInt(e.target.value);
        await ambientManager.updateParams({ birdType: currentConfig.birdType });
        await restartContinuous();
        updateConfigDisplay();
    });
    document.getElementById('cricketDensity').addEventListener('input', async (e) => {
        currentConfig.cricketDensity = parseInt(e.target.value);
        await ambientManager.updateParams({ cricketDensity: currentConfig.cricketDensity });
        await restartContinuous();
        updateConfigDisplay();
    });
    document.getElementById('cricketSpeed').addEventListener('input', async (e) => {
        currentConfig.cricketSpeed = parseInt(e.target.value);
        await ambientManager.updateParams({ cricketSpeed: currentConfig.cricketSpeed });
        await restartContinuous();
        updateConfigDisplay();
    });
    document.getElementById('riverFlow').addEventListener('input', async (e) => {
        currentConfig.riverFlow = parseInt(e.target.value);
        await ambientManager.updateParams({ riverFlow: currentConfig.riverFlow });
        await restartContinuous();
        updateConfigDisplay();
    });
    document.getElementById('riverDepth').addEventListener('input', async (e) => {
        currentConfig.riverDepth = parseInt(e.target.value);
        await ambientManager.updateParams({ riverDepth: currentConfig.riverDepth });
        await restartContinuous();
        updateConfigDisplay();
    });
    document.getElementById('iceIntensity').addEventListener('input', async (e) => {
        currentConfig.iceIntensity = parseInt(e.target.value);
        await ambientManager.updateParams({ iceIntensity: currentConfig.iceIntensity });
        await restartContinuous();
        updateConfigDisplay();
    });
    document.getElementById('iceFractureRate').addEventListener('input', async (e) => {
        currentConfig.iceFractureRate = parseInt(e.target.value);
        await ambientManager.updateParams({ iceFractureRate: currentConfig.iceFractureRate });
        await restartContinuous();
        updateConfigDisplay();
    });
    document.getElementById('rumbleIntensity').addEventListener('input', async (e) => {
        currentConfig.rumbleIntensity = parseInt(e.target.value);
        await ambientManager.updateParams({ rumbleIntensity: currentConfig.rumbleIntensity });
        await restartContinuous();
        updateConfigDisplay();
    });
    document.getElementById('ventActivity').addEventListener('input', async (e) => {
        currentConfig.ventActivity = parseInt(e.target.value);
        await ambientManager.updateParams({ ventActivity: currentConfig.ventActivity });
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

            await ambientManager.updateParams(currentConfig);

            const soundId = `${param}-${value}-${Date.now()}`;
            ambientManager.activeManualSounds.add(soundId);
            ambientManager.startVisualizations();

            if (param === 'windLevel' || param === 'windTurbidity') {
                await ambientManager.playWindManual();
                setTimeout(() => {
                    ambientManager.activeManualSounds.delete(soundId);
                    ambientManager.checkVisualizationState();
                }, 2000);
            } else if (param === 'rainDensity' || param === 'rainSpeed' || param === 'raindropSize') {
                await ambientManager.playRainManual();
                setTimeout(() => {
                    ambientManager.activeManualSounds.delete(soundId);
                    ambientManager.checkVisualizationState();
                }, 2000);
            } else if (param === 'thunderFreq' || param === 'thunderDistance') {
                await ambientManager.playThunderManual();
                setTimeout(() => {
                    ambientManager.activeManualSounds.delete(soundId);
                    ambientManager.checkVisualizationState();
                }, 6000);
            } else if (param === 'waveIntensity' || param === 'waveFrequency') {
                await ambientManager.playOceanWavesManual();
                setTimeout(() => {
                    ambientManager.activeManualSounds.delete(soundId);
                    ambientManager.checkVisualizationState();
                }, 5000);
            } else if (param === 'fireIntensity' || param === 'fireCrackleRate') {
                await ambientManager.playFireManual();
                setTimeout(() => {
                    ambientManager.activeManualSounds.delete(soundId);
                    ambientManager.checkVisualizationState();
                }, 3500);
            } else if (param === 'birdActivity' || param === 'birdPitch') {
                await ambientManager.playBirdManual();
                setTimeout(() => {
                    ambientManager.activeManualSounds.delete(soundId);
                    ambientManager.checkVisualizationState();
                }, 3000);
            } else if (param === 'cricketDensity' || param === 'cricketSpeed') {
                await ambientManager.playCricketsManual();
                setTimeout(() => {
                    ambientManager.activeManualSounds.delete(soundId);
                    ambientManager.checkVisualizationState();
                }, 3000);
            } else if (param === 'riverFlow' || param === 'riverDepth') {
                await ambientManager.playRiverManual();
                setTimeout(() => {
                    ambientManager.activeManualSounds.delete(soundId);
                    ambientManager.checkVisualizationState();
                }, 5000);
            } else if (param === 'iceIntensity' || param === 'iceFractureRate') {
                await ambientManager.playIceCrackingManual();
                setTimeout(() => {
                    ambientManager.activeManualSounds.delete(soundId);
                    ambientManager.checkVisualizationState();
                }, 4000);
            } else if (param === 'rumbleIntensity' || param === 'ventActivity') {
                await ambientManager.playVolcanicRumbleManual();
                setTimeout(() => {
                    ambientManager.activeManualSounds.delete(soundId);
                    ambientManager.checkVisualizationState();
                }, 5000);
            }
        });
    });

    document.getElementById('manualSurfaceType').addEventListener('change', async (e) => {
        currentConfig.surfaceType = e.target.value;
        updateConfigDisplay();
        console.log(`Surface type set to ${currentConfig.surfaceType}`);
        await ambientManager.updateParams({ surfaceType: currentConfig.surfaceType });
    });

    document.getElementById('manualBirdType').addEventListener('change', async (e) => {
        currentConfig.birdType = e.target.value;
        updateConfigDisplay();
        console.log(`Bird type set to ${currentConfig.birdType}`);
        await ambientManager.updateParams({ birdType: currentConfig.birdType });
    });

    updateConfigDisplay();
});