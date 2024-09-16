import { Quirk } from './quirk.js';

export class Defender extends Quirk {
    POWER_MODIFIER = -4;
    title = "Defender";
    STAT_INCREASE = 2;
    description = ("+" + this.STAT_INCREASE + " to all stats while on defense");
}