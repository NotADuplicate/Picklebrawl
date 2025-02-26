import { Quirk } from './quirk.js';
import {db} from '../../database.js';

export class ScissorSharp extends Quirk {
    static likelihood = 3;
    static title = "Scissor Sharp";
    static description = ("Attacks deal no permanent damage but are twice as effective at reducing the target's stats while they are being attacked.");
    static APPEARS_IN_GENERATION = true;
    static APPEARS_IN_DRAFT = true;

    static attackEffect(player, target) {
        if(target.quirk.title !== "Paper Thin") {
            const damage = Math.random() * (player.strength + player.tempStrength)*3/4;
            const defense = Math.random() * (target.bulk + target.protectBulk);
            const finalDamage = (damage - defense)+0.25;
            if (finalDamage < 0) {
                return;
            }
            target.tempInjury += 2*finalDamage;
            return 1;
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