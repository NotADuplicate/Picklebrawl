import { Quirk } from './quirk.js';

export class PepTalker extends Quirk {
    static POWER_MODIFIER = -5;
    static STAT_INCREASE = 2;
    static title = "Pep Talker";
    static description = ("Give +Sorcery to all teammates' physical stats if losing at half time");
    static likelihood = 2
    static APPEARS_IN_GENERATION = true;
    static APPEARS_IN_DRAFT = true;
    
    static halftimeEffect(match, player, sorcery) {
        if((match.offenseTeam.teamId === player.team && match.offenseTeam.score < match.defenseTeam.score) ||
        (match.defenseTeam.teamId === player.team && match.defenseTeam.score < match.offenseTeam.score)) {
            match.players.forEach((otherPlayer) => {
                if(otherPlayer.team === player.team && otherPlayer !== player) {
                    player.bulk += sorcery
                    player.height += sorcery;
                    player.strength += sorcery;
                    player.finesse += sorcery;
                    player.baseBulk += sorcery;
                    player.baseHeight += sorcery;
                    player.baseStrength += sorcery;
                    player.baseFinesse += sorcery;
                }
            });
        }
    }
}