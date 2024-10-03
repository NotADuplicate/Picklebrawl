import {Player} from '../player.js';

export class Quirk {
    static title = "Boring";
    static description = "No quirk";
    static POWER_MODIFIER = 0; //changes how stats generate
    static likelihood = 10;
    static START_EFFECT_ORDER = 2;

    // TODO: when should the startGameEffect be called? Maybe the bottom of player.setStats?
    // It might not work there because some stat mods rely on other players to already be created
    // Maybe create another method to run after all players are created and match is set up
    // which will do the alterations?
    static playerStatGenerationChanges(player, power) {
        return;
        // Handles changes in stat generation that doesn't rely on match info
        // e.g. alphabet completionist on avg generates with higher stats
    }

    static startGameEffect(match, player) {
        // Handles match-specific changes in stats
        // e.g. the -2 to stats if the alphabet completionist only sees 24 letters in a match
        console.log("No quirk effects\n");
        return false;
    }

    static challengeStatModification(players, player) {
        // Handles challenge-specific changes in stats
        // e.g. the -2 to stats if the alphabet completionist only sees 24 letters in a challenge
        //console.log("No quirk effects\n");
        return;
    }

    // TODO: may need to change below functions depending on what is needed
    static tickEffect(offenseTeam, defenseTeam) {
        return;
    }

    static advanceEffect(offenseTeam, defenseTeam, position) {
        return null;
    }

    static scoreEffect(shooter, offenseTeam, defenseTeam, position) {
        return null;
    }

    static attackEffect(player, target) {
        return null;
    }

    static turnoverEffect(player, match) {
        return null;
    }

    static describe() {
        return this.description;
    }

    static extraActions() {
        return null;
    }
}