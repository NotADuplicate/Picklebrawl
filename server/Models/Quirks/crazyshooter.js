import { Quirk } from './quirk.js';

export class CrazyShooter extends Quirk {
    static title = "Crazy Shooter";
    static description = ("Always has a chance to take a shot from anywhere on the field. Crazy shots are more likely to go in");
    static likelihood = 1;
    static APPEARS_IN_GENERATION = true;
    static APPEARS_IN_DRAFT = true;
    static SHOT_CHANCE = 0.05;
    static FINESSE_BONUS = 3;

    tickEffect(player, match) {
        if (match.offenseTeam.players.includes(player) && Math.random() < SHOT_CHANCE) {
            if(match.turnedOver == false) {
                player.finesse += FINESSE_BONUS;
                match.shoot(player);
                player.finesse -= FINESSE_BONUS;
            }
        }
    }
}