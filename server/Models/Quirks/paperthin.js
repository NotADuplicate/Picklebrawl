import { Quirk } from './quirk.js';
import {db} from '../../database.js';

export class PaperThin extends Quirk {
    static POWER_MODIFIER = 3;
    static title = "Paper Thin";
    static description = "Takes double damage. Scared of scissors"
    static likelihood = 3
    static APPEARS_IN_GENERATION = true;
    static APPEARS_IN_DRAFT = true;
    static DAMAGE_TAKEN_MODIFIER = 2;

    static attackEffect(player, target, match) {
        if(target.quirk.title !== "Rock Solid") {
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