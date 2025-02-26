import { Quirk } from './quirk.js';

export class Sexy extends Quirk {
    static POWER_MODIFIER = -3;
    static title = "Sexy";
    static description = ("All opponents get -1 FOCUS");
    static likelihood = 4;
    static APPEARS_IN_GENERATION = true;
    static APPEARS_IN_DRAFT = true;
    static START_EFFECT_ORDER = 3;

    static challengeStatModification(players, player) {
        players.forEach((otherPlayer) => {
            if (otherPlayer.team !== player.team && otherPlayer.quirk.title !== "Ace") {
                otherPlayer.focus -= 1;
            }
        });
    }

    static startGameEffect(match, player) {
        match.players.forEach((otherPlayer) => {
            if (otherPlayer.team !== player.team && otherPlayer.quirk.title !== "Ace") {
                otherPlayer.focus -= 1;
            }
        });
    }
}