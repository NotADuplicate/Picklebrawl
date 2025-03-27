import { Quirk } from './quirk.js';

export class PackAnimal extends Quirk {
    static POWER_MODIFIER = -3;
    static title = "Pack Animal";
    static description = ("+1 to all stats for every teammate that has this quirk");
    static likelihood = 8;
    static APPEARS_IN_GENERATION = true;
    static APPEARS_IN_DRAFT = true;
    static START_EFFECT_ORDER = 2;

    static startGameEffect(match, player) {
        let teammatesWithQuirk = 0;
        for (const otherPlayer of match.players) {
            if (otherPlayer.quirk.title === "Pack Animal"  && otherPlayer !== player && otherPlayer.team === player.team) {
                teammatesWithQuirk++;
            }
        }
        player.baseFinesse += teammatesWithQuirk;
        player.baseBulk += teammatesWithQuirk;
        player.baseHeight += teammatesWithQuirk;
        player.baseStrength += teammatesWithQuirk;
        player.baseIntelligence += teammatesWithQuirk;
        player.baseCardio += teammatesWithQuirk;
    }

    static challengeStatModification(players, player) {
        let teammatesWithQuirk = 0;
        for (const otherPlayer of players) {
            if (otherPlayer.quirk.title === "Pack Animal" && otherPlayer !== player && otherPlayer.team === player.team) {
                teammatesWithQuirk++;
            }
        }
        player.finesse += teammatesWithQuirk;
        player.bulk += teammatesWithQuirk;
        player.height += teammatesWithQuirk;
        player.strength += teammatesWithQuirk;
        player.intelligence += teammatesWithQuirk;
        player.cardio += teammatesWithQuirk;
    }
}