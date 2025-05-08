import { Quirk } from './quirk.js';

export class MoonWorshipper extends Quirk {
    static title = "Moon Worshipper";
    static description = ("Worships the moon");
    static likelihood = 2;
    static APPEARS_IN_GENERATION = true;
    static APPEARS_IN_DRAFT = true;

    static getLikelihood(season, quirkList, leagueCount) {
        const leaderCount = (quirkList["Cult Leader"] ? quirkList["Cult Leader"] : 0);
        const count = (quirkList[this.title] ? quirkList[this.title]+1 : 1);
        return 1+(30*leaderCount / (count*leagueCount));
    }
}