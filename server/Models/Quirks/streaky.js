import { Quirk } from './quirk.js';

export class Streaky extends Quirk {
    static likelihood = 0;
    static title = "Streaky";
    static description = ("At the start of the game, has a 50% chance to increase physical stats by 1, or decrease physical stats by 1.");
    static STAT_CHANGE = 1
    static CHANCE_FOR_STAT_INCREASE = 0.5
    static APPEARS_IN_GENERATION = true;
    static APPEARS_IN_DRAFT = true;
    static START_EFFECT_ORDER = 2;

    static startGameEffect(match, player) {
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