import { Quirk } from './quirk.js';

export class Streaky extends Quirk {
    description = ("The player may have either higher or lower stats, recalculated at the start "
    + "of each match");
    STAT_CHANGE = 1
    CHANCE_FOR_STAT_INCREASE = 0.5

    startGameStatModification(match, player) {
        console.log(player.name + " is STREAKY")
        if(Math.random() < this.CHANCE_FOR_STAT_INCREASE) {
            player.bulk += this.STAT_CHANGE;
            player.agility += this.STAT_CHANGE;
            player.height += this.STAT_CHANGE;
            player.strength += this.STAT_CHANGE;
            player.baseBulk += this.STAT_CHANGE;
            player.baseAgility += this.STAT_CHANGE;
            player.baseHeight += this.STAT_CHANGE;
            player.baseStrength += this.STAT_CHANGE;
        }
        else {
            player.bulk -= this.STAT_CHANGE;
            player.agility -= this.STAT_CHANGE;
            player.height -= this.STAT_CHANGE;
            player.strength -= this.STAT_CHANGE;
            player.baseBulk -= this.STAT_CHANGE;
            player.baseAgility -= this.STAT_CHANGE;
            player.baseHeight -= this.STAT_CHANGE;
            player.baseStrength -= this.STAT_CHANGE;
        }
    }
}