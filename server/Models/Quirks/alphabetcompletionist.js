import { Quirk } from './quirk.js';

export class AlphabetCompletionist extends Quirk {
    description = ("Stats decrease for each letter not included in the names of each player in the match");
    POWER_MODIFIER = 3;
    BASE_STAT_INCREASE = 2;
    STAT_DECREASE = 1;

    playerStatGenerationChanges(player) {
        // TODO
    }

    startGameStatModification(match, player) {
        // Make string of all names
        allNames = '';
        match.offenseTeam.players.forEach(otherPlayer => {
            allNames.append(otherPlayer.name);
        });
        match.defenseTeam.players.forEach(otherPlayer => {
            allNames.append(otherPlayer.name);
        });
        allNames = allNames.toLowerCase();

        // Use set to count independent letters
        let letterSet = new Set();
        for(let i = 0; i < allNames.length; i++) {
            letterSet.add(allNames[i])
        }

        missingLetters = 26 - letterSet.size

        // Change stats based on missing letters
        player.bulk -= missingLetters;
        player.agility -= missingLetters;
        player.height -= missingLetters;
        player.strength -= missingLetters;
        player.baseBulk -= missingLetters;
        player.baseAgility -= missingLetters;
        player.baseHeight -= missingLetters;
        player.baseStrength -= missingLetters;
    }
}