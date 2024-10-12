import { Quirk } from './quirk.js';

export class RockSolid extends Quirk {
    static likelihood = 0; //3
    static POWER_MODIFIER = -1;
    static title = "Rock Solid";
    static description = ("Cannot be tricked");
    static APPEARS_IN_GENERATION = true;
    static APPEARS_IN_DRAFT = true;

    static playerStatGenerationChanges(player, power) {
        console.log("Rock Solid playerStatGenerationChanges\n");
        const totalPoints = Math.round(power * 1/3);
        console.log("Player stats: ", player.bulk, player.finesse, player.height, player.strength, player.trickiness, player.focus);
        const stats = [player.bulk, player.finesse, player.height, player.strength];

        for (let i = 0; i < totalPoints; i++) {
            stats[Math.floor(Math.random()*stats.length)] += 1;
        }
        [player.bulk, player.finesse, player.height, player.strength] = stats;
        player.bulk += Math.floor(power / 4);
        player.focus = 0;
        player.trickiness = 0;        
        return;
    }
}