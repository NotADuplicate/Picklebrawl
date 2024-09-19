import { Weather } from './weather.js';

export class Speedlimit extends Weather {
    name = "Speed limit";
    description = "You can't advance more than 10m per tick";

    startGameEffect(match, offenseTeam, defenseTeam) {
        console.log("SPEED LIMIT: MAX_ADVANCEMENT_PER_TICK set to 10")
        match.MAX_ADVANCEMENT_PER_TICK = 10
    }
}