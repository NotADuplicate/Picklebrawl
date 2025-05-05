import { Quirk } from './quirk.js';

export class Scorcerer extends Quirk {
    static POWER_MODIFIER = -5;
    static title = "Scorcerer";
    static description = ("When scoring a field goal, it is worth sorcery points instead of 2 points.");
    static likelihood = 8;
    static APPEARS_IN_GENERATION = true;
    static APPEARS_IN_DRAFT = true;
    static START_EFFECT_ORDER = 3;

    static startGameEffect(match, player, sorcery) {
        player.shotWorth = sorcery;
    }
}