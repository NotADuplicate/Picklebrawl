import { Quirk } from './quirk.js';

export class Streaky extends Quirk {
    static likelihood = 6;
    static title = "Streaky";
    static description = ("The player may have either higher or lower stats, recalculated at the start "
    + "of each match");
    static STAT_CHANGE = 2
    static CHANCE_FOR_STAT_INCREASE = 0.5
    static APPEARS_IN_GENERATION = true;
    static APPEARS_IN_DRAFT = true;

    static startGameStatModification(match, player) {
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