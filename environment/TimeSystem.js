export class TimeSystem {
    constructor() {
        this.day = 0;           // Current day
        this.time = 0;          // Time of day (0 to 24 hours)
        this.timeScale = 60;    // 1 real second = 1 game minute
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