import { Quirk } from './quirk.js';

export class Defender extends Quirk {
    static POWER_MODIFIER = -6; 
    static title = "Defender";
    static description = ("+Sorcery to all stats while on defense");
    static likelihood = 6;
    static APPEARS_IN_GENERATION = true;
    static APPEARS_IN_DRAFT = true;
    static START_EFFECT_ORDER = 2;

    static thirdStartGameEffect(match, player, sorcery) {
        player.STAT_INCREASE = sorcery;
        if (match.defenseTeam.players.includes(player)) {
            player.baseFinesse += sorcery;
            player.baseBulk += sorcery;
            player.baseCardio += sorcery;
            player.baseHeight += sorcery;
            player.baseStrength += sorcery;
            player.baseIntelligence += sorcery;
        }
        if(player.baseFinesse == null) {
            throw new Error("Defender baseFinesse is undefined or null at start");
        }
    }

    static turnoverEffect(player, match, sorcery) {
        console.log("Defender turnover effect called with sorcery: " + sorcery);
        if (match.defenseTeam.players.includes(player)) {
            player.baseFinesse += sorcery;
            player.baseBulk += sorcery;
            player.baseCardio += sorcery;
            player.baseHeight += sorcery;
            player.baseStrength += sorcery;
            player.baseIntelligence += sorcery;
        } else {
            player.baseFinesse -= sorcery;
            player.baseBulk -= sorcery;
            player.baseCardio -= sorcery;
            player.baseHeight -= sorcery;
            player.baseStrength -= sorcery;
            player.baseIntelligence -= sorcery;
        }
        if(player.baseFinesse == null) {
            throw new Error("Defender baseFinesse is undefined or null at turnover");
        }
    }
}