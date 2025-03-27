import { Quirk } from './quirk.js';

export class AlphabetCompletionist extends Quirk {
    static title = "Alphabet Completionist";
    static description = ("-1 to all stats for each letter not included in the names of each player in the match");
    static POWER_MODIFIER = 8;
    static BASE_STAT_INCREASE = 2;
    static STAT_DECREASE = 1;
    static likelihood = 3;
    static APPEARS_IN_GENERATION = false;
    static APPEARS_IN_DRAFT = true;
    static START_EFFECT_ORDER = 2;

    static playerStatGenerationChanges(player, power) {
        console.log("AlphabetCompletionist playerStatGenerationChanges\n");
        player.finesse += this.BASE_STAT_INCREASE;
        player.bulk += this.BASE_STAT_INCREASE;
        player.height += this.BASE_STAT_INCREASE;
        player.strength += this.BASE_STAT_INCREASE;
        player.intelligence += this.BASE_STAT_INCREASE;
        player.cardio += this.BASE_STAT_INCREASE;
        return;
    }

    static startGameEffect(match, player) {
        // Make string of all names
        let allNames = '';
        match.players.forEach(otherPlayer => {
            console.log(otherPlayer.name)
            allNames = allNames.concat(otherPlayer.name);
        });
        allNames = allNames.toLowerCase();
        console.log(allNames)

        // Use set to count independent letters
        let letterSet = new Set();
        for(let i = 0; i < allNames.length; i++) {
            letterSet.add(allNames[i])
        }

        console.log(letterSet)
        let missingLetters = 27 - letterSet.size
        console.log("Alphabet completionist missing letters: ", missingLetters)

        // Change stats based on missing letters
        player.baseBulk -= missingLetters;
        player.baseFinesse -= missingLetters;
        player.baseHeight -= missingLetters;
        player.baseStrength -= missingLetters;
        player.baseIntelligence -= missingLetters;
        player.baseCardio -= missingLetters;
    }

    static challengeStatModification(players, player) {
        // Make string of all names
        let allNames = '';
        players.forEach(otherPlayer => {
            allNames = allNames.concat(otherPlayer.name);
        });
        allNames = allNames.toLowerCase();
        console.log(allNames);

        // Use set to count independent letters
        let letterSet = new Set();
        for(let i = 0; i < allNames.length; i++) {
            letterSet.add(allNames[i])
            console.log(allNames[i]);
        }

        console.log(letterSet);

        let missingLetters = 27 - letterSet.size

        // Change stats based on missing letters
        player.bulk -= missingLetters;
        player.finesse -= missingLetters;
        player.height -= missingLetters;
        player.strength -= missingLetters;
        player.intelligence -= missingLetters;
        player.cardio -= missingLetters;
        return true;
    }
}