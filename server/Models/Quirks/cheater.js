import { Quirk } from './quirk.js';

export class Cheater extends Quirk {
    static POWER_MODIFIER = -5;
    static title = "Cheater";
    static description = ("Your team starts with +Sorcery points at the start of the match.");
    static likelihood = 15;
    static APPEARS_IN_GENERATION = true;
    static APPEARS_IN_DRAFT = true;
    static SECOND_START_EFFECT_ORDER = 10;

    static thirdStartGameEffect(match, player, sorcery) {
        player.shotWorth = sorcery;
        console.log("Sorcery: ", sorcery)
        if(match.offenseTeam.players.includes(player)) {
            match.shoot(player, false, true);
        } else {
            match.turnover();
            console.log("Here")
            match.turnedover = false;
            match.shoot(player, false, true);
        }
        player.shotWorth = 2;
    }
}