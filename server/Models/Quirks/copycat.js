import { Quirk } from './quirk.js';

export class Copycat extends Quirk {
    static POWER_MODIFIER = -2;
    static title = "Copycat";
    static description = ("Can mimic players, taking their stats");
    static likelihood = 2;
    static APPEARS_IN_GENERATION = false;
    static APPEARS_IN_DRAFT = true;
    static START_EFFECT_ORDER = 4;

    static extraActions() {
        const actions = {
            "Mimic": {
                target: "either",
                description: "At the start of the match set all of your stats to this player's stats",
                offense: true,
                defense: true,
            }
        };
        return actions;
    }

    static startGameEffect(match, player) {
        if(player.offensePriority == "Mimic" || player.defensePriority == "Mimic") {
            for(const otherPlayer of match.players) {
                const target = player.offensePriority == "Mimic" ? player.offensePriorityTarget : player.defensePriorityTarget
                if(otherPlayer.id == target) { //nullify targets quirk
                    player.baseBulk = otherPlayer.baseBulk
                    player.baseFinesse = otherPlayer.baseFinesse
                    player.baseHeight = otherPlayer.baseHeight
                    player.baseStrength = otherPlayer.baseStrength
                    player.baseFocus = otherPlayer.baseFocus
                    player.baseTrickiness = otherPlayer.baseTrickiness
                }
            }
        }
    }

    static challengeStatModification(players, player) {
        if(player.offensePriority == "Mimic" || player.defensePriority == "Mimic") {
            for(const otherPlayer of players) {
                const target = player.offensePriority == "Mimic" ? player.offensePriorityTarget : player.defensePriorityTarget
                if(otherPlayer.id == target) { //nullify targets quirk
                    player.bulk = otherPlayer.bulk
                    player.finesse = otherPlayer.finesse
                    player.height = otherPlayer.height
                    player.strength = otherPlayer.strength
                    player.focus = otherPlayer.focus
                    player.trickiness = otherPlayer.trickiness
                }
            }
        }
    }
}