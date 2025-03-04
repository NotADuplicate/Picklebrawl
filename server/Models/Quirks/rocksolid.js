import { Quirk } from './quirk.js';
import {db} from '../../database.js';

export class RockSolid extends Quirk {
    static likelihood = 3;
    static POWER_MODIFIER = -2;
    static title = "Rock Solid";
    static description = ("Cannot be tricked. Scared of paper");
    static APPEARS_IN_GENERATION = true;
    static APPEARS_IN_DRAFT = true;

    static playerStatGenerationChanges(player, power) {
        console.log("Rock Solid playerStatGenerationChanges\n");
        player.bulk += player.focus+player.trickiness-1
        player.focus = 0;
        player.trickiness = 0;
        return;
    }

    static beTrickedEffect(player, tricker, match) {
        return false;
    }

    static attackEffect(player, target, match) {
        if(target.quirk.title !== "Scissor Sharp") {
            return null;
        }
        
        db.run(`INSERT INTO attack_history (match_id, tick, attacking_player_id, attacked_player_id, `
            + `damage_done, permanent_injury, percent_health_done) VALUES (?, ?, ?, ?, ?, ?, ?)`, [match.match_id, match.gameTicks,
            player.id, target.id, 100, false, 100], function(err) {
                if (err) {
                    console.error('Error inserting attack into attack_history:', err.message);
                }
        });
        target.hp = 0
        target.knockout(match);
        return 1;
    }
}