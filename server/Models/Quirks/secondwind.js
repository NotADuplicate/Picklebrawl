import { Quirk } from './quirk.js';

export class SecondWind extends Quirk {
    static likelihood = 4;
    static POWER_MODIFIER = -2;
    static STAT_INCREASE = 2;
    static title = "Second Wind";
    static description = ("+" + this.STAT_INCREASE + " to all stats after halftime if they played the first half");
    static APPEARS_IN_GENERATION = true;
    static APPEARS_IN_DRAFT = true;
}