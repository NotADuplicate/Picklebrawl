import { Quirk } from './quirk.js';

export class CultLeader extends Quirk {
    static POWER_MODIFIER = -4;
    static title = "Cult Leader";
    static description = ("+2X to all stats where X is the number of teammates that share the most common religion on your team.");
    static likelihood = 1;
    static APPEARS_IN_GENERATION = true;
    static APPEARS_IN_DRAFT = true;
    static START_EFFECT_ORDER = 2;

    static startGameEffect(match, player) {
        let starworshipperCount = 0;
        let moonworshipperCount = 0;
        let sunworshipperCount = 0;
        for (const otherPlayer of match.players) {
            if (otherPlayer.team === player.team) {
                if (otherPlayer.quirk.title === "Star Worshipper") {
                    starworshipperCount++;
                } else if (otherPlayer.quirk.title === "Moon Worshipper") {
                    moonworshipperCount++;
                } else if (otherPlayer.quirk.title === "Sun Worshipper") {
                    sunworshipperCount++;
                }
            }
        }
        const bonus = 2*Math.max(starworshipperCount, moonworshipperCount, sunworshipperCount);
        player.baseFinesse += bonus;
        player.baseBulk += bonus;
        player.baseHeight += bonus;
        player.baseStrength += bonus;
        player.baseTrickiness += bonus;
        player.baseFocus += bonus;
    }

    static challengeStatModification(players, player) {
        let starworshipperCount = 0;
        let moonworshipperCount = 0;
        let sunworshipperCount = 0;
        for (const otherPlayer of players) {
            if (otherPlayer.team === player.team) {
                if (otherPlayer.quirk.title === "Star Worshipper") {
                    starworshipperCount++;
                } else if (otherPlayer.quirk.title === "Moon Worshipper") {
                    moonworshipperCount++;
                } else if (otherPlayer.quirk.title === "Sun Worshipper") {
                    sunworshipperCount++;
                }
            }
        }
        const bonus = 2*Math.max(starworshipperCount, moonworshipperCount, sunworshipperCount);
        player.finesse += bonus;
        player.bulk += bonus;
        player.height += bonus;
        player.strength += bonus;
        player.trickiness += bonus;
        player.focus += bonus;
    }
}