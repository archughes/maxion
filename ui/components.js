export function renderHealthBar() {
    return `
        <div class="health-bar">
            <div class="health-fill" style="width: 100%;"></div>
        </div>
    `;
}

export function renderManaBar() {
    return `
        <div class="mana-bar">
            <div class="mana-fill" style="width: 100%;"></div>
        </div>
    `;
}

export function renderXPBar() {
    return `
        <div class="xp-bar">
            <div class="xp-fill" style="width: 0%;"></div>
        </div>
    `;
}

export function renderActionBar() {
    return `
        <div class="bottom-row">
            <div class="action-bar">
                ${Array.from({ length: 6 }, (_, i) => `
                    <button class="action-slot" data-slot="${i + 1}">${i + 1}</button>
                `).join('')}
            </div>
            <div class="inventory-container">
                <button class="popup-btn" data-target="inventory-popup">Inventory</button>
                <button class="popup-btn" data-target="spell-popup">Spells</button>
                <button class="popup-btn" data-target="quests-popup">Quests</button>
                <button class="popup-btn" data-target="settings-popup">Settings</button>
            </div>
        </div>
    `;
}

export function renderPopups() {
    return `
        <div class="popup" id="inventory-popup" style="display:none;">
            <h2>Inventory & Recipes</h2>
            <input type="text" class="search-bar" placeholder="Search...">
            <div class="scroll-box">
                <h3>Inventory</h3>
                <div class="inventory-grid"></div>
                <h3>Recipes</h3>
                <div class="recipe-list"></div>
            </div>
            <div style="text-align: left; margin-top: 10px;">
                <button class="close-btn">Close</button>
            </div>
        </div>
        <div class="popup" id="spell-popup" style="display:none;">
            <h2>Spells</h2>
            <div class="spell-list scroll-box"></div>
            <div style="text-align: left; margin-top: 10px;">
                <button class="close-btn">Close</button>
            </div>
        </div>
        <div class="popup" id="settings-popup" style="display:none;">
            <h2>Settings</h2>
            <div class="settings-tabs">
                <button class="tab-btn active" data-tab="gameplay">Gameplay</button>
                <button class="tab-btn" data-tab="media">Video & Audio</button>
                <button class="tab-btn" data-tab="developer">Developer</button>
                <button class="tab-btn" data-tab="credits">Credits</button>
            </div>
            <div class="tab-content" id="gameplay-tab">
                <h3>Gameplay Settings</h3>
                <label for="difficulty">Difficulty:</label>
                <select id="difficulty">
                    <option value="easy">Easy</option>
                    <option value="normal" selected>Normal</option>
                    <option value="hard">Hard</option>
                </select>
                <br>
                <label for="auto-save">Auto-Save Interval (minutes):</label>
                <input type="number" id="auto-save" min="1" max="60" value="5">
            </div>
            <div class="tab-content" id="media-tab" style="display:none;">
                <h3>Video & Audio Settings</h3>
                <label for="master-volume">Master Volume:</label>
                <input type="range" id="master-volume" min="0" max="100" value="50">
                <br>
                <label for="music-volume">Music Volume:</label>
                <input type="range" id="music-volume" min="0" max="100" value="30">
                <br>
                <label for="shadow-quality">Shadow Quality:</label>
                <select id="shadow-quality">
                    <option value="low">Low</option>
                    <option value="medium" selected>Medium</option>
                    <option value="high">High</option>
                </select>
                <br>
                <label for="anti-aliasing">Anti-Aliasing:</label>
                <input type="checkbox" id="anti-aliasing" checked>
            </div>
            <div class="tab-content" id="developer-tab" style="display:none;">
                <h3>Developer Settings</h3>
                <label for="debug-mode">Debug Mode:</label>
                <input type="checkbox" id="debug-mode">
                <br>
                <label for="show-fps">Show FPS:</label>
                <input type="checkbox" id="show-fps">
                <br>
                <label for="wire-frame">Wireframe Mode:</label>
                <input type="checkbox" id="wire-frame">
            </div>
            <div class="tab-content" id="credits-tab" style="display:none;">
                <h3>Credits</h3>
                <p>Developed by [Your Name]</p>
                <p>Assets from [Asset Sources]</p>
                <p>Special thanks to [Contributors]</p>
            </div>
            <div class="button-bar">
                <button class="save-settings-btn">Apply Settings</button>
                <button class="load-game-btn">Load Game</button>
                <button class="save-game-btn">Save Game</button>
                <button class="resume-btn">Resume</button>
            </div>
        </div>
        <div class="popup" id="quests-popup" style="display:none;">
            <h2>Quests</h2>
            <div class="quest-list scroll-box"></div>
            <div style="text-align: left; margin-top: 10px;">
                <button class="close-btn">Close</button>
            </div>
        </div>
        <div class="popup" id="stats-popup" style="display:none;">
            <h2>Character Stats</h2>
            <div class="scroll-box">
                <div class="stats-info"></div>
            </div>
            <div style="text-align: left; margin-top: 10px;">
                <button class="close-btn">Close</button>
            </div>
        </div>
    `;
}

export function renderMinimap() {
    return `
        <div class="minimap">
            <div class="map-frame"></div>
        </div>
        <div class="time-frame">
            <div class="time-display">00:00</div>
        </div>
    `;
}

export function renderTooltip() {
    return `
        <div id="tooltip" style="position:absolute; display:none; background:#fff; border:1px solid #000; padding:5px; pointer-events:none; z-index:100;"></div>
    `;
}