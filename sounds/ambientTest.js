import { AmbientSoundManager } from './ambient.js';
import { SoundTestCommon } from './soundTestCommon.js'; // Import the base class

document.addEventListener('DOMContentLoaded', () => {
    // --- Basic Audio Setup using SoundTestCommon ---
    const soundTestCommon = new SoundTestCommon();
    soundTestCommon.initAudio(); // Initializes audioCtx, masterGain, analyser
    const audioCtx = soundTestCommon.audioCtx;
    const analyser = soundTestCommon.analyser;

    // --- Ambient Manager Setup ---
    const ambientManager = new AmbientSoundManager(audioCtx, analyser);

    // --- Sound Module Definitions (centralized configuration) ---
    // Duplicated from original ambientTest.js for self-containment,
    // assuming ambient.js doesn't expose this structure directly.
    // Ideally, this could be derived from ambientManager.sounds if they exposed default params/types.
     const soundModules = [
        { name: 'Wind', key: 'wind', playMethod: 'playWindManual', params: [
            { id: 'windLevel', label: 'Level', min: 0, max: 4, step: 1, default: 0 },
            { id: 'windTurbidity', label: 'Turbidity', min: 0, max: 4, step: 1, default: 0 }
        ], selects: [] },
        { name: 'Rain', key: 'rain', playMethod: 'playRainManual', params: [
            { id: 'rainDensity', label: 'Density', min: 0, max: 4, step: 1, default: 0 },
            { id: 'rainSpeed', label: 'Speed', min: 0, max: 4, step: 1, default: 1 },
            { id: 'raindropSize', label: 'Drop Size', min: 0, max: 4, step: 1, default: 1 }
        ], selects: [
            { id: 'surfaceType', label: 'Surface', default: 'water', options: [
                { value: 'metal', label: 'Metal' }, { value: 'grass', label: 'Grass' },
                { value: 'water', label: 'Water' }, { value: 'wood', label: 'Wood' },
                { value: 'concrete', label: 'Concrete' }, { value: 'glass', label: 'Glass' }
            ]}
        ]},
        { name: 'Thunder', key: 'thunder', playMethod: 'playThunderManual', params: [
            { id: 'thunderFreq', label: 'Frequency', min: 0, max: 4, step: 1, default: 0 },
            { id: 'thunderDistance', label: 'Distance', min: 0, max: 4, step: 1, default: 0 }
        ], selects: [] },
        { name: 'Ocean', key: 'oceanWaves', playMethod: 'playOceanWavesManual', params: [
            { id: 'waveIntensity', label: 'Intensity', min: 0, max: 4, step: 1, default: 0 },
            { id: 'waveFrequency', label: 'Frequency', min: 0, max: 4, step: 1, default: 1 }
        ], selects: [] },
        { name: 'Fire', key: 'fire', playMethod: 'playFireManual', params: [
            { id: 'fireIntensity', label: 'Intensity', min: 0, max: 4, step: 1, default: 0 },
            { id: 'fireCrackleRate', label: 'Crackle Rate', min: 0, max: 4, step: 1, default: 1 }
        ], selects: [] },
        { name: 'Birds', key: 'bird', playMethod: 'playBirdManual', params: [
            { id: 'birdActivity', label: 'Activity', min: 0, max: 4, step: 1, default: 0 },
            { id: 'birdPitch', label: 'Pitch', min: 0, max: 4, step: 1, default: 1 }
        ], selects: [
            { id: 'birdType', label: 'Type', default: 'robin', options: [
                { value: 'robin', label: 'Robin' }, { value: 'warbler', label: 'Warbler' },
                { value: 'thrush', label: 'Thrush' }, { value: 'owl', label: 'Owl' },
                { value: 'cardinal', label: 'Cardinal' }
            ]}
        ]},
        { name: 'Crickets', key: 'crickets', playMethod: 'playCricketsManual', params: [
            { id: 'cricketDensity', label: 'Density', min: 0, max: 4, step: 1, default: 0 },
            { id: 'cricketSpeed', label: 'Speed', min: 0, max: 4, step: 1, default: 1 }
        ], selects: [] },
        { name: 'River', key: 'river', playMethod: 'playRiverManual', params: [
            { id: 'riverFlow', label: 'Flow', min: 0, max: 4, step: 1, default: 0 },
            { id: 'riverDepth', label: 'Depth', min: 0, max: 4, step: 1, default: 1 },
            { id: 'riverSpeed', label: 'Speed', min: 0, max: 4, step: 1, default: 1 }
        ], selects: [] },
        { name: 'Ice', key: 'iceCracking', playMethod: 'playIceCrackingManual', params: [
            { id: 'iceIntensity', label: 'Intensity', min: 0, max: 4, step: 1, default: 0 },
            { id: 'iceFractureRate', label: 'Fracture Rate', min: 0, max: 4, step: 1, default: 1 }
        ], selects: [] },
        { name: 'Volcanic', key: 'volcanicRumble', playMethod: 'playVolcanicRumbleManual', params: [
            { id: 'rumbleIntensity', label: 'Rumble Intensity', min: 0, max: 4, step: 1, default: 0 },
            { id: 'ventActivity', label: 'Vent Activity', min: 0, max: 4, step: 1, default: 1 }
        ], selects: [] },
        { name: 'Achievement', key: 'achievement', playMethod: 'playAchievementManual', params: [
            { id: 'achievementImportance', label: 'Importance', min: 0, max: 4, step: 1, default: 2 },
        ], selects: [
            { id: 'achievementType', label: 'Type', default: 'levelUp', options: [
                { value: 'levelUp', label: 'Level Up' }, { value: 'minorQuest', label: 'Minor Quest' }, { value: 'majorQuest', label: 'Major Quest' }
            ]},
            { id: 'achievementStyle', label: 'Style', default: 'fantasy', options: [
                { value: 'fantasy', label: 'Fantasy' }, { value: 'sci-fi', label: 'Sci-Fi' }, { value: 'minimal', label: 'Minimal' }
            ]}
        ]},
        { name: 'Berry Pick', key: 'berry', playMethod: 'playBerryManual', params: [
             { id: 'berryRipeness', label: 'Ripeness', min: 0, max: 4, step: 1, default: 2 },
             { id: 'berryQuantity', label: 'Quantity', min: 0, max: 4, step: 1, default: 2 }
        ], selects: [
             { id: 'berryType', label: 'Source', default: 'bush', options: [
                 { value: 'bush', label: 'Bush' }, { value: 'tree', label: 'Tree' }, { value: 'vine', label: 'Vine' },
                 { value: 'cactus', label: 'Cactus' }, { value: 'shrub', label: 'Shrub' }
             ]}
        ]},
        { name: 'Bow', key: 'bow', playMethod: 'playBowManual', params: [
             { id: 'drawStrength', label: 'Draw Strength', min: 0, max: 4, step: 1, default: 2 }
        ], selects: [
             { id: 'bowType', label: 'Bow Type', default: 'standard', options: [
                 { value: 'standard', label: 'Standard' }, { value: 'longbow', label: 'Longbow' },
                 { value: 'shortbow', label: 'Shortbow' }, { value: 'crossbow', label: 'Crossbow' }
             ]},
             { id: 'arrowType', label: 'Arrow Type', default: 'wooden', options: [
                 { value: 'wooden', label: 'Wooden' }, { value: 'metal', label: 'Metal' },
                 { value: 'flaming', label: 'Flaming' }, { value: 'magical', label: 'Magical' }
             ]}
        ]},
        { name: 'Chest', key: 'chest', playMethod: 'playChestManual', params: [
             { id: 'chestSize', label: 'Size', min: 0, max: 4, step: 1, default: 2 },
             { id: 'chestMaterialType', label: 'Material', min: 0, max: 4, step: 1, default: 2 }, // Assuming 0-4 maps to wood, iron, steel etc.
             { id: 'chestCondition', label: 'Condition', min: 0, max: 4, step: 1, default: 2 }, // Pristine to Rusted
             { id: 'chestTreasureValue', label: 'Value', min: 0, max: 4, step: 1, default: 2 } // Empty to Legendary
        ], selects: [] },
        { name: 'Footsteps', key: 'footsteps', playMethod: 'playFootstepsManual', params: [
             { id: 'footstepsIntensity', label: 'Intensity', min: 0, max: 4, step: 1, default: 2 }, // Sneak to Stomp
             { id: 'footstepsWetness', label: 'Wetness', min: 0, max: 4, step: 1, default: 0 } // Dry to Soaked
        ], selects: [
             { id: 'footstepsEnvironment', label: 'Surface', default: 'stone', options: [
                 { value: 'stone', label: 'Stone' }, { value: 'water', label: 'Water' },
                 { value: 'mud', label: 'Mud' }, { value: 'sand', label: 'Sand' },
                 { value: 'metal', label: 'Metal' }, { value: 'grass', label: 'Grass' },
                 { value: 'wood', label: 'Wood' }
             ]}
        ]},
        { name: 'Human Idle', key: 'humanIdle', playMethod: 'playHumanIdleManual', params: [
             { id: 'humanIdleIntensity', label: 'Intensity', min: 0, max: 4, step: 1, default: 2 }, // Quiet to Loud
             { id: 'humanIdleVoiceType', label: 'Voice Type', min: 0, max: 4, step: 1, default: 2 } // Low pitch to High pitch
        ], selects: [
             { id: 'humanIdleSoundType', label: 'Sound Type', default: 'breathing', options: [
                 { value: 'breathing', label: 'Breathing' }, { value: 'hmm', label: 'Hmm' },
                 { value: 'haaa', label: 'Sigh' }, { value: 'yawn', label: 'Yawn' },
                 { value: 'rambling', label: 'Mumble' }, { value: 'cough', label: 'Cough'}
             ]}
        ]},
        { name: 'Spell', key: 'spell', playMethod: 'playSpellManual', params: [
             { id: 'spellPower', label: 'Power', min: 0, max: 4, step: 1, default: 2 },
             { id: 'spellCastTime', label: 'Cast Time', min: 0, max: 4, step: 1, default: 1 } // Fast to Slow
        ], selects: [
             { id: 'spellElement', label: 'Element', default: 'arcane', options: [
                 { value: 'fire', label: 'Fire' }, { value: 'water', label: 'Water' },
                 { value: 'air', label: 'Air' }, { value: 'earth', label: 'Earth' },
                 { value: 'arcane', label: 'Arcane' }, { value: 'light', label: 'Light' },
                 { value: 'dark', label: 'Dark' }
             ]}
        ]},
        { name: 'Sword', key: 'sword', playMethod: 'playSwordManual', params: [
             { id: 'swordIntensity', label: 'Intensity', min: 0, max: 4, step: 1, default: 2 }, // Light tap to Heavy blow
             { id: 'swordMetalType', label: 'Metal Type', min: 0, max: 4, step: 1, default: 1 } // Dull iron to Bright steel
        ], selects: [
             { id: 'swordActionType', label: 'Action', default: 'swing', options: [
                 { value: 'swing', label: 'Swing' }, { value: 'grind', label: 'Grind' },
                 { value: 'clash', label: 'Clash' }, { value: 'stab', label: 'Stab' },
                 { value: 'block', label: 'Block' }, { value: 'sheathe', label: 'Sheathe' },
                 { value: 'unsheathe', label: 'Unsheathe' }
             ]}
        ]},
        { name: 'Tree Chop', key: 'chop', playMethod: 'playChopManual', params: [
             { id: 'chopTreeSize', label: 'Tree Size', min: 0, max: 4, step: 1, default: 2 }, // Sapling to Huge
             { id: 'chopTool', label: 'Tool', min: 0, max: 4, step: 1, default: 1 }, // Hatchet to Large Axe
             { id: 'chopIntensity', label: 'Intensity', min: 0, max: 4, step: 1, default: 2 } // Light tap to Heavy swing
        ], selects: [] },
    ];

    // --- UI Element References ---
    const soundModuleSelect = document.getElementById('soundModuleSelect');
    const moduleControlsContainer = document.getElementById('moduleControlsContainer');
    const playManualButton = document.getElementById('playManualButton');
    const configJsonDisplay = document.getElementById('configJsonDisplay');
    const fftCanvas = document.getElementById('fftCanvas'); // Get canvas refs
    const waveformCanvas = document.getElementById('waveformCanvas');

    // --- State Management ---
    const currentConfig = {};

    // Initialize currentConfig with defaults from all modules
    soundModules.forEach(module => {
        module.params.forEach(param => {
            currentConfig[param.id] = param.default;
        });
        module.selects.forEach(select => {
            currentConfig[select.id] = select.default;
        });
    });

    // --- UI Update Functions ---

    function updateConfigDisplay() {
        // Display the currentConfig object nicely formatted
        configJsonDisplay.textContent = JSON.stringify(currentConfig, null, 2);
    }

    function updateModuleControls(moduleConfig) {
        moduleControlsContainer.innerHTML = ''; // Clear previous controls

        // Create controls for parameters (sliders)
        moduleConfig.params.forEach(param => {
            const controlGroup = document.createElement('div');
            controlGroup.className = 'control-group';

            const controlRow = document.createElement('div');
            controlRow.className = 'control-row';

            const label = document.createElement('label');
            label.htmlFor = param.id;
            label.textContent = `${param.label}:`;

            const slider = document.createElement('input');
            slider.type = 'range';
            slider.id = param.id;
            slider.min = param.min;
            slider.max = param.max;
            slider.step = param.step;
            slider.value = currentConfig[param.id] ?? param.default; // Use current value or default

            const valueDisplay = document.createElement('span');
            valueDisplay.className = 'value-display';
            valueDisplay.id = `${param.id}Value`;
            valueDisplay.textContent = slider.value;

            // Event listener for slider input
            slider.addEventListener('input', () => {
                const value = param.step >= 1 ? parseInt(slider.value) : parseFloat(slider.value);
                valueDisplay.textContent = value;
                currentConfig[param.id] = value;
                updateConfigDisplay();
                // Optionally update ambientManager immediately if needed for continuous sounds (though not used here)
                // ambientManager.updateParams({ [param.id]: value });
            });

            controlRow.appendChild(label);
            controlRow.appendChild(slider);
            controlRow.appendChild(valueDisplay);
            controlGroup.appendChild(controlRow);
            moduleControlsContainer.appendChild(controlGroup);
        });

        // Create controls for selects (dropdowns)
        moduleConfig.selects.forEach(select => {
             const controlGroup = document.createElement('div');
             controlGroup.className = 'control-group';

             const controlRow = document.createElement('div');
             controlRow.className = 'control-row';

            const label = document.createElement('label');
            label.htmlFor = select.id;
            label.textContent = `${select.label}:`;

            const selectElement = document.createElement('select');
            selectElement.id = select.id;

            select.options.forEach(option => {
                const optionElement = document.createElement('option');
                optionElement.value = option.value;
                optionElement.textContent = option.label;
                if ((currentConfig[select.id] ?? select.default) === option.value) {
                    optionElement.selected = true;
                }
                selectElement.appendChild(optionElement);
            });

             // Event listener for select change
             selectElement.addEventListener('change', (e) => {
                 currentConfig[select.id] = e.target.value;
                 updateConfigDisplay();
                 // ambientManager.updateParams({ [select.id]: e.target.value });
             });

            controlRow.appendChild(label);
            controlRow.appendChild(selectElement);
            controlGroup.appendChild(controlRow);
            moduleControlsContainer.appendChild(controlGroup);
        });

        // Update play button text
        playManualButton.textContent = `Play ${moduleConfig.name} Sound`;
    }

    // --- Populate Module Select Dropdown ---
    soundModules.forEach(module => {
        const option = document.createElement('option');
        option.value = module.key; // Use the key used in ambientManager.sounds
        option.textContent = module.name;
        soundModuleSelect.appendChild(option);
    });

    // --- Event Listeners ---

    // Listener for sound module selection change
    soundModuleSelect.addEventListener('change', (e) => {
        const selectedModuleKey = e.target.value;
        const selectedModuleConfig = soundModules.find(m => m.key === selectedModuleKey);
        if (selectedModuleConfig) {
            updateModuleControls(selectedModuleConfig);
        }
    });

    // Listener for the manual play button
    playManualButton.addEventListener('click', async () => {
        if (audioCtx.state === 'suspended') {
            await audioCtx.resume();
        }

        const selectedModuleKey = soundModuleSelect.value;
        const selectedModuleConfig = soundModules.find(m => m.key === selectedModuleKey);

        if (selectedModuleConfig && selectedModuleConfig.playMethod) {
            console.log(`Playing ${selectedModuleConfig.name} with config:`, currentConfig);

            // Update the manager with the *entire current config* before playing
            // This ensures all relevant parameters (even from other modules if needed by the sound class) are set
            await ambientManager.updateParams(currentConfig);

            // Trigger the specific manual play method
            await ambientManager.playManualByType(selectedModuleConfig.playMethod);

            // Start visualization via soundTestCommon
            // Pass the ambientManager itself. The visualization loop in SoundTestCommon
            // should primarily rely on the analyser data fed from masterGain.
            // The activeNodes check might not work perfectly but visualization should show sound.
            ambientManager.activeNodes = ambientManager.activeManualSounds;
            soundTestCommon.startVisualizations(ambientManager); // Pass manager instance
        } else {
            console.error(`Could not find configuration or play method for module key: ${selectedModuleKey}`);
        }
    });

    // --- Initial Setup ---
    const initialModuleKey = soundModuleSelect.value;
    const initialModuleConfig = soundModules.find(m => m.key === initialModuleKey);
    if (initialModuleConfig) {
        updateModuleControls(initialModuleConfig);
    }
    updateConfigDisplay(); // Show initial full config

    // Setup visualizations using SoundTestCommon (excluding NoteBar)
    if (fftCanvas && waveformCanvas) {
        // Manually set up canvases needed, excluding noteBarCanvas logic
        soundTestCommon.fftCanvas = fftCanvas;
        soundTestCommon.waveformCanvas = waveformCanvas;
        // soundTestCommon.noteBarCanvas = null; // Explicitly nullify if base class uses it

        fftCanvas.width = fftCanvas.offsetWidth;
        fftCanvas.height = fftCanvas.offsetHeight;
        waveformCanvas.width = waveformCanvas.offsetWidth;
        waveformCanvas.height = waveformCanvas.offsetHeight;

        window.addEventListener('resize', () => {
             if (fftCanvas) {
                fftCanvas.width = fftCanvas.offsetWidth;
                fftCanvas.height = fftCanvas.offsetHeight;
             }
             if (waveformCanvas) {
                waveformCanvas.width = waveformCanvas.offsetWidth;
                waveformCanvas.height = waveformCanvas.offsetHeight;
             }
        });
         console.log("Visualizations initialized.");
    } else {
        console.error('FFT or Waveform canvas elements not found');
    }

});