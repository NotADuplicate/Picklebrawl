import { Quirk } from './quirk.js';

export class StarWorshipper extends Quirk {
    static likelihood = 6;
    static title = "Star Worshipper";
    static description = ("Worships the stars");
    static STAT_BOOST = 1
    static APPEARS_IN_GENERATION = true;
    static APPEARS_IN_DRAFT = false;

    static startGameStatModification(match, player) {
        player.bulk += this.STAT_BOOST;
        player.height += this.STAT_BOOST;
        player.strength += this.STAT_BOOST;
        player.finesse += this.STAT_BOOST;
        player.trickiness += this.STAT_BOOST;
        player.focus += this.STAT_BOOST;
        player.baseBulk += this.STAT_BOOST;
        player.baseHeight += this.STAT_BOOST;
        player.baseStrength += this.STAT_BOOST;
        player.baseFinesse += this.STAT_BOOST;
        player.baseTrickiness += this.STAT_BOOST;
        player.baseFocus += this.STAT_BOOST;
    }
}