import { Quirk } from './quirk.js';

export class PepTalker extends Quirk {
    static POWER_MODIFIER = -2;
    static STAT_INCREASE = 2;
    static title = "Pep Talker";
    static description = ("Give +" + this.STAT_INCREASE + " to all teammates' stats if losing at half time");
    static likelihood = 2
    static APPEARS_IN_GENERATION = true;
    static APPEARS_IN_DRAFT = true;
    
    static halftimeEffect(match, player) {
        if((match.offenseTeam === player.team && player.team.score < match.defenseTeam.score) ||
        (match.defenseTeam === player.team && player.team.score < match.offenseTeam.score)) {
            match.players.forEach((otherPlayer) => {
                if(otherPlayer.team === player.team) {
                    player.bulk += this.STAT_INCREASE;
                    player.height += this.STAT_INCREASE;
                    player.strength += this.STAT_INCREASE;
                    player.finesse += this.STAT_INCREASE;
                    player.trickiness += this.STAT_INCREASE;
                    player.focus += this.STAT_INCREASE;
                    player.baseBulk += this.STAT_INCREASE;
                    player.baseHeight += this.STAT_INCREASE;
                    player.baseStrength += this.STAT_INCREASE;
                    player.baseFinesse += this.STAT_INCREASE;
                    player.baseTrickiness += this.STAT_INCREASE;
                    player.baseFocus += this.STAT_INCREASE;
                }
            });
        }
    }
}