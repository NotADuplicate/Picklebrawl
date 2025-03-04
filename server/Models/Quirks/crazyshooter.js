import { Quirk } from './quirk.js';

export class CrazyShooter extends Quirk {
    static title = "Crazy Shooter";
    static description = ("Always has a chance to take a shot from anywhere on the field regardless of what action they're set to. Crazy shots are more likely to go in");
    static likelihood = 1;
    static APPEARS_IN_GENERATION = true;
    static APPEARS_IN_DRAFT = true;
    static SHOT_CHANCE = 0.15;
    static FINESSE_BONUS = 4;

    static tickEffect(player, match) {
        if (match.offenseTeam.players.includes(player) && Math.random() < this.SHOT_CHANCE) {
            if(match.turnedover == false) {
                console.log("Crazy Shooter Shot \n\n");
                player.finesse += this.FINESSE_BONUS;
                match.shoot(player, false);
                player.finesse -= this.FINESSE_BONUS;
            }
        }
    }
}