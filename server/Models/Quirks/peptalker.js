import { Quirk } from './quirk.js';

export class PepTalker extends Quirk {
    static POWER_MODIFIER = -2;
    static STAT_INCREASE = 2;
    static title = "Pep Talker";
    static description = ("Give +" + this.STAT_INCREASE + " to all teammates' stats if losing at half time");
    static likelihood = 2;
    static APPEARS_IN_GENERATION = true;
    static APPEARS_IN_DRAFT = true;
}