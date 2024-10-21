import { Quirk } from './quirk.js';

export class Helpful extends Quirk {
    static POWER_MODIFIER = -4;
    static title = "Helpful";
    static description = ("Twice as good at assisting");
    static likelihood = 4;
    static APPEARS_IN_GENERATION = true;
    static APPEARS_IN_DRAFT = true;
    static START_EFFECT_ORDER = 3;

    static startGameEffect(match, player) {
        player.PLAYER_ASSIST_MODIFIER = 1.5;
    }
}