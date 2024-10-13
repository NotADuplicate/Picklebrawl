import { Quirk } from './quirk.js';

export class Tenacious extends Quirk {
    static POWER_MODIFIER = -2;
    static title = "Tenacious";
    static description = ("When guarding a player with a lower trickiness than your focus, attack them");
    static likelihood = 5;
    static APPEARS_IN_GENERATION = true;
    static APPEARS_IN_DRAFT = true;

    static beTrickedEffect(player, tricker, match) {
        if (player.focus > tricker.trickiness) {
            player.attack(tricker, match);
        }
        return true;
    }
}