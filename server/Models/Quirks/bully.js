import { Quirk } from './quirk.js';

export class Bully extends Quirk {
    static POWER_MODIFIER = -2;
    static title = "Bully";
    static description = ("When advancing, attack and be attacked by any player who defends you.");
    static likelihood = 2;
    static APPEARS_IN_GENERATION = false;
    static APPEARS_IN_DRAFT = true;
}