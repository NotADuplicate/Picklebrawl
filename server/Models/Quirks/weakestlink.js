import { Quirk } from './quirk.js';

export class WeakestLink extends Quirk {
    static powerModifier = -4;
    static likelihood = 2;
    static title = "Weakest Link";
    static description = ("Each of your stats are added with the lowest of that stat on your team");
    static APPEARS_IN_GENERATION = true;
    static APPEARS_IN_DRAFT = true;
    static START_EFFECT_ORDER = 5;

    static playerStatGenerationChanges(player, power) {
        player.baseFinesse = Math.round(player.baseFinesse / 2);
        player.baseStrength = Math.round(player.baseStrength / 2);
        player.baseTrickiness = Math.round(player.baseTrickiness / 2);
        player.baseFocus = Math.round(player.baseFocus / 2);
        player.baseHeight = Math.round(player.baseHeight / 2);
        player.baseBulk = Math.round(player.baseBulk / 2);
    }

    static startGameEffect(match, player) {
        let lowestFinesse = 5;
        let lowestStrength = 5;
        let lowestTrickiness = 5;
        let lowestFocus = 5;
        let lowestHeight = 5;
        let lowestBulk = 5;
        if(player in match.homeTeam.players) {
            // Compare to home team players
            for(const otherPlayer of match.players) {
                if(otherPlayer !== player && otherPlayer.team == player.team) {
                    lowestFinesse = Math.min(lowestFinesse, otherPlayer.finesse);
                    lowestStrength = Math.min(lowestStrength, otherPlayer.strength);
                    lowestTrickiness = Math.min(lowestTrickiness, otherPlayer.trickiness);
                    lowestFocus = Math.min(lowestFocus, otherPlayer.focus);
                    lowestHeight = Math.min(lowestHeight, otherPlayer.height);
                    lowestBulk = Math.min(lowestBulk, otherPlayer.bulk);
                }
            }
        }
        player.baseFiness += lowestFinesse;
        player.baseStrength += lowestStrength;
        player.baseTrickiness += lowestTrickiness;
        player.baseFocus += lowestFocus;
        player.baseHeight += lowestHeight;
        player.baseBulk += lowestBulk;
    }

    static challengeStatModification(players, player) {
        console.log("Weakest Link Challenge Stat Modification");
        let lowestFinesse = 5;
        let lowestStrength = 5;
        let lowestTrickiness = 5;
        let lowestFocus = 5;
        let lowestHeight = 5;
        let lowestBulk = 5;
        for(const otherPlayer of players) {
            if(otherPlayer !== player && otherPlayer.team == player.team) {
                lowestFinesse = Math.min(lowestFinesse, otherPlayer.finesse);
                lowestStrength = Math.min(lowestStrength, otherPlayer.strength);
                lowestTrickiness = Math.min(lowestTrickiness, otherPlayer.trickiness);
                lowestFocus = Math.min(lowestFocus, otherPlayer.focus);
                lowestHeight = Math.min(lowestHeight, otherPlayer.height);
                lowestBulk = Math.min(lowestBulk, otherPlayer.bulk);
            }
        }
        player.finesse += lowestFinesse;
        player.strength += lowestStrength;
        player.trickiness += lowestTrickiness;
        player.focus += lowestFocus;
        player.height += lowestHeight;
        player.bulk += lowestBulk;
        return true;
    }
}