import { Quirk } from './quirk.js';

export class RockSolid extends Quirk {

    playerStatGenerationChanges(player, power) {
        const totalPoints = Math.round(power * 1/2);
        console.log("Player stats: ", player.bulk, player.finesse, player.height, player.strength, player.trickiness, player.focus);
        const stats = [player.bulk, player.finesse, player.height, player.strength];

        for (let i = 0; i < totalPoints; i++) {
            stats[Math.floor(Math.random()*stats.length)] += 1;
        }
        [player.bulk, player.finesse, player.height, player.strength] = stats;
        player.bulk += Math.floor(power / 5);
        player.focus = 0;
        player.trickiness = 0;        
        return;
    }

    POWER_MODIFIER = -1;
    title = "Rock Solid";
    description = ("Cannot be tricked");
}