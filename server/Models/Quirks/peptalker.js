import { Quirk } from './quirk.js';

export class PepTalker extends Quirk {
    static POWER_MODIFIER = -5;
    static STAT_INCREASE = 2;
    static title = "Pep Talker";
    static description = ("If losing at halftime, give all allies a bonus to all physical stats equal to the number of points you are losing by.");
    static likelihood = 2
    static APPEARS_IN_GENERATION = true;
    static APPEARS_IN_DRAFT = true;
    
    static halftimeEffect(match, player, sorcery) {
        if((match.offenseTeam.teamId === player.team && match.offenseTeam.score < match.defenseTeam.score) ||
        (match.defenseTeam.teamId === player.team && match.defenseTeam.score < match.offenseTeam.score)) {
            const losingMargin = Math.abs(match.offenseTeam.score - match.defenseTeam.score);
            match.players.forEach((otherPlayer) => {
                if(otherPlayer.team === player.team && otherPlayer !== player) {
                    player.bulk += losingMargin
                    player.height += losingMargin;
                    player.strength += losingMargin;
                    player.finesse += losingMargin;
                    player.baseBulk += losingMargin;
                    player.baseHeight += losingMargin;
                    player.baseStrength += losingMargin;
                    player.baseFinesse += losingMargin;
                }
            });
        }
    }

    static getLikelihood(season, quirkList) {
        return this.likelihood / (quirkList[this.title] ? quirkList[this.title]+1 : 1);
    }
}