import { Weather } from './weather.js';

export class Karmaclouds extends Weather {
    description = "Attackers have a 1/3 chance of damage that would otherwise be applied to their "
    + "target being applied to them instead";

    // TODO: reimplement permanent injury if we decide to do that

    REBOUND_DAMAGE_CHANCE = 1/3;

    attackEffect(player, target) {
        console.log("BLOODRAIN")
        console.log(player.name + " is attacking " + target.name); 
        const damage = Math.floor(Math.random() * (player.strength + player.tempStrength));
        const defense = Math.floor(Math.random() * (target.bulk + target.protectBulk));
        const finalDamage = (damage - defense);
        if (finalDamage < 0) {
            console.log(target.name + " defended the attack");
            return;
        }
        
        // Implement the karma clouds
        if(Math.random() < this.REBOUND_DAMAGE_CHANCE) {
            console.log(player.name + " dealt " + finalDamage + " damage to themselves when the "
                + "karma clouds intercepted their attempted attack on " + target.name
            );
            player.tempInjury += finalDamage;
        }
        else{
            console.log(player.name + " dealt " + finalDamage + " damage to " + target.name);
            target.tempInjury += finalDamage;
        }
    }
}