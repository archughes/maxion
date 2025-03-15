export class EpicManager {
    constructor() {
      this.currentEpic = 1; // Default to Epic 1
      this.epicConfigs = {
        1: {
          "action-bar-slots": 2,
          "bag-slots": 5,
          "biomes": ["summer", "autumn", "spring"],
          "doodad-lod": "low",
          "character-complexity": "cube",
          "skills": ["Power Attack"],
        },
        2: {
          "action-bar-slots": 5,
          "bag-slots": 10,
          "biomes": ["summer", "autumn", "spring", "winter"],
          "doodad-lod": "medium",
          "character-complexity": "limbs",
          "skills": ["Power Attack", "Invisibility", "Fireball"],
        },
        3: {
          "action-bar-slots": 8,
          "bag-slots": 15,
          "biomes": ["summer", "autumn", "spring", "winter", "void"],
          "doodad-lod": "high",
          "character-complexity": "detailed",
          "skills": ["Power Attack", "Invisibility", "Fireball", "Flight"],
        },
      };
    }
  
    setEpic(epicNumber) {
      if (epicNumber in this.epicConfigs) {
        this.currentEpic = epicNumber;
      } else {
        console.error(`Epic ${epicNumber} is not defined.`);
      }
    }
  
    getValue(stateType) {
      const config = this.epicConfigs[this.currentEpic];
      if (config && stateType in config) {
        return config[stateType];
      }
      console.warn(`State type "${stateType}" not found for Epic ${this.currentEpic}.`);
      return null;
    }
  
    getFlightSpeed(altitude) {
      if (this.currentEpic >= 3) {
        return 10 * Math.log(altitude + 1); // Logarithmic speed increase
      }
      return 0; // No flight in earlier epics
    }
  }

  export const epicManager = new EpicManager();