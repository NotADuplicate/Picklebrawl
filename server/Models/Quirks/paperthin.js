import { Quirk } from './quirk.js';

export class PaperThin extends Quirk {
    static POWER_MODIFIER = 2;
    static title = "Paper Thin";
    static description = ("Can't guard anyone with a higher bulk");
    static likelihood = 0; //3
    static APPEARS_IN_GENERATION = true;
    static APPEARS_IN_DRAFT = true;
}