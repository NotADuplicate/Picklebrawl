import { Weather } from './weather.js';

export class Snowy extends Weather {
    description = "Advancing is more difficult, chance for turnover slightly higher";

    startGameEffect(match, offenseTeam, defenseTeam) {
        console.log("SNOWY: NET_ADVANCEMENT_MODIFIER set to 0.8, TURNOVER_CHANCE_INCREASE_PER_TICK "
            + "set to 0.06, TURNOVER_CHANCE_MAX set to 0.25"
        )
        match.NET_ADVANCEMENT_MODIFIER = 0.8;
        match.TURNOVER_CHANCE_INCREASE_PER_TICK = 0.06;
        match.TURNOVER_CHANCE_MAX = 0.25;
    }
}