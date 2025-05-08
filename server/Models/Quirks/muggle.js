import { Quirk } from './quirk.js';

export class Muggle extends Quirk {
    static title = "Muggle";
    static description = ("All physical stats are decreased by the opposing team's sorcery");
    static POWER_MODIFIER = 4;
    static BASE_STAT_INCREASE = 2;
    static likelihood = 1;
    static APPEARS_IN_GENERATION = false;
    static APPEARS_IN_DRAFT = true;
    static START_EFFECT_ORDER = 2;

    static playerStatGenerationChanges(player, power) {
        player.finesse += this.BASE_STAT_INCREASE + Math.floor(player.magic / 2);
        player.bulk += this.BASE_STAT_INCREASE;
        player.height += this.BASE_STAT_INCREASE;
        player.strength += this.BASE_STAT_INCREASE + Math.floor(player.magic / 2);
        player.magic = 0;
        player.cardio += this.BASE_STAT_INCREASE;
        return;
    }

    static startGameEffect(match, player) {
        let otherTeam;
        let opposing_sorcery = 0;
        if (match.homeTeam.teamId === player.team) {
            otherTeam = match.awayTeam;
        } else {
            otherTeam = match.homeTeam;
        }
        opposing_sorcery = otherTeam.sorcery;
        console.log("Muggle missing letters: " + opposing_sorcery);
        if(opposing_sorcery == null) {
            throw new Error("Muggle missing letters is undefined or null");
        }
        player.baseBulk -= opposing_sorcery;
        player.baseFinesse -= opposing_sorcery;
        player.baseHeight -= opposing_sorcery;
        player.baseStrength -= opposing_sorcery;
        player.baseIntelligence -= opposing_sorcery;
        player.baseCardio -= opposing_sorcery;
    }

    static challengeStatModification(players, player) {
        let opposing_sorcery = 0;
        players.forEach(otherPlayer => {
            if (otherPlayer.team === player.team) {
                return;
            }
            opposing_sorcery = otherPlayer.sorcery;
        });
        player.bulk -= opposing_sorcery;
        player.finesse -= opposing_sorcery;
        player.height -= opposing_sorcery;
        player.strength -= opposing_sorcery;
        player.intelligence -= opposing_sorcery;
        player.cardio -= opposing_sorcery;
        return true;
    }

    static getLikelihood(season, quirkList) {
        return this.likelihood / (quirkList[this.title] ? quirkList[this.title]+1 : 1);
    }
}