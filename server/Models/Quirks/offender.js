import { Quirk } from './quirk.js';

export class Offender extends Quirk {
    POWER_MODIFIER = -4;
    title = "Offender";
    STAT_INCREASE = 2;
    description = ("+" + this.STAT_INCREASE + " to all stats while on offense");
}