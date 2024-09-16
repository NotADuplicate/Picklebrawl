import { Quirk } from './quirk.js';

export class PackAnimal extends Quirk {
    POWER_MODIFIER = 2;
    title = "Pack Animal";
    description = ("Sets your highest stat to 1 unless someone else has this quirk");
}