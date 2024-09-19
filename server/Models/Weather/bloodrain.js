import { Weather } from './weather.js';

export class Bloodrain extends Weather {
    name = "Bloodrain";
    description = "Violence is increased: injuries are more likely to be permanent";

    // TODO: once quirks are added, make it secretly power up vampires

    startGameEffect(match, offenseTeam, defenseTeam) {
        console.log("BLOOD RAIN: INJURY_PERMANENCE_MODIFIER set to 1.5")
        match.INJURY_PERMANENCE_MODIFIER = 1.5;
    }
}