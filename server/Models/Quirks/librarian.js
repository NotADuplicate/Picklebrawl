import { Quirk } from './quirk.js';

export class Librarian extends Quirk {
    static POWER_MODIFIER = -2;
    static title = "Librarian";
    static description = ("Can silence players");
    static likelihood = 2;
    static APPEARS_IN_GENERATION = false;
    static APPEARS_IN_DRAFT = true;
    static START_EFFECT_ORDER = 0;

    static extraActions() {
        const actions = {
            "Silence": {
                target: "Target either",
                description: "At the start of the match, disable a player's quirk",
                offense: true,
                defense: true,
            }
        };
        return actions;
    }

    static startGameEffect(match, player) {
        if(player.offensePriority == "Silence") {
            console.log("Silence target: ", player.offensePriorityTarget)
            for(const otherPlayer of match.players) {
                if(otherPlayer.id == player.offensePriorityTarget) { //nullify targets quirk
                    otherPlayer.Quirk = Quirk
                    console.log(otherPlayer)
                }
            }
        }
    }

    static challengeStatModification(players, player) {
        console.log("Librarian challenge priority: ", player.offensePriority)
        if(player.offensePriority == "Silence") {
            console.log("Silence target: ", player.offensePriorityTarget)
            for(const otherPlayer of players) {
                if(otherPlayer.id == player.offensePriorityTarget) { //nullify targets quirk
                    otherPlayer.quirk = this
                    console.log("Setting player ", otherPlayer.name, " quirk to ", otherPlayer.quirk.title)
                }
            }
        }
    }
}