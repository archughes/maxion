export const CONFIG = {
    // General Game Settings
    GAME_TITLE: "Maxion",
    VERSION: "0.1.0",
    DEBUG_MODE: false, // Toggles debug logs and features (true/false)
  
    // Player Settings (from player.js)
    PLAYER_MAX_HEALTH: 100,
    PLAYER_MAX_MANA: 50,
    PLAYER_WALK_SPEED: 5,
    PLAYER_SPRINT_SPEED: 10,
    PLAYER_JUMP_HEIGHT: 1.5,
    PLAYER_GRAVITY: 9.8,
    PLAYER_DROWNING_TIME: 5, // Time in seconds before drowning
    PLAYER_INVENTORY_SIZE: 20, // Default inventory slots (min: 1)
  
    // Camera Settings (from input.js)
    CAMERA_MIN_DISTANCE: 5,
    CAMERA_MAX_DISTANCE: 50,
    CAMERA_DEFAULT_DISTANCE: 20,
    CAMERA_MIN_PITCH: -Math.PI / 2 + 0.1,
    CAMERA_MAX_PITCH: Math.PI / 2 - 0.1,
  
    // Environment Settings (from environment.js)
    MAX_DOODAD_DISTANCE: 150, // Max distance to render doodads
    TERRAIN_SIZE: 256, // Terrain grid size
    TERRAIN_SCALE: 1.0,
  
    // Audio Settings (from sound-manager.js)
    MASTER_VOLUME: 0.5, // Range: 0.0 to 1.0
    MUSIC_VOLUME: 0.3, // Range: 0.0 to 1.0
    SFX_VOLUME: 0.7, // Range: 0.0 to 1.0
  
    // UI Settings (from ui.js)
    UI_SCALE: 1.0, // Range: 0.5 to 2.0
    UI_FONT: "Arial",
    UI_COLOR: "#000000",
  
    // Developer Settings
    DEV_CONSOLE_ENABLED: true, // true/false
    SHOW_FPS: false, // true/false
    WIRE_FRAME_MODE: false, // true/false
  
    // Video Settings
    RENDER_DISTANCE: 1000, // Max render distance (min: 100, max: 5000)
    SHADOW_QUALITY: "medium", // Options: "low", "medium", "high"
    ANTI_ALIASING: true, // true/false
  
    // Gameplay Settings
    DIFFICULTY: "normal", // Options: "easy", "normal", "hard"
    AUTO_SAVE_INTERVAL: 300, // Auto-save interval in seconds (min: 60, max: 3600)
  
    // Keybindings (from input.js)
    KEYBINDINGS: {
      forward: "W",
      backward: "S",
      left: "A",
      right: "D",
      jump: "Space",
      sprint: "Shift",
      interact: "X",
      inventory: "I",
      equipped: "P",
      quests: "U",
      stats: "K",
      minimap: "M",
    },
  };