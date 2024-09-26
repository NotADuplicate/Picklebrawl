import { Quirk } from './quirk.js';

export class AlphabetCompletionist extends Quirk {
    title = "Alphabet Completionist";
    description = ("Stats decrease for each letter not included in the names of each player in the match");
    POWER_MODIFIER = 4;
    BASE_STAT_INCREASE = 2;
    STAT_DECREASE = 1;

    playerStatGenerationChanges(player, power) {
        player.finesse += this.BASE_STAT_INCREASE;
        player.bulk += this.BASE_STAT_INCREASE;
        player.agility += this.BASE_STAT_INCREASE;
        player.height += this.BASE_STAT_INCREASE;
        player.strength += this.BASE_STAT_INCREASE;
        player.trickiness += this.BASE_STAT_INCREASE;
        player.focus += this.BASE_STAT_INCREASE;
        return;
    }

    startGameStatModification(match, player) {
        // Make string of all names
        let allNames = '';
        match.players.forEach(otherPlayer => {
            allNames.concat(otherPlayer.name);
        });
        allNames = allNames.toLowerCase();

        // Use set to count independent letters
        let letterSet = new Set();
        for(let i = 0; i < allNames.length; i++) {
            letterSet.add(allNames[i])
        }

        let missingLetters = 26 - letterSet.size

        // Change stats based on missing letters
        player.baseBulk -= missingLetters;
        player.baseFinesse -= missingLetters;
        player.baseHeight -= missingLetters;
        player.baseStrength -= missingLetters;
        player.baseTrickiness -= missingLetters;
        player.baseFocus -= missingLetters;
    }

    challengeStatModification(players, player) {
        // Make string of all names
        console.log("HERE\n")
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

        let missingLetters = 26 - letterSet.size

        // Change stats based on missing letters
        player.bulk -= missingLetters;
        player.finesse -= missingLetters;
        player.height -= missingLetters;
        player.strength -= missingLetters;
        player.trickiness -= missingLetters;
        player.focus -= missingLetters;
        return true;
    }
}