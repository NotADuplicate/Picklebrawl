import { Quirk } from './quirk.js';

export class SecondWind extends Quirk {
    static likelihood = 4;
    static POWER_MODIFIER = -5;
    static STAT_BOOST = 2;
    static title = "Second Wind";
    static description = ("+Sorcery to physical stats in the second half of the game.");
    static APPEARS_IN_GENERATION = true;
    static APPEARS_IN_DRAFT = true;

    static halftimeEffect(match, player, sorcery) {
        player.bulk += sorcery;
        player.height += sorcery;
        player.strength += sorcery;
        player.finesse += sorcery;
        player.cardio += sorcery;
        player.baseBulk += sorcery;
        player.baseHeight += sorcery;
        player.baseStrength += sorcery;
        player.baseFinesse += sorcery;
        player.baseIntelligence += sorcery;
        player.baseCardio += sorcery;
    }
}