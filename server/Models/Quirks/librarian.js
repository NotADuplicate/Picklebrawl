import { Quirk } from './quirk.js';

export class Librarian extends Quirk {
    static POWER_MODIFIER = -1;
    static title = "Librarian";
    static description = ("Can silence players");
    static likelihood = 2;
    static APPEARS_IN_GENERATION = false;
    static APPEARS_IN_DRAFT = true;

    static extraActions() {
        const actions = {
            "Silence": {
                target: "either",
                description: "At the start of the match, disable a player's quirk",
                offense: true,
                defense: true,
            }
        };
        return actions;
    }
}