export class Builder {
    constructor(player) {
      this.player = player;
    }
  
    buildDoodad(doodadType, position) {
      // Placeholder logic to place a doodad at the specified position
      console.log(`Building ${doodadType} at position ${JSON.stringify(position)}`);
      // Example: Add doodad to scene (integrate with your rendering system)
    }
  }