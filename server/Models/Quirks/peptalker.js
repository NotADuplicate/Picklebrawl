import { Quirk } from './quirk.js';

export class PepTalker extends Quirk {
    POWER_MODIFIER = -2;
    STAT_INCREASE = 2;
    title = "Pep Talker";
    description = ("Give +" + this.STAT_INCREASE + " to all teammates' stats if losing at half time");
}