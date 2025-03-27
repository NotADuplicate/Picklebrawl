import { Quirk } from './quirk.js';

export class Defender extends Quirk {
    static POWER_MODIFIER = -6;
    static title = "Defender";
    static STAT_INCREASE = 2;
    static description = ("+" + this.STAT_INCREASE + " to all stats while on defense");
    static likelihood = 6;
    static APPEARS_IN_GENERATION = true;
    static APPEARS_IN_DRAFT = true;
    static START_EFFECT_ORDER = 2;

    static thirdStartGameEffect(match, player) {
        if (match.defenseTeam.players.includes(player)) {
            player.baseFinesse += this.STAT_INCREASE;
            player.baseBulk += this.STAT_INCREASE;
            player.baseFocus += this.STAT_INCREASE;
            player.baseHeight += this.STAT_INCREASE;
            player.baseStrength += this.STAT_INCREASE;
            player.baseTrickiness += this.STAT_INCREASE;
        }
    }

    static turnoverEffect(player, match) {
        if (match.defenseTeam.players.includes(player)) {
            player.baseFinesse += this.STAT_INCREASE;
            player.baseBulk += this.STAT_INCREASE;
            player.baseFocus += this.STAT_INCREASE;
            player.baseHeight += this.STAT_INCREASE;
            player.baseStrength += this.STAT_INCREASE;
            player.baseTrickiness += this.STAT_INCREASE;
        } else {
            player.baseFinesse -= this.STAT_INCREASE;
            player.baseBulk -= this.STAT_INCREASE;
            player.baseFocus -= this.STAT_INCREASE;
            player.baseHeight -= this.STAT_INCREASE;
            player.baseStrength -= this.STAT_INCREASE;
            player.baseTrickiness -= this.STAT_INCREASE;
        }
    }
}