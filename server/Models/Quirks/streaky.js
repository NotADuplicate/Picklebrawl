import { Quirk } from './quirk.js';

export class Streaky extends Quirk {
    title = "Streaky";
    description = ("The player may have either higher or lower stats, recalculated at the start "
    + "of each match");
    STAT_CHANGE = 2
    CHANCE_FOR_STAT_INCREASE = 0.5

    startGameStatModification(match, player) {
        console.log(player.name + " is STREAKY")
        if(Math.random() < this.CHANCE_FOR_STAT_INCREASE) {
            player.baseBulk += this.STAT_CHANGE;
            player.baseFinesse += this.STAT_CHANGE;
            player.baseHeight += this.STAT_CHANGE;
            player.baseStrength += this.STAT_CHANGE;
        }
        else {
            player.baseBulk = Math.max(1, player.baseBulk - this.STAT_CHANGE);
            player.baseFinesse = Math.max(1, player.baseFinesse - this.STAT_CHANGE);
            player.baseHeight = Math.max(1, player.baseHeight - this.STAT_CHANGE);
            player.baseStrength = Math.max(1, player.baseStrength - this.STAT_CHANGE);
        }
    }
}