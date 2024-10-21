import { Quirk } from './quirk.js';

export class Sniper extends Quirk {
    static POWER_MODIFIER = -4;
    static title = "Sniper";
    static description = ("Distance affects their shooting half as much");
    static likelihood = 2;
    static APPEARS_IN_GENERATION = true;
    static APPEARS_IN_DRAFT = true;
    static START_EFFECT_ORDER = 3;

    static scoreEffect(shooter, match, shooting, range, bonus) {
        return shooting+bonus-(range*match.SHOOTING_DISTANCE_MODIFIER/2)>0;
    }
}