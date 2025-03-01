import { Quirk } from './quirk.js';

export class StarWorshipper extends Quirk {
    static likelihood = 4; //2
    static title = "Star Worshipper";
    static description = ("Worships the stars");
    static APPEARS_IN_GENERATION = true;
    static APPEARS_IN_DRAFT = false;
    static START_EFFECT_ORDER = 5;
}