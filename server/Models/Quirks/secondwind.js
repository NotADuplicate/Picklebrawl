import { Quirk } from './quirk.js';

export class SecondWind extends Quirk {
    static likelihood = 4;
    static POWER_MODIFIER = -5;
    static STAT_BOOST = 2;
    static title = "Second Wind";
    static description = ("+" + this.STAT_BOOST + " to all stats in the second half of the game.");
    static APPEARS_IN_GENERATION = true;
    static APPEARS_IN_DRAFT = true;

    static halftimeEffect(match, player) {
        player.bulk += this.STAT_BOOST;
        player.height += this.STAT_BOOST;
        player.strength += this.STAT_BOOST;
        player.finesse += this.STAT_BOOST;
        player.intelligence += this.STAT_BOOST;
        player.cardio += this.STAT_BOOST;
        player.baseBulk += this.STAT_BOOST;
        player.baseHeight += this.STAT_BOOST;
        player.baseStrength += this.STAT_BOOST;
        player.baseFinesse += this.STAT_BOOST;
        player.baseIntelligence += this.STAT_BOOST;
        player.baseCardio += this.STAT_BOOST;
    }
}