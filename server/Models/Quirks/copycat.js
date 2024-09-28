import { Quirk } from './quirk.js';

export class Copycat extends Quirk {
    static POWER_MODIFIER = -1;
    static title = "Copycat";
    static description = ("Can mimic players, taking their stats");
    static likelihood = 1;
    static APPEARS_IN_GENERATION = false;
    static APPEARS_IN_DRAFT = true;

    static extraActions() {
        const actions = {
            "Mimic": {
                target: "either",
                description: "At the start of the match set all of your stats to this player's stats",
                offense: true,
                defense: true,
            }
        };
        return actions;
    }
}