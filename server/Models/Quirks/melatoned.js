import { Quirk } from './quirk.js';

export class Meltoned extends Quirk {
    static POWER_MODIFIER = -3;
    static title = "Melatoned";
    static description = ("Gets double the effect from resting");
    static likelihood = 3;
    static APPEARS_IN_GENERATION = true;
    static APPEARS_IN_DRAFT = true;
    static START_EFFECT_ORDER = 3;

    static startGameEffect(match, player) {
        if(player.offensePriority == "Rest") {
            player.baseBulk *= 1.5;
            player.baseFinesse *= 1.5;
            player.baseHeight *= 1.5;
            player.baseStrength *= 1.5;
        }
        if(player.defensePriority == "Rest") {
            player.baseBulk *= 1.5;
            player.baseFinesse *= 1.5;
            player.baseHeight *= 1.5;
            player.baseStrength *= 1.5;
        }
    }
}