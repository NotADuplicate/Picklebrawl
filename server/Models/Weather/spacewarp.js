import { Weather } from './weather.js';

export class Spacewarp extends Weather {
    description = "The field becomes 150% as long";

    startGameEffect(match, offenseTeam, defenseTeam) {
        console.log("SPACEWARP\n\n\n");
        match.fieldLength = 150;
        match.possession = 75;
        return 1; //1 for success
    }
}