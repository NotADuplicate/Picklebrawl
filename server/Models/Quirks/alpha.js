import { Quirk } from './quirk.js';

export class Alpha extends Quirk {
    title = "Alpha";
    description = ("The player gets a stat boost if their name is first alphabetically on their team");
    POWER_MODIFIER = -1;
    STAT_CHANGE = 1

    startGameStatModification(match, player) {
        let isAlpha = true;
        // First, figure out which team they're on, so we know who to compare them to
        if(player in match.homeTeam.players) {
            // Compare to home team players
            for(const otherPlayer of match.homeTeam.players) {
                if(otherPlayer.name < player.name) {
                    isAlpha = False;
                }
            }
        }
        else {
            // Compare to away team players
            for(const otherPlayer of match.awayTeam.players) {
                if(otherPlayer.name < player.name) {
                    isAlpha = False;
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

    challengeStatModification(players, player) {
        let isAlpha = true;
        // Compare to home team players
        for(const otherPlayer of players) {
            console.log("OTHER PLAYER NAME: " + otherPlayer.name)
            if(otherPlayer.name < player.name) {
                console.log("NOT ALPHA")
                isAlpha = false;
            }
        }

        // If isAlpha, change the stats
        if(isAlpha) {
            console.log("IS ALPHA")
            player.bulk += this.STAT_CHANGE;
            player.finesse += this.STAT_CHANGE;
            player.height += this.STAT_CHANGE;
            player.strength += this.STAT_CHANGE;
        }
        return true;
    }
}