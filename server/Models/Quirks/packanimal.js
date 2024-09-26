import { Quirk } from './quirk.js';

export class PackAnimal extends Quirk {
    POWER_MODIFIER = 2;
    title = "Pack Animal";
    description = ("Sets your highest stat(s) to 1 unless someone else has this quirk");

    //Since this quirk decreases your highest stat, the generation should prevent having multiple stats tied for highest
    playerStatGenerationChanges(player, power) {
        // Find the highest stat value
        const stats = {
            finesse: player.finesse,
            bulk: player.bulk,
            agility: player.agility,
            height: player.height,
            strength: player.strength,
            trickiness: player.trickiness,
            focus: player.focus
        };

        const highestValue = Math.max(...Object.values(stats));
        const highestStats = Object.keys(stats).filter(stat => stats[stat] === highestValue);

        // If there are multiple stats tied for the highest value
        if (highestStats.length > 1) {
            // Take one point from the first stat and give it to the second stat
            const statToDecrease = highestStats[0];
            const statToIncrease = highestStats[1];

            player[statToDecrease] -= 1;
            player[statToIncrease] += 1;
        }
        return;
    }

    startGameStatModification(match, player) {
        for (const otherPlayer of match.players) {
            if (otherPlayer.quirk instanceof PackAnimal && otherPlayer !== player) {
                return;
            }
        }
        const stats = {
            finesse: player.baseFinesse,
            bulk: player.baseBulk,
            height: player.baseHeight,
            strength: player.baseStrength,
            trickiness: player.baseTrickiness,
            focus: player.baseFocus
        };

        const highestValue = Math.max(Object.values(stats));
        const highestStats = Object.keys(stats).filter(stat => stats[stat] === highestValue);

        // Set the highest stat to 1
        for (const stat of highestStats) {
            player[stat] = 1;
        }
    }

    challengeStatModification(players, player) {
        console.log("Pack Animal challenge stat modification");
        for(const otherPlayer of players) {
            if(otherPlayer != player && otherPlayer.quirk instanceof PackAnimal) {
                return false;
            }
        }
        const stats = {
            finesse: player.finesse,
            bulk: player.bulk,
            height: player.height,
            strength: player.strength,
            trickiness: player.trickiness,
            focus: player.focus
        };
        console.log("Not in a pack")

        console.log(stats);
        const highestValue = Math.max(...Object.values(stats));
        console.log(highestValue);
        const highestStats = Object.keys(stats).filter(stat => stats[stat] === highestValue);
        console.log(highestStats);

        // Set the highest stat to 1
        for (const stat of highestStats) {
            player[stat] = 1;
            console.log("Set " + stat + " to 1");
        }
    }
}