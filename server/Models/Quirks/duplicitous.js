import { Quirk } from './quirk.js';

export class Duplicitous extends Quirk {
    static POWER_MODIFIER = -2;
    static title = "Duplicitous";
    static description = ("Your chance to trick players is doubled");
    static likelihood = 6;
    static APPEARS_IN_GENERATION = true;
    static APPEARS_IN_DRAFT = true;

    static trickEffect(player, target, match) {
        if(player.trickiness > target.focus) {
            return Math.random() < match.TRICK_CHANCE*2;
        }
        return false;
    }
}