import { Quirk } from './quirk.js';
import {db} from '../../database.js';

export class Pyromancer extends Quirk {
    static POWER_MODIFIER = -4;
    static title = "Pyromancer";
    static description = ("At the start of the match, shoot a fireball that deals 10*[Sorcery] damage to all players on the other team. ");
    static likelihood = 1;
    static APPEARS_IN_GENERATION = false;
    static APPEARS_IN_DRAFT = true;

    static thirdStartGameEffect(match, player, sorcery) {
        const hpDamage = 10 * sorcery;
        match.players.forEach((p) => {
            if(p.team !== player.team) {
                db.run(`INSERT INTO attack_history (match_id, tick, attacking_player_id, attacked_player_id, `
                    + `damage_done, permanent_injury, percent_health_done) VALUES (?, ?, ?, ?, ?, ?, ?)`, [match.match_id, 1,
                    player.id, p.id, hpDamage, false, 100*hpDamage/p.maxHp], function(err) {
                        if (err) {
                            console.error('Error inserting attack into attack_history:', err.message);
                        }
                });
                p.hp = Math.max(0,p.hp-hpDamage);
            }
        });
    }

    static getLikelihood(season, quirkList) {
        return this.likelihood / (quirkList[this.title] ? quirkList[this.title]+1 : 1);
    }
}