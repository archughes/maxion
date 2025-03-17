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

    // Sound module definitions - centralized configuration
    const soundModules = [
        {
            name: 'Wind',
            params: [
                { id: 'windLevel', label: 'Wind Level', min: 0, max: 4, step: 1, default: 0 },
                { id: 'windTurbidity', label: 'Wind Turbidity', min: 0, max: 4, step: 1, default: 0 }
            ],
            playMethod: 'playWindManual',
            duration: 2000
        },
        {
            name: 'Rain',
            params: [
                { id: 'rainDensity', label: 'Rain Density', min: 0, max: 4, step: 1, default: 0 },
                { id: 'rainSpeed', label: 'Rain Speed', min: 0, max: 4, step: 1, default: 1 },
                { id: 'raindropSize', label: 'Raindrop Size', min: 0, max: 4, step: 1, default: 1 }
            ],
            selects: [
                { 
                    id: 'surfaceType', 
                    label: 'Surface Type', 
                    options: [
                        { value: 'metal', label: 'Metal' },
                        { value: 'grass', label: 'Grass' },
                        { value: 'water', label: 'Water', selected: true },
                        { value: 'wood', label: 'Wood' },
                        { value: 'concrete', label: 'Concrete' },
                        { value: 'glass', label: 'Glass' }
                    ]
                }
            ],
            playMethod: 'playRainManual',
            duration: 2000
        },
        {
            name: 'Thunder',
            params: [
                { id: 'thunderFreq', label: 'Thunder Frequency', min: 0, max: 4, step: 1, default: 0 },
                { id: 'thunderDistance', label: 'Thunder Distance', min: 0, max: 4, step: 1, default: 0 }
            ],
            playMethod: 'playThunderManual',
            duration: 5000
        },
        {
            name: 'Ocean',
            params: [
                { id: 'waveIntensity', label: 'Wave Intensity', min: 0, max: 4, step: 1, default: 0 },
                { id: 'waveFrequency', label: 'Wave Frequency', min: 0, max: 4, step: 1, default: 1 }
            ],
            playMethod: 'playOceanWavesManual',
            duration: 3000
        },
        {
            name: 'Fire',
            params: [
                { id: 'fireIntensity', label: 'Fire Intensity', min: 0, max: 4, step: 1, default: 0 },
                { id: 'fireCrackleRate', label: 'Fire Crackle Rate', min: 0, max: 4, step: 1, default: 1 }
            ],
            playMethod: 'playFireManual',
            duration: 3000
        },
        {
            name: 'Birds',
            params: [
                { id: 'birdActivity', label: 'Bird Activity', min: 0, max: 4, step: 1, default: 0 },
                { id: 'birdPitch', label: 'Bird Pitch', min: 0, max: 4, step: 1, default: 1 }
            ],
            selects: [
                {
                    id: 'birdType',
                    label: 'Bird Type',
                    options: [
                        { value: 'robin', label: 'Robin' },
                        { value: 'warbler', label: 'Warbler' },
                        { value: 'thrush', label: 'Thrush' },
                        { value: 'owl', label: 'Owl' },
                        { value: 'cardinal', label: 'Cardinal' }
                    ]
                }
            ],
            playMethod: 'playBirdManual',
            duration: 2000
        },
        {
            name: 'Crickets',
            params: [
                { id: 'cricketDensity', label: 'Cricket Density', min: 0, max: 4, step: 1, default: 0 },
                { id: 'cricketSpeed', label: 'Cricket Speed', min: 0, max: 4, step: 1, default: 1 }
            ],
            playMethod: 'playCricketsManual',
            duration: 3000
        },
        {
            name: 'River',
            params: [
                { id: 'riverFlow', label: 'River Flow', min: 0, max: 4, step: 1, default: 0 },
                { id: 'riverDepth', label: 'River Depth', min: 0, max: 4, step: 1, default: 1 }
            ],
            playMethod: 'playRiverManual',
            duration: 3000
        },
        {
            name: 'Ice',
            params: [
                { id: 'iceIntensity', label: 'Ice Intensity', min: 0, max: 4, step: 1, default: 0 },
                { id: 'iceFractureRate', label: 'Ice Fracture Rate', min: 0, max: 4, step: 1, default: 1 }
            ],
            playMethod: 'playIceCrackingManual',
            duration: 3000
        },
        {
            name: 'Volcanic',
            params: [
                { id: 'rumbleIntensity', label: 'Rumble Intensity', min: 0, max: 4, step: 1, default: 0 },
                { id: 'ventActivity', label: 'Vent Activity', min: 0, max: 4, step: 1, default: 1 }
            ],
            playMethod: 'playVolcanicRumbleManual',
            duration: 5000
        },
        {
            name: 'Achievement',
            params: [
                { id: 'achievementImportance', label: 'Achievement Importance', min: 0, max: 4, step: 1, default: 2 },
            ],
            selects: [
                {
                    id: 'achievementType',
                    label: 'Achievement Type',
                    options: [
                        { value: 'levelUp', label: 'Level Up', selected: true },
                        { value: 'minorQuest', label: 'Minor Quest' },
                        { value: 'majorQuest', label: 'Major Quest' }
                    ]
                },
                {
                    id: 'achievementStyle',
                    label: 'Achievement Style',
                    options: [
                        { value: 'fantasy', label: 'Fantasy', selected: true },
                        { value: 'sci-fi', label: 'Sci-Fi' },
                        { value: 'minimal', label: 'Minimal' }
                    ]
                }
            ],
            playMethod: 'playAchievementManual',
            duration: 2000
        },
        {
            name: 'Berry',
            params: [
                { id: 'berryType', label: 'Berry Type', min: 0, max: 4, step: 1, default: 2 },
                { id: 'berryRipeness', label: 'Berry Ripeness', min: 0, max: 4, step: 1, default: 2 },
                { id: 'berryQuantity', label: 'Berry Quantity', min: 0, max: 4, step: 1, default: 2 }
            ],
            playMethod: 'playBerryManual',
            duration: 2000
        },
        {
            name: 'Bow',
            params: [
                { id: 'drawStrength', label: 'Draw Strength', min: 0, max: 4, step: 1, default: 2 }
            ],
            selects: [
                {
                    id: 'bowType',
                    label: 'Bow Type',
                    options: [
                        { value: 'standard', label: 'Standard', selected: true },
                        { value: 'longbow', label: 'Longbow' },
                        { value: 'shortbow', label: 'Shortbow' },
                        { value: 'crossbow', label: 'Crossbow' }
                    ]
                },
                {
                    id: 'arrowType',
                    label: 'Arrow Type',
                    options: [
                        { value: 'wooden', label: 'Wooden', selected: true },
                        { value: 'metal', label: 'Metal' },
                        { value: 'flaming', label: 'Flaming' },
                        { value: 'magical', label: 'Magical' }
                    ]
                }
            ],
            playMethod: 'playBowManual',
            duration: 2000
        },
        {
            name: 'Chest',
            params: [
                { id: 'chestSize', label: 'Chest Size', min: 0, max: 4, step: 1, default: 2 },
                { id: 'chestMaterialType', label: 'Chest Material Type', min: 0, max: 4, step: 1, default: 2 },
                { id: 'chestCondition', label: 'Chest Condition', min: 0, max: 4, step: 1, default: 2 },
                { id: 'chestTreasureValue', label: 'Chest Treasure Value', min: 0, max: 4, step: 1, default: 2 }
            ],
            playMethod: 'playChestManual',
            duration: 2000
        },
        {
            name: 'Footsteps',
            params: [
                { id: 'footstepsIntensity', label: 'Footsteps Intensity', min: 0, max: 4, step: 1, default: 2 },
                { id: 'footstepsWetness', label: 'Footsteps Wetness', min: 0, max: 4, step: 1, default: 2 }
            ],
            selects: [
                {
                    id: 'footstepsEnvironment',
                    label: 'Footsteps Environment',
                    options: [
                        { value: 'stone', label: 'Stone', selected: true },
                        { value: 'water', label: 'Water' },
                        { value: 'mud', label: 'Mud' },
                        { value: 'sand', label: 'Sand' },
                        { value: 'metal', label: 'Metal' }
                    ]
                }
            ],
            playMethod: 'playFootstepsManual',
            duration: 2000
        },
        {
            name: 'HumanIdle',
            params: [
                { id: 'humanIdleIntensity', label: 'Human Idle Intensity', min: 0, max: 4, step: 1, default: 2 },
                { id: 'humanIdleVoiceType', label: 'Human Idle Voice Type', min: 0, max: 4, step: 1, default: 2 }
            ],
            selects: [
                {
                    id: 'humanIdleSoundType',
                    label: 'Human Idle Sound Type',
                    options: [
                        { value: 'breathing', label: 'Breathing', selected: true },
                        { value: 'hmm', label: 'Hmm' },
                        { value: 'haaa', label: 'Haaa' },
                        { value: 'yawn', label: 'Yawn' },
                        { value: 'rambling', label: 'Rambling' }
                    ]
                }
            ],
            playMethod: 'playHumanIdleManual',
            duration: 2000
        },
        {
            name: 'Spell',
            params: [
                { id: 'spellPower', label: 'Spell Power', min: 0, max: 4, step: 1, default: 0 },
                { id: 'spellCastTime', label: 'Spell Cast Time', min: 0, max: 4, step: 1, default: 0 }
            ],
            selects: [
                {
                    id: 'spellElement',
                    label: 'Spell Element',
                    options: [
                        { value: 'fire', label: 'Fire', selected: true },
                        { value: 'water', label: 'Water' },
                        { value: 'air', label: 'Air' },
                        { value: 'earth', label: 'Earth' },
                        { value: 'arcane', label: 'Arcane' }
                    ]
                }
            ],
            playMethod: 'playSpellManual',
            duration: 2000
        },
        {
            name: 'Sword',
            params: [
                { id: 'swordIntensity', label: 'Sword Intensity', min: 0, max: 4, step: 1, default: 0 },
                { id: 'swordMetalType', label: 'Sword Metal Type', min: 0, max: 4, step: 1, default: 0 }
            ],
            selects: [
                {
                    id: 'swordActionType',
                    label: 'Sword Action Type',
                    options: [
                        { value: 'swing', label: 'Swing', selected: true },
                        { value: 'grind', label: 'Grind' },
                        { value: 'clash', label: 'Clash' },
                        { value: 'stab', label: 'Stab' },
                        { value: 'block', label: 'Block' }
                    ]
                }
            ],
            playMethod: 'playSwordManual',
            duration: 2000
        },
        {
            name: 'Chop',
            params: [
                { id: 'chopTreeSize', label: 'Chop Tree Size', min: 0, max: 4, step: 1, default: 2 },
                { id: 'chopTool', label: 'Chop Tool', min: 0, max: 4, step: 1, default: 2 },
                { id: 'chopIntensity', label: 'Chop Intensity', min: 0, max: 4, step: 1, default: 2 }
            ],
            playMethod: 'playChopManual',
            duration: 2000
        }
    ];

    // Initialize current configuration from module defaults
    const currentConfig = {};
    soundModules.forEach(module => {
        module.params.forEach(param => {
            currentConfig[param.id] = param.default;
        });
        if (module.selects) {
            module.selects.forEach(select => {
                const selectedOption = select.options.find(option => option.selected);
                currentConfig[select.id] = selectedOption ? selectedOption.value : select.options[0].value;
            });
        }
    });

    // Generate the UI for Tab 1 (Controls with collapsible sections)
    function generateTab1UI() {
        const tab1Container = document.getElementById('tab1');
        
        // Clear existing content except for buttons
        const toggleButton = document.getElementById('toggleButton');
        const saveButton = document.getElementById('saveButton');
        tab1Container.innerHTML = '';
        
        // Generate collapsible sections for each sound module
        soundModules.forEach(module => {
            const section = document.createElement('div');
            section.className = 'sound-module-section';
            
            const header = document.createElement('div');
            header.className = 'sound-module-header';
            header.innerHTML = `
                <h3>${module.name}</h3>
                <button class="toggle-section" data-target="${module.name.toLowerCase()}">▼</button>
            `;
            
            const content = document.createElement('div');
            content.className = 'sound-module-content';
            content.id = `section-${module.name.toLowerCase()}`;
            
            // Add range sliders
            module.params.forEach(param => {
                const control = document.createElement('div');
                control.className = 'control';
                control.innerHTML = `
                    <label for="${param.id}">${param.label} (${param.min}-${param.max})</label>
                    <input type="range" id="${param.id}" min="${param.min}" max="${param.max}" 
                           step="${param.step}" value="${currentConfig[param.id]}">
                `;
                content.appendChild(control);
            });
            
            // Add select dropdowns if they exist
            if (module.selects) {
                module.selects.forEach(select => {
                    const control = document.createElement('div');
                    control.className = 'control';
                    
                    const selectElement = document.createElement('select');
                    selectElement.id = select.id;
                    
                    const label = document.createElement('label');
                    label.htmlFor = select.id;
                    label.textContent = select.label;
                    
                    select.options.forEach(option => {
                        const optionElement = document.createElement('option');
                        optionElement.value = option.value;
                        optionElement.textContent = option.label;
                        if (option.selected) {
                            optionElement.selected = true;
                        }
                        selectElement.appendChild(optionElement);
                    });
                    
                    control.appendChild(label);
                    control.appendChild(selectElement);
                    content.appendChild(control);
                });
            }
            
            // Add play button for this module
            const playButton = document.createElement('button');
            playButton.className = 'play-module-button';
            playButton.textContent = `Play ${module.name}`;
            playButton.dataset.module = module.name;
            content.appendChild(playButton);
            
            section.appendChild(header);
            section.appendChild(content);
            tab1Container.appendChild(section);
        });
        
        // Add main control buttons back
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'main-controls';
        buttonContainer.style.marginTop = '20px';
        
        if (toggleButton) buttonContainer.appendChild(toggleButton);
        if (saveButton) buttonContainer.appendChild(saveButton);
        
        tab1Container.appendChild(buttonContainer);
        
        // Add toggle functionality for sections
        document.querySelectorAll('.toggle-section').forEach(button => {
            button.addEventListener('click', () => {
                const targetId = `section-${button.dataset.target}`;
                const targetSection = document.getElementById(targetId);
                
                if (targetSection.style.display === 'none') {
                    targetSection.style.display = 'block';
                    button.textContent = '▼';
                } else {
                    targetSection.style.display = 'none';
                    button.textContent = '►';
                }
            });
        });
    }

    // Generate UI for Tab 2 (Manual Sound Scheduling)
    function generateTab2UI() {
        // Create sound module selector
        const moduleSelector = document.createElement('div');
        moduleSelector.className = 'module-selector';
        moduleSelector.innerHTML = `
            <label for="soundModuleSelect">Select Sound Module:</label>
            <select id="soundModuleSelect"></select>
        `;
        
        const soundModuleSelect = moduleSelector.querySelector('#soundModuleSelect');
        
        soundModules.forEach(module => {
            const option = document.createElement('option');
            option.value = module.name.toLowerCase();
            option.textContent = module.name;
            soundModuleSelect.appendChild(option);
        });
        
        // Create manual controls container
        const manualControls = document.createElement('div');
        manualControls.id = 'manualControls';
        manualControls.className = 'matrix';
        
        // Insert at the top of Tab 2, after current config display
        const tab2 = document.getElementById('tab2');
        const currentConfigDisplay = document.getElementById('currentConfig');
        
        tab2.insertBefore(moduleSelector, currentConfigDisplay.nextSibling);
        tab2.insertBefore(manualControls, moduleSelector.nextSibling);
        
        // Initial population of controls
        updateManualControls(soundModules[0]);
        
        // Add event listener for module selection change
        soundModuleSelect.addEventListener('change', (e) => {
            const selectedModule = soundModules.find(
                module => module.name.toLowerCase() === e.target.value
            );
            if (selectedModule) {
                updateManualControls(selectedModule);
            }
        });
    }
    
    // Update manual controls based on selected module
    function updateManualControls(module) {
        const manualControls = document.getElementById('manualControls');
        manualControls.innerHTML = '';
        
        // Add selects if they exist
        if (module.selects) {
            module.selects.forEach(select => {
                const row = document.createElement('div');
                row.className = 'row';
                
                const label = document.createElement('label');
                label.textContent = select.label;
                
                const selectElement = document.createElement('select');
                selectElement.id = `manual${select.id.charAt(0).toUpperCase() + select.id.slice(1)}`;
                selectElement.style = 'margin: 0 5px; padding: 5px;';
                
                select.options.forEach(option => {
                    const optionElement = document.createElement('option');
                    optionElement.value = option.value;
                    optionElement.textContent = option.label;
                    if (option.selected) {
                        optionElement.selected = true;
                    }
                    selectElement.appendChild(optionElement);
                });
                
                row.appendChild(label);
                row.appendChild(selectElement);
                manualControls.appendChild(row);
            });
        }
        
        // Add parameters
        module.params.forEach(param => {
            const row = document.createElement('div');
            row.className = 'row';
            
            const label = document.createElement('label');
            label.textContent = param.label;
            
            row.appendChild(label);
            
            // Add buttons for each value
            for (let i = param.min; i <= param.max; i += param.step) {
                const button = document.createElement('button');
                button.className = 'value-button';
                button.textContent = i;
                button.dataset.param = param.id;
                button.dataset.value = i;
                button.dataset.module = module.name;
                row.appendChild(button);
            }
            
            manualControls.appendChild(row);
        });
        
        // Add Play Module button
        const playRow = document.createElement('div');
        playRow.className = 'row';
        
        const playButton = document.createElement('button');
        playButton.className = 'play-module-manual';
        playButton.textContent = `Play ${module.name} Sound`;
        playButton.dataset.module = module.name;
        playButton.style = 'width: 100%; margin-top: 15px;';
        
        playRow.appendChild(playButton);
        manualControls.appendChild(playRow);
    }
    
    function updateConfigDisplay() {
        // Update all fields in the current config display
        Object.keys(currentConfig).forEach(key => {
            const element = document.getElementById(`current${key.charAt(0).toUpperCase() + key.slice(1)}`);
            if (element) {
                element.textContent = currentConfig[key];
            }
        });
    }

    async function restartContinuous() {
        if (ambientManager.isPlayingContinuous) {
            ambientManager.stopContinuous();
            setTimeout(async () => {
                await ambientManager.startContinuous();
            }, 500);
        }
    }

    // Event delegation for all UI interactions
    document.addEventListener('click', async (e) => {
        // Handle tab switching
        if (e.target.classList.contains('tab-button')) {
            const tabButtons = document.querySelectorAll('.tab-button');
            const tabContents = document.querySelectorAll('.tab-content');
            
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            e.target.classList.add('active');
            document.getElementById(e.target.getAttribute('data-tab')).classList.add('active');
        }
        
        // Handle value buttons in manual mode (Tab 2)
        if (e.target.classList.contains('value-button')) {
            const param = e.target.getAttribute('data-param');
            const value = parseInt(e.target.getAttribute('data-value'));
            currentConfig[param] = value;
            updateConfigDisplay();
            
            await ambientManager.updateParams({ [param]: value });
            
            // Find the corresponding module to determine play method and duration
            const moduleName = e.target.getAttribute('data-module');
            const module = soundModules.find(m => m.name === moduleName);
            
            if (module && module.playMethod) {
                const soundId = `${param}-${value}-${Date.now()}`;
                ambientManager.activeManualSounds.add(soundId);
                ambientManager.startVisualizations();
                
                // Call the appropriate play method
                if (typeof ambientManager[module.playMethod] === 'function') {
                    await ambientManager[module.playMethod]();
                }
                
                setTimeout(() => {
                    ambientManager.activeManualSounds.delete(soundId);
                    ambientManager.checkVisualizationState();
                }, module.duration);
            }
        }
        
        // Handle play module buttons in Tab 1
        if (e.target.classList.contains('play-module-button')) {
            const moduleName = e.target.dataset.module;
            const module = soundModules.find(m => m.name === moduleName);
            
            if (module && module.playMethod) {
                // Apply current config before playing
                await ambientManager.updateParams(currentConfig);
                
                const soundId = `${moduleName}-${Date.now()}`;
                ambientManager.activeManualSounds.add(soundId);
                ambientManager.startVisualizations();
                
                // Call the appropriate play method
                if (typeof ambientManager[module.playMethod] === 'function') {
                    await ambientManager[module.playMethod]();
                }
                
                setTimeout(() => {
                    ambientManager.activeManualSounds.delete(soundId);
                    ambientManager.checkVisualizationState();
                }, module.duration);
            }
        }
        
        // Handle play module button in Tab 2
        if (e.target.classList.contains('play-module-manual')) {
            const moduleName = e.target.dataset.module;
            const module = soundModules.find(m => m.name === moduleName);
            
            if (module && module.playMethod) {
                // Apply current config before playing
                await ambientManager.updateParams(currentConfig);
                
                const soundId = `${moduleName}-manual-${Date.now()}`;
                ambientManager.activeManualSounds.add(soundId);
                ambientManager.startVisualizations();
                
                // Call the appropriate play method
                if (typeof ambientManager[module.playMethod] === 'function') {
                    await ambientManager[module.playMethod]();
                }
                
                setTimeout(() => {
                    ambientManager.activeManualSounds.delete(soundId);
                    ambientManager.checkVisualizationState();
                }, module.duration);
            }
        }
        
        // Handle start/stop button
        if (e.target.id === 'toggleButton') {
            if (ambientManager.isPlayingContinuous) {
                ambientManager.stopContinuous();
                e.target.textContent = 'Start';
            } else {
                await ambientManager.updateParams(currentConfig);
                await ambientManager.startContinuous();
                e.target.textContent = 'Stop';
            }
        }
        
        // Handle save button
        if (e.target.id === 'saveButton') {
            console.log('WAV saving not implemented. Use a library like audiobuffer-to-wav.');
        }
    });
    
    // Handle change events for all inputs via delegation
    document.addEventListener('input', async (e) => {
        // Handle range inputs
        if (e.target.type === 'range') {
            const paramId = e.target.id;
            currentConfig[paramId] = parseInt(e.target.value);
            await ambientManager.updateParams({ [paramId]: currentConfig[paramId] });
            await restartContinuous();
            updateConfigDisplay();
        }
    });
    
    // Handle select changes
    document.addEventListener('change', async (e) => {
        if (e.target.tagName === 'SELECT' && e.target.id !== 'soundModuleSelect') {
            let paramId = e.target.id;
            
            // Handle manual selects (they have 'manual' prefix)
            if (paramId.startsWith('manual')) {
                paramId = paramId.charAt(6).toLowerCase() + paramId.slice(7);
            }
            
            currentConfig[paramId] = e.target.value;
            updateConfigDisplay();
            await ambientManager.updateParams({ [paramId]: currentConfig[paramId] });
        }
    });

    // Initialize the UI
    generateTab1UI();
    generateTab2UI();
    updateConfigDisplay();
});