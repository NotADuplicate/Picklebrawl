import { Quirk } from './quirk.js';

export class Alpha extends Quirk {
    static title = "Alpha";
    static description = ("The player gets a stat boost if their name is first alphabetically on their team");
    static POWER_MODIFIER = -2;
    static STAT_CHANGE = 2
    static likelihood = 6
    static APPEARS_IN_GENERATION = true;
    static APPEARS_IN_DRAFT = true;
    static START_EFFECT_ORDER = 2;

    static startGameEffect(match, player) {
        let isAlpha = true;
        // First, figure out which team they're on, so we know who to compare them to
        if(player in match.homeTeam.players) {
            // Compare to home team players
            for(const otherPlayer of match.homeTeam.players) {
                if(otherPlayer.name < player.name) {
                    isAlpha = false;
                }
            }
        }
        else {
            // Compare to away team players
            for(const otherPlayer of match.awayTeam.players) {
                if(otherPlayer.name < player.name) {
                    isAlpha = false;
                }
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
            if(otherPlayer.name < player.name) {
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
}