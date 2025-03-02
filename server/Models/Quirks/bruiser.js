import { Quirk } from './quirk.js';

export class Bruiser extends Quirk {
    static likelihood = 3;
    static POWER_MODIFIER = -3;
    static title = "Bruiser";
    static description = ("Attacks deal twice as much hp damage");
    static APPEARS_IN_GENERATION = true;
    static APPEARS_IN_DRAFT = true;

    static startGameEffect(match, player) {
        player.ATTACK_MODIFIER = 2;
    }
}