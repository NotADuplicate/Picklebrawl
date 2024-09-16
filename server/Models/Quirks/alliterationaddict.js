import { Quirk } from './quirk.js';

export class AlliterationAddict extends Quirk {
    POWER_MODIFIER = -1;
    title = "Alliteration Addict";
    description = ("The minimum of your stats is set to the number of players in the game with the same first letter to their name");
}