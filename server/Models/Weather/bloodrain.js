import { Weather } from './weather.js';

export class Bloodrain extends Weather {
    description = "Violence is increased: injuries are more likely to occur, do higher damage, and be permanent";

    // TODO: once quirks are added, make it secretly power up vampires
    // TODO: add permanent injury chance, once permanent injury is back in the game

    DAMAGE_DONE_MODIFIER = 1.2;

    attackEffect(player, target) {
        console.log("BLOODRAIN")
        console.log(player.name + " is attacking " + target.name + " and they're extra violent from "
            + "the blood rain!"
        ); 
        const damage = Math.floor(Math.random() * (player.strength + player.tempStrength) * this.DAMAGE_DONE_MODIFIER);
        const defense = Math.floor(Math.random() * (target.bulk + target.protectBulk));
        const finalDamage = damage - defense;
        if (finalDamage < 0) {
            console.log(target.name + " defended the attack");
            return;
        }
        console.log(player.name + " dealt " + finalDamage + " damage to " + target.name);
        target.tempInjury += finalDamage;
    }
}