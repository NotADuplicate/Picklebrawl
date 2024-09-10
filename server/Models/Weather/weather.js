import {Player} from '../player.js';
import {Team} from '../team.js';
export class Weather {
    description = "No weather effect";

    startGameEffect(offenseTeam, defenseTeam) {
        console.log("No weather effect\n\n\n");
        return;
    }

    tickEffect(offenseTeam, defenseTeam) {
        return;
    }

    advanceEffect(offenseTeam, defenseTeam, position) {
        return null;
    }

    scoreEffect(shooter, offenseTeam, defenseTeam, position) {
        return null;
    }

    describe() {
        return this.description;
    }
}