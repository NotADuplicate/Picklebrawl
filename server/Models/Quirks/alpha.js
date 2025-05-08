import { Quirk } from './quirk.js';

export class Alpha extends Quirk {
    static title = "Alpha";
    static description = ("+Sorcery to physical stats if their name is first alphabetically on their team");
    static POWER_MODIFIER = -5;
    static likelihood = 4;
    static APPEARS_IN_GENERATION = true;
    static APPEARS_IN_DRAFT = true;
    static START_EFFECT_ORDER = 2;

    static startGameEffect(match, player, sorcery) {
        let isAlpha = true;
        // First, figure out which team they're on, so we know who to compare them to
        for(const otherPlayer of match.players) {
            if(otherPlayer.name < player.name && otherPlayer.team === player.team) {
                isAlpha = false;
            }
        }

        // If isAlpha, change the stats
        if(isAlpha) {
            player.baseBulk += sorcery;
            player.baseFinesse += sorcery;
            player.baseHeight += sorcery;
            player.baseStrength += sorcery;
        }
    }

    static challengeStatModification(players, player, sorcery) {
        let isAlpha = true;
        // Compare to home team players
        for(const otherPlayer of players) {
            if(otherPlayer.name < player.name && otherPlayer.team === player.team) {
                isAlpha = false;
            }
        }

        // If isAlpha, change the stats
        if(isAlpha) {
            player.bulk += sorcery;
            player.finesse += sorcery;
            player.height += sorcery;
            player.strength += sorcery;
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

    static getLikelihood(season, quirkList) {
        return this.likelihood / (quirkList[this.title] ? quirkList[this.title]+1 : 1);
    }
}