// TimeSystem.js
export class TimeSystem {
    constructor() {
        this.day = 0;           // Current day
        this.time = 0;          // Time of day (0 to 24 hours)
        this.timeScale = 600;   // 1 real second = 1 game minute
    }

    static getInstance() {
        if (!TimeSystem.instance) {
            TimeSystem.instance = new TimeSystem();
        }
        return TimeSystem.instance;
    }

    update(deltaTime) {
        this.time += deltaTime * this.timeScale / 3600; // Convert seconds to hours
        if (this.time >= 24) {
            this.time -= 24;
            this.day += 1;      // Advance to next day
        }
    }

    getTimeOfDay() {
        return this.time;
    }

    getDay() {
        return this.day;
    }
}

// Initialize the singleton at module load time (start of game)
export const timeSystem = TimeSystem.getInstance();