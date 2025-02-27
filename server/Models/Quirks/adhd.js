import { Quirk } from './quirk.js';

export class ADHD extends Quirk {
    static title = "ADHD";
    static description = ("Attention Deficit Hyperactivity Disorder");
    static likelihood = 1;
    static APPEARS_IN_GENERATION = true;
    static APPEARS_IN_DRAFT = true;
    static POWER_MODIFIER = 0;

    static playerStatGenerationChanges(player, power) {
        player.trickiness += player.focus-1;
        player.focus = -1;      
        return;
    }
}