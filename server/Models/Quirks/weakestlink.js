import { Quirk } from './quirk.js';

export class WeakestLink extends Quirk {
    static POWER_MODIFIER = -4;
    static likelihood = 2;
    static title = "Weakest Link";
    static description = ("Each of your stats are added with the lowest of that stat on your team");
    static APPEARS_IN_GENERATION = true;
    static APPEARS_IN_DRAFT = true;
    static START_EFFECT_ORDER = 5;

    static playerStatGenerationChanges(player, power) {
        player.finesse = Math.round(player.finesse / 2);
        player.strength = Math.round(player.strength / 2);
        player.trickiness = Math.round(player.trickiness / 2);
        player.focus = Math.round(player.focus / 2);
        player.height = Math.round(player.height / 2);
        player.bulk = Math.round(player.bulk / 2);
    }

    static startGameEffect(match, player) {
        let lowestFinesse = 10;
        let lowestStrength = 10;
        let lowestTrickiness = 10;
        let lowestFocus = 10;
        let lowestHeight = 10;
        let lowestBulk = 10;
        let onlyPlayer = true;
        // Compare to same team players
        for(const otherPlayer of match.players) {
            if(otherPlayer !== player && otherPlayer.team == player.team) {
                onlyPlayer = false;
                lowestFinesse = Math.min(lowestFinesse, otherPlayer.baseFinesse);
                lowestStrength = Math.min(lowestStrength, otherPlayer.baseStrength);
                lowestTrickiness = Math.min(lowestTrickiness, otherPlayer.baseTrickiness);
                lowestFocus = Math.min(lowestFocus, otherPlayer.baseFocus);
                lowestHeight = Math.min(lowestHeight, otherPlayer.baseHeight);
                lowestBulk = Math.min(lowestBulk, otherPlayer.baseBulk);
            }
        }
        if(!onlyPlayer) {
            console.log("Lowest Stats:", {
                finesse: lowestFinesse,
                strength: lowestStrength,
                trickiness: lowestTrickiness,
                focus: lowestFocus,
                height: lowestHeight,
                bulk: lowestBulk
            });
            player.baseFiness += lowestFinesse;
            player.baseStrength += lowestStrength;
            player.baseTrickiness += lowestTrickiness;
            player.baseFocus += lowestFocus;
            player.baseHeight += lowestHeight;
            player.baseBulk += lowestBulk;
        }
    }

    static challengeStatModification(players, player) {
        console.log("Weakest Link Challenge Stat Modification");
        let lowestFinesse = 10;
        let lowestStrength = 10;
        let lowestTrickiness = 10;
        let lowestFocus = 10;
        let lowestHeight = 10;
        let lowestBulk = 10;
        let onlyPlayer = true;
        for(const otherPlayer of players) {
            if(otherPlayer !== player && otherPlayer.team == player.team) {
                onlyPlayer = false;
                lowestFinesse = Math.min(lowestFinesse, otherPlayer.finesse);
                lowestStrength = Math.min(lowestStrength, otherPlayer.strength);
                lowestTrickiness = Math.min(lowestTrickiness, otherPlayer.trickiness);
                lowestFocus = Math.min(lowestFocus, otherPlayer.focus);
                lowestHeight = Math.min(lowestHeight, otherPlayer.height);
                lowestBulk = Math.min(lowestBulk, otherPlayer.bulk);
            }
        }
        if(!onlyPlayer) {
            player.finesse += lowestFinesse;
            player.strength += lowestStrength;
            player.trickiness += lowestTrickiness;
            player.focus += lowestFocus;
            player.height += lowestHeight;
            player.bulk += lowestBulk;
        }
        return true;
    }
}