import { Quirk } from './quirk.js';

export class Alpha extends Quirk {
    static title = "Alpha";
    static description = ("+2 to physical stats if their name is first alphabetically on their team");
    static POWER_MODIFIER = -5;
    static STAT_CHANGE = 2
    static likelihood = 4;
    static APPEARS_IN_GENERATION = true;
    static APPEARS_IN_DRAFT = true;
    static START_EFFECT_ORDER = 2;

    static startGameEffect(match, player) {
        let isAlpha = true;
        // First, figure out which team they're on, so we know who to compare them to
        for(const otherPlayer of match.players) {
            if(otherPlayer.name < player.name && otherPlayer.team === player.team) {
                isAlpha = false;
            }
        }

        // If isAlpha, change the stats
        if(isAlpha) {
            player.baseBulk += this.STAT_CHANGE;
            player.baseFinesse += this.STAT_CHANGE;
            player.baseHeight += this.STAT_CHANGE;
            player.baseStrength += this.STAT_CHANGE;
        }
    }

    static challengeStatModification(players, player) {
        let isAlpha = true;
        // Compare to home team players
        for(const otherPlayer of players) {
            if(otherPlayer.name < player.name && otherPlayer.team === player.team) {
                isAlpha = false;
            }
        }

        // If isAlpha, change the stats
        if(isAlpha) {
            player.bulk += this.STAT_CHANGE;
            player.finesse += this.STAT_CHANGE;
            player.height += this.STAT_CHANGE;
            player.strength += this.STAT_CHANGE;
        }
        return true;
    }

    static nameGenerationChanges(player) {
        let tries = 5;
        while((player.name <= 'C' || player.name >= 'N') && tries > 0) {
            player.name = player.generateName();
            console.log("Alpha generated name: ", player.name);
            tries--;
        }
        if(tries === 0) {
            console.log("Alpha nameGenerationChanges failed to generate a name in 5 tries");
        }
        return;
    }
}