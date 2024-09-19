import { Weather } from './weather.js';

export class Windy extends Weather {
    name = "Windy";
    description = "Scoring is more difficult from range";

    startGameEffect(match, offenseTeam, defenseTeam) {
        console.log("WINDY: SHOOTING_DISTANCE_MODIFIER set to 0.3")
        match.SHOOTING_DISTANCE_MODIFIER = 0.3
    }
}