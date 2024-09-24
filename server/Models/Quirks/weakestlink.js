import { Quirk } from './quirk.js';

export class WeakestLink extends Quirk {
    title = "Weakest Link";
    description = ("All of your stats are set to double the lowest of that stat on your team");

    playerStatGenerationChanges(player, power) {
        player.finesse = 0;
        player.strength = 0;
        player.trickiness = 0;
        player.focus = 0;
        player.height = 0;
        player.bulk = 0;
        return;
    }

    startGameStatModification(match, player) {
        let lowestFinesse = 5;
        let lowestStrength = 5;
        let lowestTrickiness = 5;
        let lowestFocus = 5;
        let lowestHeight = 5;
        let lowestBulk = 5;
        if(player in match.homeTeam.players) {
            // Compare to home team players
            for(const otherPlayer of match.homeTeam.players) {
                if(otherPlayer !== player) {
                    lowestFinesse = Math.min(lowestFinesse, otherPlayer.finesse);
                    lowestStrength = Math.min(lowestStrength, otherPlayer.strength);
                    lowestTrickiness = Math.min(lowestTrickiness, otherPlayer.trickiness);
                    lowestFocus = Math.min(lowestFocus, otherPlayer.focus);
                    lowestHeight = Math.min(lowestHeight, otherPlayer.height);
                    lowestBulk = Math.min(lowestBulk, otherPlayer.bulk);
                }
            }
        }
        else {
            // Compare to away team players
            for(const otherPlayer of match.awayTeam.players) {
                if(otherPlayer.name < player.name) {
                    lowestFinesse = Math.min(lowestFinesse, otherPlayer.finesse);
                    lowestStrength = Math.min(lowestStrength, otherPlayer.strength);
                    lowestTrickiness = Math.min(lowestTrickiness, otherPlayer.trickiness);
                    lowestFocus = Math.min(lowestFocus, otherPlayer.focus);
                    lowestHeight = Math.min(lowestHeight, otherPlayer.height);
                    lowestBulk = Math.min(lowestBulk, otherPlayer.bulk);
                }
            }
        }
        player.baseFiness = lowestFinesse * 2;
        player.baseStrength = lowestStrength * 2;
        player.baseTrickiness = lowestTrickiness * 2;
        player.baseFocus = lowestFocus * 2;
        player.baseHeight = lowestHeight * 2;
        player.baseBulk = lowestBulk * 2;
    }

    challengeStatModification(players, player) {
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
        player.finesse = lowestFinesse * 2;
        player.strength = lowestStrength * 2;
        player.trickiness = lowestTrickiness * 2;
        player.focus = lowestFocus * 2;
        player.height = lowestHeight * 2;
        player.bulk = lowestBulk * 2;
        return true;
    }
}