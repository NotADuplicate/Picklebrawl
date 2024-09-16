import { Quirk } from './quirk.js';

export class WeakestLink extends Quirk {
    playerStatGenerationChanges(player, power) {
        player.finesse = 0;
        player.strength = 0;
        player.trickiness = 0;
        player.focus = 0;
        player.height = 0;
        player.bulk = 0;
        return;
    }

    title = "Weakest Link";
    description = ("All of your stats are set to double the lowest of that stat on your team");
}