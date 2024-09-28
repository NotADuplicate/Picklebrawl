import { Quirk } from './quirk.js';

export class AlliterationAddict extends Quirk {
    static title = "Alliteration Addict";
    static description = ("The minimum of your stats is set to 1 + the number of players in the game with the same first letter to their name");
    static likelihood = 5;
    static APPEARS_IN_GENERATION = true;
    static APPEARS_IN_DRAFT = true;

    static startGameStatModification(match, player) {
        let count = 0; 
        const firstLetter = player.name.charAt(0).toLowerCase();
        for (const otherPlayer of match.players) {
            if (otherPlayer.name.charAt(0).toLowerCase() === firstLetter) {
                count++;
            }
        }
        player.baseBulk = Math.max(player.bulk, count);
        player.baseFinesse = Math.max(player.finesse, count); 
        player.baseHeight = Math.max(player.height, count);
        player.baseStrength = Math.max(player.strength, count);
    }

    static challengeStatModification(players, player) {
        let count = 0; 
        const firstLetter = player.name.charAt(0).toLowerCase();
        for (const otherPlayer of players) {
            if (otherPlayer.name.charAt(0).toLowerCase() === firstLetter) {
                count++;
            }
        }
        player.bulk = Math.max(player.bulk, count);
        player.finesse = Math.max(player.finesse, count); 
        player.height = Math.max(player.height, count);
        player.strength = Math.max(player.strength, count);
        return true;
    }
}