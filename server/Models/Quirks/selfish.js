import { Quirk } from './quirk.js';

export class Selfish extends Quirk {
    static POWER_MODIFIER = 5;
    static title = "Selfish";
    static description = ("All teammates get -1 to all stats");
    static STAT_DECREASE = 1;
    static likelihood = 2;
    static APPEARS_IN_GENERATION = false;
    static APPEARS_IN_DRAFT = true;
    static START_EFFECT_ORDER = 2;

    static startGameEffect(match, player) {
        match.players.forEach((otherPlayer) => {
            if(otherPlayer.team === player.team && otherPlayer !== player) {
            otherPlayer.baseFinesse -= this.STAT_DECREASE;
            otherPlayer.baseBulk -= this.STAT_DECREASE;
            otherPlayer.baseFocus -= this.STAT_DECREASE;
            otherPlayer.baseHeight -= this.STAT_DECREASE;
            otherPlayer.baseStrength -= this.STAT_DECREASE;
            otherPlayer.baseTrickiness -= this.STAT_DECREASE;
            }
        });
    }

    static challengeStatModification(players, player) {
        players.forEach((otherPlayer) => {
            if(otherPlayer.team === player.team && otherPlayer !== player) {
                otherPlayer.finesse -= this.STAT_DECREASE;
                otherPlayer.bulk -= this.STAT_DECREASE;
                otherPlayer.focus -= this.STAT_DECREASE;
                otherPlayer.height -= this.STAT_DECREASE;
                otherPlayer.strength -= this.STAT_DECREASE;
                otherPlayer.trickiness -= this.STAT_DECREASE;
            }
        });
    }
}