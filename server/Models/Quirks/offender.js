import { Quirk } from './quirk.js';

export class Offender extends Quirk {
    static POWER_MODIFIER = -7;
    static title = "Offender";
    static STAT_INCREASE = 2;
    static description = ("+" + this.STAT_INCREASE + " to all stats while on offense");
    static likelihood = 6;
    static APPEARS_IN_GENERATION = true;
    static APPEARS_IN_DRAFT = true;
    static START_EFFECT_ORDER = 2;

    static thirdStartGameEffect(match, player) {
        if (match.offenseTeam.players.includes(player)) {
            player.baseFinesse += this.STAT_INCREASE;
            player.baseBulk += this.STAT_INCREASE;
            player.baseCardio += this.STAT_INCREASE;
            player.baseHeight += this.STAT_INCREASE;
            player.baseStrength += this.STAT_INCREASE;
            player.baseIntelligence += this.STAT_INCREASE;
        }
    }

    static turnoverEffect(player, match) {
        if (match.offenseTeam.players.includes(player)) {
            player.baseFinesse += this.STAT_INCREASE;
            player.baseBulk += this.STAT_INCREASE;
            player.baseCardio += this.STAT_INCREASE;
            player.baseHeight += this.STAT_INCREASE;
            player.baseStrength += this.STAT_INCREASE;
            player.baseIntelligence += this.STAT_INCREASE;
        } else {
            player.baseFinesse -= this.STAT_INCREASE;
            player.baseBulk -= this.STAT_INCREASE;
            player.baseCardio -= this.STAT_INCREASE;
            player.baseHeight -= this.STAT_INCREASE;
            player.baseStrength -= this.STAT_INCREASE;
            player.baseIntelligence -= this.STAT_INCREASE;
        }
    }
}