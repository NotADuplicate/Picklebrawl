import { Player } from './player.js';
import { Codependent } from './Quirks/codependent.js';
import { db } from '../database.js';
export class Draft {
    players = [];
    draftId;
    leagueId;
    constructor(leagueId) {
        console.log("Starting draft")
        this.leagueId = leagueId;
        const self = this;
        db.run(`INSERT INTO drafts (league_id, currently_drafting_team_id) VALUES (?, (SELECT MIN(id) FROM teams WHERE league_id = ?))`, [leagueId, leagueId], function(err) {
            if (err) {
                console.log(err);
                return;
            }
            self.draftId = this.lastID;
            db.get('SELECT COUNT(*) as teamCount FROM teams WHERE league_id = ?', [leagueId], function(err, row) {
                if (err) {
                    console.log(err);
                    return;
                }
                const numTeams = row.teamCount;
                self.generatePlayers(numTeams);
            });
        });
    }

    generatePlayers(numUsers) {
        const numPlayers = numUsers * 3 + 3;
        for (let i = 0; i < numPlayers; i++) {
            const player = new Player();
            player.pickRandomQuirk(true);
            if(i <= numUsers) { //make sure there is 1 good player per user
                player.randomize_stats(Math.floor(Math.random() * 3) + 16);
            }
            /*else if(i <= numUsers + 2) { //make sure there are 2 codependents
                player.pickSetQuirk(Codependent);
            }*/
            else {
                player.randomize_stats(Math.floor(Math.random() * 8) + 9);
            }
            this.players.push(player);
        }
        const savePlayer = (player, cb) => {
            console.log("Saving player : " + player.name);
            player.save(cb, this.draftId, true);
        };

        for (let i = 0; i < this.players.length; i++) {
            savePlayer(this.players[i], (err) => {
                if (err) {
                    return callback(err);
                }
            });
        }
    }
}