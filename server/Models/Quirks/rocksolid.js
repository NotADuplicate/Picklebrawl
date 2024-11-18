import { Quirk } from './quirk.js';

export class RockSolid extends Quirk {
    static likelihood = 3; //3
    static POWER_MODIFIER = -1;
    static title = "Rock Solid";
    static description = ("Cannot be tricked");
    static APPEARS_IN_GENERATION = true;
    static APPEARS_IN_DRAFT = true;

    static playerStatGenerationChanges(player, power) {
        console.log("Rock Solid playerStatGenerationChanges\n");
        player.bulk += Math.floor(power / 5);
        player.focus = 0;
        player.trickiness = 0;        
        return;
    }

    static beTrickedEffect(player, tricker, match) {
        return false;
    }
}