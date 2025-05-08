import { Quirk } from './quirk.js';

export class Redundant extends Quirk {
    static POWER_MODIFIER = -3;
    static title = "Redundant";
    static description = ("For each ally, this player gets +1 to the non-magic stat(s) that ally has the most of.");
    static likelihood = 4;
    static APPEARS_IN_GENERATION = true;
    static APPEARS_IN_DRAFT = true;
    static START_EFFECT_ORDER = 3;

    static startGameEffect(match, player) {
        const playerTeam = match.offenseTeam.teamId === player.teamId ? match.offenseTeam : match.defenseTeam;
        playerTeam.players.forEach((p) => {
            if (p !== player) {
                const maxStat = Math.max(p.baseBulk, p.baseFinesse, p.baseIntelligence, p.baseStrength, p.baseCardio, p.baseHeight);
                if (maxStat === p.baseBulk) {
                    player.baseBulk += 1;
                }
                if (maxStat === p.baseFinesse) {
                    player.baseFinesse += 1;
                }
                if (maxStat === p.baseIntelligence) {
                    player.baseIntelligence += 1;
                }
                if (maxStat === p.baseStrength) {
                    player.baseStrength += 1;
                }
                if (maxStat === p.baseCardio) {
                    player.baseCardio += 1;
                } 
                if (maxStat === p.baseHeight) {
                    player.baseHeight += 1;
                }
            }
        });
    }

    static challengeStatModification(players, player) {
        players.forEach((p) => {
            if (p.team == player.team && p !== player) {
                const maxStat = Math.max(p.bulk, p.finesse, p.intelligence, p.strength, p.cardio, p.height);
                console.log("Redundant maxStat: ", maxStat);
                if (maxStat === p.bulk) {
                    player.bulk += 1;
                }
                if (maxStat === p.finesse) {
                    player.finesse += 1;
                }
                if (maxStat === p.intelligence) {
                    player.intelligence += 1;
                }
                if (maxStat === p.strength) {
                    player.strength += 1;
                }
                if (maxStat === p.cardio) {
                    player.cardio += 1;
                } 
                if (maxStat === p.height) {
                    player.height += 1;
                }
            }
        });
    }

    static getLikelihood(season, quirkList) {
        return this.likelihood / (quirkList[this.title] ? quirkList[this.title]+1 : 1);
    }
}