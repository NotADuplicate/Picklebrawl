import { Quirk } from './quirk.js';

export class Duplicitous extends Quirk {
    static POWER_MODIFIER = -2;
    static title = "Duplicitous";
    static description = ("Your chance to trick players is doubled");
    static likelihood = 6;
    static APPEARS_IN_GENERATION = true;
    static APPEARS_IN_DRAFT = true;
}