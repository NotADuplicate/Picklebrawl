import { Quirk } from './quirk.js';

export class Exhausting extends Quirk {
    static POWER_MODIFIER = -3;
    static title = "Exhausting";
    static description = ("When in a match, ALL other players take double damage from exhaustion." );
    static likelihood = 3;
    static APPEARS_IN_GENERATION = true;
    static APPEARS_IN_DRAFT = true;

    static tickEffect(player, match) {
        match.doCardio();
    }

    static getLikelihood(season, quirkList) {
        return this.likelihood / (quirkList[this.title] ? quirkList[this.title]+1 : 1);
    }
}