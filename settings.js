// settings.js - Advanced settings and game state management with property-based API

import { CONFIG } from './data/config.js';
import { SaveLoadManager } from './saveLoadManager.js';
import { EpicManager } from './epicManager.js';

// Instantiate singletons
const epicManager = new EpicManager();
const saveLoadManager = new SaveLoadManager();

// Settings class to manage properties
class Settings {
  constructor() {
    // Initialize properties with default values from CONFIG
    this._difficulty = CONFIG.DIFFICULTY;
    this._autoSaveInterval = CONFIG.AUTO_SAVE_INTERVAL;
    this._masterVolume = CONFIG.MASTER_VOLUME;
    this._musicVolume = CONFIG.MUSIC_VOLUME;
    this._sfxVolume = CONFIG.SFX_VOLUME;
    this._shadowQuality = CONFIG.SHADOW_QUALITY;
    this._antiAliasing = CONFIG.ANTI_ALIASING;
    this._debugMode = CONFIG.DEBUG_MODE;
    this._showFPS = CONFIG.SHOW_FPS;
    this._wireFrameMode = CONFIG.WIRE_FRAME_MODE;
  }

  // Getters
  get difficulty() { return this._difficulty; }
  get autoSaveInterval() { return this._autoSaveInterval; }
  get masterVolume() { return this._masterVolume; }
  get musicVolume() { return this._musicVolume; }
  get sfxVolume() { return this._sfxVolume; }
  get shadowQuality() { return this._shadowQuality; }
  get antiAliasing() { return this._antiAliasing; }
  get debugMode() { return this._debugMode; }
  get showFPS() { return this._showFPS; }
  get wireFrameMode() { return this._wireFrameMode; }

  // Setters with validation
  set difficulty(value) {
    if (['easy', 'normal', 'hard'].includes(value)) {
      this._difficulty = value;
    } else {
      console.warn(`Invalid difficulty: ${value}. Using default: ${this._difficulty}`);
    }
  }
  set autoSaveInterval(value) {
    const minutes = parseInt(value, 10);
    if (minutes >= 1 && minutes <= 60) {
      this._autoSaveInterval = minutes * 60; // Convert to seconds
    } else {
      console.warn(`Auto-save interval out of range (1-60 min). Using default: ${this._autoSaveInterval / 60} min`);
    }
  }
  set masterVolume(value) {
    const volume = parseFloat(value) / 100;
    if (volume >= 0 && volume <= 1) {
      this._masterVolume = volume;
    } else {
      console.warn(`Master volume out of range (0-100). Using default: ${this._masterVolume * 100}`);
    }
  }
  set musicVolume(value) {
    const volume = parseFloat(value) / 100;
    if (volume >= 0 && volume <= 1) {
      this._musicVolume = volume;
    } else {
      console.warn(`Music volume out of range (0-100). Using default: ${this._musicVolume * 100}`);
    }
  }
  set sfxVolume(value) {
    const volume = parseFloat(value) / 100;
    if (volume >= 0 && volume <= 1) {
      this._sfxVolume = volume;
    } else {
      console.warn(`SFX volume out of range (0-100). Using default: ${this._sfxVolume * 100}`);
    }
  }
  set shadowQuality(value) {
    if (['low', 'medium', 'high'].includes(value)) {
      this._shadowQuality = value;
    } else {
      console.warn(`Invalid shadow quality: ${value}. Using default: ${this._shadowQuality}`);
    }
  }
  set antiAliasing(value) {
    this._antiAliasing = !!value; // Convert to boolean
  }
  set debugMode(value) {
    this._debugMode = !!value;
  }
  set showFPS(value) {
    this._showFPS = !!value;
  }
  set wireFrameMode(value) {
    this._wireFrameMode = !!value;
  }
}

// Export singleton instance
export const settings = new Settings();

export function updateSettings() {
  // Update UI elements with current settings values
  document.getElementById('difficulty').value = settings.difficulty;
  document.getElementById('auto-save').value = settings.autoSaveInterval / 60; // Display in minutes
  document.getElementById('master-volume').value = settings.masterVolume * 100;
  document.getElementById('music-volume').value = settings.musicVolume * 100;
  document.getElementById('sfx-volume').value = settings.sfxVolume * 100;
  document.getElementById('shadow-quality').value = settings.shadowQuality;
  document.getElementById('anti-aliasing').checked = settings.antiAliasing;
  document.getElementById('debug-mode').checked = settings.debugMode;
  document.getElementById('show-fps').checked = settings.showFPS;
  document.getElementById('wire-frame').checked = settings.wireFrameMode;

  // Set initial tab (e.g., gameplay)
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.style.display = tab.id === 'gameplay-tab' ? 'block' : 'none';
  });
}

export function saveSettings() {
  // Update settings properties from UI
  settings.difficulty = document.getElementById('difficulty').value;
  settings.autoSaveInterval = document.getElementById('auto-save').value;
  settings.masterVolume = document.getElementById('master-volume').value;
  settings.musicVolume = document.getElementById('music-volume').value;
  settings.sfxVolume = document.getElementById('sfx-volume').value;
  settings.shadowQuality = document.getElementById('shadow-quality').value;
  settings.antiAliasing = document.getElementById('anti-aliasing').checked;
  settings.debugMode = document.getElementById('debug-mode').checked;
  settings.showFPS = document.getElementById('show-fps').checked;
  settings.wireFrameMode = document.getElementById('wire-frame').checked;

  // Apply settings to game
  applySettings();
  console.log('Settings saved:', {
    difficulty: settings.difficulty,
    autoSaveInterval: settings.autoSaveInterval,
    masterVolume: settings.masterVolume,
    musicVolume: settings.musicVolume,
    sfxVolume: settings.sfxVolume,
    shadowQuality: settings.shadowQuality,
    antiAliasing: settings.antiAliasing,
    debugMode: settings.debugMode,
    showFPS: settings.showFPS,
    wireFrameMode: settings.wireFrameMode,
  });
}

function applySettings() {
  console.log('Applying settings:', settings);
  
  const fpsDisplay = document.getElementById('fps-display');
  if (fpsDisplay) {
    fpsDisplay.style.display = settings.showFPS ? 'block' : 'none';
  }
}

export function loadGame() {
  saveLoadManager.loadGame();
}

export function saveGame() {
  saveLoadManager.saveGame();
}