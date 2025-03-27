import { Quirk } from './quirk.js';

export class Codependent extends Quirk {
    static POWER_MODIFIER = 5;
    static title = "Codependent";
    static description = ("Sets your highest stat(s) to 1 unless someone else has this quirk");
    static likelihood = 3;
    static APPEARS_IN_GENERATION = false;
    static APPEARS_IN_DRAFT = true;

    //Since this quirk decreases your highest stat, the generation should prevent having multiple stats tied for highest
    static playerStatGenerationChanges(player, power) {
        // Find the highest stat value
        const stats = {
            finesse: player.finesse,
            bulk: player.bulk,
            height: player.height,
            strength: player.strength,
            intelligence: player.intelligence,
            cardio: player.cardio
        };

        console.log(stats);
        const highestValue = Math.max(...Object.values(stats));
        console.log("Highest value: " + highestValue);
        const highestStats = Object.keys(stats).filter(stat => stats[stat] === highestValue);
        console.log("Highest stats: " + highestStats);

        // If there are multiple stats tied for the highest value
        if (highestStats.length > 1) {
            // Take one point from the first stat and give it to the second stat
            const statToDecrease = highestStats[0];
            const statToIncrease = highestStats[1];

            console.log(stats)
            console.log("Decreasing " + statToDecrease + " and increasing " + statToIncrease);

            player[statToDecrease] -= 1;
            player[statToIncrease] += 1;
        }
        return;
    }

    static startGameEffect(match, player) {
        for (const otherPlayer of match.players) {
            if (otherPlayer.quirk.title == "Codependent" && otherPlayer !== player) {
                return;
            }
        }
        const stats = {
            finesse: player.baseFinesse,
            bulk: player.baseBulk,
            height: player.baseHeight,
            strength: player.baseStrength,
            intelligence: player.baseIntelligence,
            cardio: player.baseCardio
        };

        const highestValue = Math.max(Object.values(stats));
        const highestStats = Object.keys(stats).filter(stat => stats[stat] === highestValue);

        // Set the highest stat to 1
        for (const stat of highestStats) {
            player[stat] = 1;
        }
    }

    static challengeStatModification(players, player) {
        for(const otherPlayer of players) {
            if(otherPlayer != player && otherPlayer.quirk instanceof Codependent) {
                return false;
            }
        }
        const stats = {
            finesse: player.finesse,
            bulk: player.bulk,
            height: player.height,
            strength: player.strength,
            intelligence: player.intelligence,
            cardio: player.cardio
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