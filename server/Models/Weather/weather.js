import {Player} from '../player.js';
import {Team} from '../team.js';
export class Weather {
    description = "No weather effect";
    name = "No name";

    startGameEffect(match, offenseTeam, defenseTeam) {
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

    attackEffect(player, target) {
        return null;
    }

    describe() {
        return this.description;
    }
}