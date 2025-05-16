import { Quirk } from './quirk.js';

export class Empath extends Quirk {
    static POWER_MODIFIER = -6;
    static title = "Empath";
    static description = ("Gets 50% of any start game stat effects your other players get from quirks");
    static likelihood = 2;
    static APPEARS_IN_GENERATION = false;
    static APPEARS_IN_DRAFT = true;
    static START_EFFECT_ORDER = -1;
    static SECOND_START_EFFECT_ORDER = 100;

    static startGameEffect(match, player) {
        const playerTeam = match.offenseTeam.teamId === player.teamId ? match.offenseTeam : match.defenseTeam;
        player.bulk = 0;
        player.finesse = 0;
        player.intelligence = 0;
        player.strength = 0;
        player.cardio = 0;
        player.height = 0;
        playerTeam.players.forEach((p) => {
            player.bulk -= p.baseBulk;
            player.finesse -= p.baseFinesse;
            player.intelligence -= p.baseIntelligence;
            player.strength -= p.baseStrength;
            player.cardio -= p.baseCardio;
            player.height -= p.baseHeight;
        });
    }

    static secondStartGameEffect(match, player) {
        const playerTeam = match.offenseTeam.teamId === player.teamId ? match.offenseTeam : match.defenseTeam;
        playerTeam.players.forEach((p) => {
            player.bulk += p.baseBulk;
            player.finesse += p.baseFinesse;
            player.intelligence += p.baseIntelligence;
            player.strength += p.baseStrength;
            player.cardio += p.baseCardio;
            player.height += p.baseHeight;
        }); 
        player.baseBulk += player.bulk/2;
        player.baseFinesse += player.finesse/2;
        player.baseIntelligence += player.intelligence/2;
        player.baseStrength += player.strength/2;
        player.baseCardio += player.cardio/2;
        player.baseHeight += player.height/2;
    }

    static challengeStatModification(players, player) {
        player.baseBulk = 0;
        player.baseFinesse = 0;
        player.baseIntelligence = 0;
        player.baseStrength = 0;
        player.baseCardio = 0;
        player.baseHeight = 0;
        players.forEach((p) => {
            if(p.team == player.team) {
                player.baseBulk -= p.bulk;
                player.baseFinesse -= p.finesse;
                player.baseIntelligence -= p.intelligence;
                player.baseStrength -= p.strength;
                player.baseCardio -= p.cardio;
                player.baseHeight -= p.height;
            }
        });
    }

    static secondChallengeStatModification(players, player) {
        players.forEach((p) => {
            if(p.team == player.team) {
                player.baseBulk += p.bulk;
                player.baseFinesse += p.finesse;
                player.baseIntelligence += p.intelligence;
                player.baseStrength += p.strength;
                player.baseCardio += p.cardio;
                player.baseHeight += p.height;
            }
        });
        player.bulk += player.baseBulk/2;
        player.finesse += player.baseFinesse/2;
        player.intelligence += player.baseIntelligence/2;
        player.strength += player.baseStrength/2;
        player.cardio += player.baseCardio/2;
        player.height += player.baseHeight/2;
    }

    static getLikelihood(season, quirkList) {
        if(quirkList["Empath"] == null) {
            return 4;
        }
        else {
            return 0.5;
        }
    }
}