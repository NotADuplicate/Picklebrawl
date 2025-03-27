import { Quirk } from './quirk.js';

export class Duplicitous extends Quirk {
    static POWER_MODIFIER = -2;
    static title = "Duplicitous";
    static description = ("Has 1.5 times the chance to trick players (base 50% instead of 33%).");
    static likelihood = 6;
    static APPEARS_IN_GENERATION = true;
    static APPEARS_IN_DRAFT = true;

    static trickEffect(player, target, match) {
        if(player.intelligence > target.intelligence) {
            return Math.random() < 1.5*match.TRICK_CHANCE*(player.intelligence - target.intelligence);
        }
        return false;
    }

    static playerStatGenerationChanges(player, power) {
        player.intelligence = Math.max(player.intelligence, 2);
        return;
    }
}