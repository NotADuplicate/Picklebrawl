import { Quirk } from './quirk.js';

export class CrazyShooter extends Quirk {
    static title = "Crazy Shooter";
    static description = ("Always has a chance to take a shot from anywhere on the field. Crazy shots always have exactly a 30% chance of success.");
    static likelihood = 1;
    static APPEARS_IN_GENERATION = false;
    static APPEARS_IN_DRAFT = true;
}