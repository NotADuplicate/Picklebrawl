import { Quirk } from './quirk.js';

export class Duplicitous extends Quirk {
    static POWER_MODIFIER = -2;
    static title = "Duplicitous";
    static description = ("Has 1.5 times the chance to trick players (base 50% instead of 33%).");
    static likelihood = 6;
    static APPEARS_IN_GENERATION = true;
    static APPEARS_IN_DRAFT = true;

    static trickEffect(player, target, match) {
        if(player.trickiness > target.focus) {
            return Math.random() < match.TRICK_CHANCE*1.5;
        }
        return false;
    }

    static playerStatGenerationChanges(player, power) {
        player.trickiness = Math.max(player.trickiness, 2);
        return;
    }
}