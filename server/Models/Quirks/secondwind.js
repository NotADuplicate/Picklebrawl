import { Quirk } from './quirk.js';

export class SecondWind extends Quirk {
    POWER_MODIFIER = -2;
    STAT_INCREASE = 2;
    title = "Second Wind";
    description = ("+" + this.STAT_INCREASE + " to all stats after halftime if they played the first half");
}