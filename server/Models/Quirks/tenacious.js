import { Quirk } from './quirk.js';

export class Tenacious extends Quirk {
    static POWER_MODIFIER = -2;
    static title = "Tenacious";
    static description = ("More effective when targeting a player with a lower trickiness than your focus");
    static likelihood = 6;
    static APPEARS_IN_GENERATION = true;
    static APPEARS_IN_DRAFT = true;
}