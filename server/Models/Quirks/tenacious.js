import { Quirk } from './quirk.js';

export class Tenacious extends Quirk {
    static POWER_MODIFIER = -2;
    static title = "Tenacious";
    static description = ("When guarding a player with a lower trickiness than your focus, attack them");
    static likelihood = 6;
    static APPEARS_IN_GENERATION = true;
    static APPEARS_IN_DRAFT = true;

    static beTrickedEffect(player, tricker, match) {
        if (player.focus > tricker.trickiness) {
            console.log("Tenacious attacking\n");
            player.attack(match, tricker);
        }
        return true;
    }

    static tickEffect(player, match) {
        if (match.defenseTeam.players.includes(player) && player.defensePriority === "Defend_Score") {
            match.offenseTeam.players.forEach(offender => {
                if (offender.offensePriority === "Score") {
                    this.beTrickedEffect(player, offender, match)
                }
            });
        }
    }
}