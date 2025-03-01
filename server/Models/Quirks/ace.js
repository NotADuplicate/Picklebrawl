import { Quirk } from './quirk.js';

export class Ace extends Quirk {
    static POWER_MODIFIER = -3;
    static title = "Ace";
    static description = ("Has +2 Finesse when scoring");
    static likelihood = 4;
    static APPEARS_IN_GENERATION = true;
    static APPEARS_IN_DRAFT = true;
    static START_EFFECT_ORDER = 3;

    static startGameEffect(match, player) {
        player.PLAYER_SHOOTING_BONUS = 2;
    }
}