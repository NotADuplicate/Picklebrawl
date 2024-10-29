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
        if(Math.random() < 0.1 - (0.01 * shooter.finesse)) { //there is always at least a smmall chance of missing of making
            return false;
        }
        if(Math.random < (0.015 * shooter.finesse)) {
            return true;
        }
        return shooting+bonus-(range*match.SHOOTING_DISTANCE_LINEAR + match.SHOOTING_DISTANCE_EXPONENTIAL*(range**2))/2>0;
    }
}