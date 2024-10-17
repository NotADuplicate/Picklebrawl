import { Quirk } from './quirk.js';

export class AlliterationAddict extends Quirk {
    static POWER_MODIFIER = -2;
    static title = "Alliteration Addict";
    static description = ("+1 to all stats for every teammate with the same first letter in their name");
    static likelihood = 5;
    static APPEARS_IN_GENERATION = true;
    static APPEARS_IN_DRAFT = true;
    static START_EFFECT_ORDER = 2;

    static startGameEffect(match, player) {
        let count = 0; 
        const firstLetter = player.name.charAt(0).toLowerCase();
        for (const otherPlayer of match.players) {
            if (otherPlayer.name.charAt(0).toLowerCase() === firstLetter && otherPlayer.team === player.team) {
                count++;
            }
        }
        player.baseBulk += count;
        player.baseFinesse += count;
        player.baseHeight += count;
        player.baseStrength += count
    }

    static challengeStatModification(players, player) {
        let count = 0; 
        const firstLetter = player.name.charAt(0).toLowerCase();
        for (const otherPlayer of players) {
            if (otherPlayer.name.charAt(0).toLowerCase() === firstLetter && otherPlayer.team === player.team) {
                count++;
            }
        }
        player.bulk += count;
        player.finesse += count;
        player.height += count;
        player.strength += count;
        return true;
    }
}