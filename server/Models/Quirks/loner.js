import { Quirk } from './quirk.js';

export class Loner extends Quirk {
    static POWER_MODIFIER = -3;
    static title = "Loner";
    static description = ("+2 to all stats for every player less than 4 you have on your team");
    static likelihood = 2;
    static APPEARS_IN_GENERATION = false;
    static APPEARS_IN_DRAFT = true;
    static START_EFFECT_ORDER = 1;

    static startGameEffect(match, player) {
        let bonus = 8;
        for (const otherPlayer of match.players) {
            if (otherPlayer.team === player.team) {
                bonus-=2
            }
        }
        player.baseFinesse += bonus;
        player.baseBulk += bonus;
        player.baseHeight += bonus;
        player.baseStrength += bonus;
        player.baseTrickiness += bonus;
        player.baseFocus += bonus;
    }

    static challengeStatModification(players, player) {
        let bonus = 8;
        for (const otherPlayer of players) {
            if (otherPlayer.team === player.team) {
                bonus-=2;
            }
        }
        player.finesse += bonus;
        player.bulk += bonus;
        player.height += bonus;
        player.strength += bonus;
        player.trickiness += bonus;
        player.focus += bonus;
    }
}