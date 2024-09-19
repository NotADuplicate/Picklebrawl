import { Quirk } from './quirk.js';

export class Bully extends Quirk {
    POWER_MODIFIER = -4;
    title = "Bully";
    description = ("When advancing, attack any player who defends you.");
}