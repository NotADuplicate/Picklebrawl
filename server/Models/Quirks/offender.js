import { Quirk } from './quirk.js';

export class Offender extends Quirk {
    static POWER_MODIFIER = -7;
    static title = "Offender"; 
    static description = ("+Sorcery to all non-magic stats while on offense");
    static likelihood = 6;
    static APPEARS_IN_GENERATION = true;
    static APPEARS_IN_DRAFT = true;
    static START_EFFECT_ORDER = 2;

    static thirdStartGameEffect(match, player, sorcery) {
        player.STAT_INCREASE = sorcery;
        if (match.offenseTeam.players.includes(player)) {
            player.baseFinesse += player.STAT_INCREASE;
            player.baseBulk += player.STAT_INCREASE;
            player.baseCardio += player.STAT_INCREASE;
            player.baseHeight += player.STAT_INCREASE;
            player.baseStrength += player.STAT_INCREASE;
            player.baseIntelligence += player.STAT_INCREASE;
        }
    }

    static turnoverEffect(player, match, sorcery) {
        if (match.offenseTeam.players.includes(player)) {
            player.baseFinesse += sorcery
            player.baseBulk += sorcery
            player.baseCardio += sorcery
            player.baseHeight += sorcery
            player.baseStrength += sorcery
            player.baseIntelligence += sorcery
        } else {
            player.baseFinesse -= sorcery;
            player.baseBulk -= sorcery;
            player.baseCardio -= sorcery;
            player.baseHeight -= sorcery;
            player.baseStrength -= sorcery;
            player.baseIntelligence -= sorcery;
        }
    }
}