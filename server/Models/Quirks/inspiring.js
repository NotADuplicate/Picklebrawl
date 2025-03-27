import { Quirk } from './quirk.js';

export class Inspiring extends Quirk {
    static POWER_MODIFIER = -1;
    static title = "Inspiring";
    static description = ("All boring players in the match get +1 to all stats");
    static likelihood = 2;
    static APPEARS_IN_GENERATION = false;
    static APPEARS_IN_DRAFT = true;
    static START_EFFECT_ORDER = 3;

    static startGameEffect(match, player) {
        const bonus = 1;
        for (const otherPlayer of match.players) {
            if (otherPlayer.quirk.title == "Boring") {
                otherPlayer.baseFinesse += bonus;
                otherPlayer.baseBulk += bonus;
                otherPlayer.baseHeight += bonus;
                otherPlayer.baseStrength += bonus;
                otherPlayer.baseIntelligence += bonus;
                otherPlayer.baseCardio += bonus;
            }
        }
    }

    static challengeStatModification(players, player) {
        const bonus = 1;
        for (const otherPlayer of players) {
            if (otherPlayer.quirk.title == "Boring") {
                otherPlayer.finesse += bonus
                otherPlayer.bulk += bonus
                otherPlayer.height += bonus
                otherPlayer.strength += bonus
                otherPlayer.intelligence += bonus
                otherPlayer.cardio += bonus
            }
        }
    }
}