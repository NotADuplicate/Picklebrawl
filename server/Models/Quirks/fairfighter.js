import { Quirk } from './quirk.js';

export class FairFighter extends Quirk {
    static POWER_MODIFIER = -2;
    static title = "Fair Fighter";
    static description = ("All other players (including opponents) with less than 4 strength, get set to 4 strength");
    static likelihood = 2;
    static APPEARS_IN_GENERATION = false;
    static APPEARS_IN_DRAFT = true;
    static START_EFFECT_ORDER = 6;

    static startGameEffect(match, player) {
        for (const otherPlayer of match.players) {
            if (otherPlayer.baseStrength < 4 && otherPlayer !== player) {
                otherPlayer.baseStrength = 4;
            }
        }
    }

    static challengeStatModification(players, player) {
        for (const otherPlayer of players) {
            if (otherPlayer.strength < 4 && otherPlayer !== player) {
                otherPlayer.strength = 4;
            }
        }
    }
}