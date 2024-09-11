import { Quirk } from './quirk.js';

export class StarWorshipper extends Quirk {
    description = ("Worships the stars");
    STAT_BOOST = 1

    startGameStatModification(match, player) {
        player.bulk += this.STAT_BOOST;
        player.agility += this.STAT_BOOST;
        player.height += this.STAT_BOOST;
        player.strength += this.STAT_BOOST;
        player.baseBulk += this.STAT_BOOST;
        player.baseAgility += this.STAT_BOOST;
        player.baseHeight += this.STAT_BOOST;
        player.baseStrength += this.STAT_BOOST;
    }
}