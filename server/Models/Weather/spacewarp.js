import { Weather } from './weather.js';

export class Spacewarp extends Weather {
    description = "The field becomes 150% as long";

    startGameEffect(match, offenseTeam, defenseTeam) {
        console.log("SPACEWARP: FIELD_LENGTH set to 150");
        match.FIELD_LENGTH = 150;
        match.possession = 75;
    }
}