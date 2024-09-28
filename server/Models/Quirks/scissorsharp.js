import { Quirk } from './quirk.js';

export class ScissorSharp extends Quirk {
    static likelihood = 3;
    static title = "Scissor Sharp";
    static description = ("Attacks more effectively, but cannot inflict permenant injuries");
    static APPEARS_IN_GENERATION = true;
    static APPEARS_IN_DRAFT = true;
}