export class SkinManager {
    constructor() {
      this.skins = {}; // Loaded skins
    }
  
    loadSkins(skinsData) {
      // Load skins from a data source (e.g., JSON file)
      this.skins = skinsData;
      console.log('Skins loaded:', Object.keys(this.skins));
    }
  
    applySkin(entity, skinName) {
      if (skinName in this.skins) {
        // Assuming entity has a mesh with a material (adjust for your engine)
        entity.mesh.material.map = this.skins[skinName];
        console.log(`Applied skin ${skinName} to ${entity.name}`);
      } else {
        console.error(`Skin ${skinName} not found.`);
      }
    }
  }