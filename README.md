# Maxion
![Maxion Banner](path/to/banner.png)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

## Table of Contents
- [Overview](#overview)
- [Project Structure](#project-structure)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Development](#development)
- [License](#license)
- [Future Improvements](#future-improvements)

## Overview
Welcome to **Maxion**, an immersive 3D Medieval RPG game crafted with JavaScript and the Three.js library (version 0.128.0). Set in a richly detailed medieval-inspired open world, Maxion offers procedurally generated terrains across diverse biomes (summer, autumn, spring, winter). Players can explore, engage with NPCs, undertake quests, craft items, and manage inventories, all enhanced by a medieval-themed user interface featuring parchment textures, dynamic audio, and a day-night cycle. The game is designed as an evolving experience, with short-term enhancements and a visionary long-term roadmap culminating in an expansive, procedurally generated universe.

## Project Structure
The project is organized into modular directories and files, each dedicated to specific game components:

- **`.vscode`**: Configuration files for Visual Studio Code.
- **`data`**: JSON files storing game data:
  - `quests.json`: Defines quest structures, including types, prerequisites, and rewards.
  - `items.json`: Contains item definitions (inferred from `items.js`).
  - `recipes.json`: Specifies crafting recipes (inferred from `items.js`).
- **`entity`**: JavaScript files managing game entities:
  - `animation.js`: Handles player animations (partially implemented).
  - `character.js`: Base class for character entities (assumed dependency).
  - `entity.js`: General entity logic (assumed dependency).
  - `npc.js`: Implements NPC behaviors, including enemies and quest givers.
  - `player.js`: Manages player mechanics, inventory, skills, and stats.
- **`environment`**: Controls the game world:
  - **`doodads`**: Environmental object classes:
    - `base-doodad.js`: Base doodad class (assumed).
    - `land-doodads.js`: Land-based objects (e.g., trees, rocks).
    - `special-doodads.js`: Special objects (e.g., chests, portals).
    - `water-doodads.js`: Water-based objects (e.g., coral, seaweed).
  - `CloudSystem.js`: Manages cloud rendering and movement.
  - `environment-object.js`: Base class for environmental objects (assumed).
  - `environment.js`: Core logic for map loading and world management.
  - `map.js`: Handles minimap rendering and terrain caching.
  - `scene.js`: Sets up the Three.js scene.
  - `SkySystem.js`: Oversees sky and weather systems.
  - `sound-manager.js`: Manages audio playback.
  - `terrain.js`: Generates procedural terrain.
  - `TimeSystem.js`: Implements the day-night cycle.
  - `water.js`: Controls water system dynamics.
- **`maps`**: JSON files defining map data (e.g., `summer.json`).
- **`sounds`**: Audio assets:
  - `level_up.wav`: Sound effect for leveling up.
  - `swordhit1.wav`: Sound effect for attacks.
- **`game.js`**: Contains the main game loop and initialization logic.
- **`index.html`**: Main HTML file with embedded CSS and UI layout.
- **`input.js`**: Manages user input and camera controls.
- **`items.js`**: Implements item and crafting system logic.
- **`LICENSE`**: Project license file (assumed; update with specific license details).
- **`parchment-texture-fill.jpg`, `parchment-texture.png`**: Texture assets for UI elements.
- **`character-icon.png`**: Icon for the character button.
- **`ui.js`**: Manages UI updates and interactions (assumed dependency).
- **`quests.js`**: Handles quest system logic.
- **`settings.js`**: Stores game settings (assumed dependency in `npc.js`).

## Features
- **Dynamic 3D Environment**: Procedurally generated terrains with diverse biomes and interactive doodads (e.g., trees, chests).
- **Player System**: Includes leveling, customizable stats (strength, agility, intelligence), skills (Power Attack, Fireball, Invisibility), and inventory/bag management.
- **NPCs**: Features enemies with AI and quest-giving NPCs with dialogue interactions.
- **Quest System**: Supports talk, collect, defeat, and boss quests with prerequisites and rewards (e.g., recipes, XP).
- **Crafting**: Enables tiered item crafting (e.g., Wooden to Eternium) and potion creation.
- **UI**: Offers a medieval-themed interface with health/mana/XP bars, action bar, inventory, minimap, and popups.
- **Audio**: Incorporates dynamic background music and event-triggered sounds (e.g., sword hits, level-up).
- **Camera Control**: Provides adjustable distance and pitch with mouse-driven right/left-click modes.

## Installation
1. run with http-server in clone directory
2.  Open chrome in http://localhost:8080 or whichever port you use.

## Usage
### Gameplay Controls
- **Movement**: `W` (forward), `A` (left), `S` (back), `D` (right), `Q` (rotate left), `E` (rotate right), `Space` (jump/swim up), `Shift` (sprint).
- **Interaction**: `X` to interact with NPCs or doodads.
- **UI Panels**:
  - `I`: Open inventory.
  - `P`: View equipped items.
  - `U`: Access quests.
  - `K`: Display stats.
  - `M`: Toggle minimap size.
- **Action Bar**: Use `1-6` to activate assigned skills or items.
- **Targeting**: Right-click to lock camera and select enemies, left-click to interact or select, `Tab` to cycle enemies, `Esc` to deselect.
- **Camera**: Adjust distance with the mouse wheel, switch views with right-click (body-facing) or left-click (head-facing).

## Development
- **Dependencies**: Relies on Three.js (v0.128.0) via CDN.
- **Contributing**: Fork the repository, create a feature branch, and submit a pull request with detailed descriptions of changes.
- **Testing**: Verify compatibility in Chrome and Firefox, focusing on WebGL and audio performance.

## License
This project is licensed under the terms specified in the `LICENSE` file (assumed MIT or similar; please specify the exact license).

## Future Improvements
### Short-Term Goals
- Implement multiplayer functionality to enable cooperative or competitive play.
- Enhance graphics with shaders and particle effects for improved visual fidelity.
- Add save/load functionality to preserve player progress.
- Refactor `sounds`, `shaders`, and `graphics` into dedicated JavaScript classes for better organization.
- Expand quests, NPC interactions, and biome diversity.

### Long-Term Vision (Expansion Packs)
Maxion is envisioned as an evolving universe with "Epic" expansions, each unlocking new dimensions of gameplay. Unique aspects of each epic include:

- **Epic 1**: Player as a cube, limited to basic movement and Power Attack, with 3 biomes, 2 action bar slots, 5 bag slots, simple shapes for doodads, and introductory crafting/harvesting.
- **Epic 2**: Introduces limbs, spells (Invisibility, Fireball) tied to quest completion (e.g., physical resist NPCs, dungeon escapes), 4 biomes, 5 action bar slots, 10 bag slots, grouped doodad meshes, jumping, sprinting, and advanced NPC behaviors.
- **Epic 3**: Adds skins for player and doodads, sprites for environment (e.g., grass), increased Level of Detail (LoD) for meshes, double-jump flight (quest-earned), space travel with suffocation, spherical map realization, and LLM-based NPC interactions for secret quests.
- **Epic 4**: Enables multiplayer, visible advanced players in earlier epics, space flight without suffocation with logarithmic speed, lethal celestial entries, planet portals unlocked, and LLM-style NPC players.
- **Epic 5**: Offers another logarithmic speed boost for inter-solar-system travel, doodad building on home systems, trading with vendors, currency introduction, and item degeneration for traded goods.
- **Epic 6**: Unlocks non-player celestials and solar systems.
- **Epic 7**: Expands to additional non-player celestials and solar systems.

### General Rules for Epic Iterations
Each epic builds on the previous one, introducing shared advancements to deepen the player's cosmic journey:

- Unlocks new spells, quests, biomes, planets, or celestial bodies.
- Increases stat complexity (e.g., adding endurance, charisma) and management options.
- Enhances movement speed or mechanics (e.g., sprinting, flight, logarithmic travel).
- Expands inventory capacity and action bar slots.
- Improves graphical fidelity with higher LoD, skins, or environmental sprites.
- Introduces new settings and customization options (e.g., graphics presets, controls).
- Advances NPC intelligence (e.g., basic AI to LLM interactions).
- Resets progress at the start of a new epic while retaining earned abilities, encouraging replayability with escalating challenges.

