import {Player} from '../player.js';

export class Quirk {
    static title = "Boring";
    static description = "No quirk";
    static POWER_MODIFIER = 0; //changes how stats generate
    static likelihood = 7;
    static START_EFFECT_ORDER = 2;
    static SECOND_START_EFFECT_ORDER = 2; //happens after 
    static APPEARS_IN_GENERATION = true;
    static APPEARS_IN_DRAFT = true;
    static DAMAGE_TAKEN_MODIFIER = 1;

    // TODO: when should the startGameEffect be called? Maybe the bottom of player.setStats?
    // It might not work there because some stat mods rely on other players to already be created
    // Maybe create another method to run after all players are created and match is set up
    // which will do the alterations?
    static playerStatGenerationChanges(player, power) {
        return;
    }

    static startGameEffect(match, player) {
        return false;
    }

    static secondStartGameEffect(match, player) {
        return false;
    }

    static thirdStartGameEffect(match, player) { //happens after resting bonus
        return false;
    }

    static halftimeEffect(match, player) {
        return false;
    }

    static challengeStatModification(players, player) {
        return;
    }

    static secondChallengeStatModification(players, player) {
        return;
    }

    // TODO: may need to change below functions depending on what is needed
    static tickEffect(offenseTeam, defenseTeam) {
        return;
    }

    static advanceEffect(offenseTeam, defenseTeam, position) {
        return null;
    }

    static scoreEffect(shooter, match, shooting, range, bonus) {
        if(Math.random() < 0.1 - (0.01 * shooter.finesse)) { //there is always at least a smmall chance of missing of making
            return false;
        }
        if(Math.random < (0.015 * shooter.finesse)) {
            return true;
        }
        return shooting+bonus-(range*match.SHOOTING_DISTANCE_LINEAR + match.SHOOTING_DISTANCE_EXPONENTIAL*(range**2))>0;
    }

    static attackEffect(player, target, match) {
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

    static trickEffect(player, target, match) {
        if(player.intelligence > target.intelligence) {
            return Math.random() < match.TRICK_CHANCE*(player.intelligence - target.intelligence);
        }
        return false;
    }

    static beTrickedEffect(player, tricker, match) {
        return true;
    }

    static nameGenerationChanges(player) {
        return;
    }
}