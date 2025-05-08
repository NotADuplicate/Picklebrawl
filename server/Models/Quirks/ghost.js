import { Quirk } from './quirk.js';

export class Ghost extends Quirk {
    static POWER_MODIFIER = -2;
    static title = "Ghost";
    static description = ("Counts as non-existent for any other players' quirk stat calculations");
    static likelihood = 3;
    static APPEARS_IN_GENERATION = false;
    static APPEARS_IN_DRAFT = true;

    static getLikelihood(season, quirkList) {
        return this.likelihood / (quirkList[this.title] ? quirkList[this.title]+1 : 1);
    }
}