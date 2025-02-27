import { Quirk } from './quirk.js';

export class WildCard extends Quirk {
    static POWER_MODIFIER = 3;
    static title = "Wild Card";
    static description = ("After being locked into a game (but before deciding actions) redistribute all stats");
    static likelihood = 2;
    static APPEARS_IN_GENERATION = false;
    static APPEARS_IN_DRAFT = true;
    static START_EFFECT_ORDER = 1;

    static seededRandom(seed) {
        let x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    }

    static startGameEffect(match, player) {
        // Generate a random seed based on the ids of all the players
        let seed = match.players.map(p => p.id).sort().join('');
        console.log("GAME SEED: ", seed);

        // Calculate total stats
        const totalStats = player.baseFinesse + player.baseBulk + player.baseHeight + player.baseStrength + player.baseTrickiness + player.baseFocus;

        // Set all player stats to 0
        player.baseFinesse = 0;
        player.baseBulk = 0;
        player.baseHeight = 0;
        player.baseStrength = 0;
        player.baseTrickiness = 0;
        player.baseFocus = 0;

        // Redistribute stats randomly
        const stats = ['baseFinesse', 'baseBulk', 'baseHeight', 'baseStrength', 'baseTrickiness', 'baseFocus'];

        for (let i = 0; i < totalStats; i++) {
            player[stats[Math.floor(this.seededRandom(seed) * stats.length)]]++;
            seed++;
        }
        console.log("Game Wild card player: ", player.baseBulk, " ", player.baseFocus, " ", player.baseHeight, " ", player.baseStrength, " ", player.baseTrickiness, " ", player.baseFinesse)
    }

    static challengeStatModification(players, player) {
        // Generate a random seed based on the ids of all the players
        let seed = players.map(p => p.id).sort().join('');
        console.log("Challenge SEED: ", seed);

        // Calculate total stats
        const totalStats = player.baseFinesse + player.baseBulk + player.baseHeight + player.baseStrength + player.baseTrickiness + player.baseFocus;

        // Set all player stats to 0
        player.finesse = 0;
        player.bulk = 0;
        player.strength = 0;
        player.height = 0;
        player.trickiness = 0;
        player.focus = 0;

        // Redistribute stats randomly
        const stats = ['finesse', 'bulk', 'height', 'strength', 'trickiness', 'focus'];

        for (let i = 0; i < totalStats; i++) {
            player[stats[Math.floor(this.seededRandom(seed) * stats.length)]]++;
            seed++;
        }
    }
}