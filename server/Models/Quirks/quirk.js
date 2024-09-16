import {Player} from '../player.js';

export class Quirk {
    description = "No quirk";
    POWER_MODIFIER = 0; //changes how stats generate

    // TODO: when should the startGameStatModification be called? Maybe the bottom of player.setStats?
    // It might not work there because some stat mods rely on other players to already be created
    // Maybe create another method to run after all players are created and match is set up
    // which will do the alterations?
    playerStatGenerationChanges(player, power) {
        return;
        // Handles changes in stat generation that doesn't rely on match info
        // e.g. alphabet completionist on avg generates with higher stats
    }

    startGameStatModification(match, player) {
        // Handles match-specific changes in stats
        // e.g. the -2 to stats if the alphabet completionist only sees 24 letters in a match
        console.log("No quirk effects\n");
        return;
    }

    // TODO: may need to change below functions depending on what is needed
    tickEffect(offenseTeam, defenseTeam) {
        return;
    }

    advanceEffect(offenseTeam, defenseTeam, position) {
        return null;
    }

    scoreEffect(shooter, offenseTeam, defenseTeam, position) {
        return null;
    }

    attackEffect(player, target) {
        return null;
    }

    describe() {
        return this.description;
    }
}