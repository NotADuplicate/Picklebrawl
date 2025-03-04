import { Quirk } from './quirk.js';
import {db} from '../../database.js';

export class ScissorSharp extends Quirk {
    static POWER_MODIFIER = -3;
    static likelihood = 3;
    static title = "Scissor Sharp";
    static description = "When attacking players, attacks them as if their bulk is equal to their focus. Beware of rocks"
    static APPEARS_IN_GENERATION = true;
    static APPEARS_IN_DRAFT = true;

    static attackEffect(player, target, match) {
        if(target.quirk.title !== "Paper Thin") {
            const damage = Math.random() * (player.strength + player.tempStrength)*3/4;
            const defense = Math.random() * (target.focus + target.protectBulk);
            const finalDamage = (damage - defense)+0.25;
            if (finalDamage < 0) {
                return;
            }
            target.tempInjury += finalDamage;

            const hpDamage = target.quirk.DAMAGE_TAKEN_MODIFIER*2*(Math.random(0,finalDamage)*player.ATTACK_MODIFIER) + 1.5;
            db.run(`INSERT INTO attack_history (match_id, tick, attacking_player_id, attacked_player_id, `
                + `damage_done, permanent_injury, percent_health_done) VALUES (?, ?, ?, ?, ?, ?, ?)`, [match.match_id, match.gameTicks,
                    player.id, target.id, hpDamage, false, 100*hpDamage/target.maxHp], function(err) {
                    if (err) {
                        console.error('Error inserting attack into attack_history:', err.message);
                    }
            });
            target.hp = Math.max(0,target.hp-hpDamage);
            if(target.hp == 0) {
                target.knockout(match);
            }
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