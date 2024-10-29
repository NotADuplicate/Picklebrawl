import { Player } from './player.js';
import { Codependent } from './Quirks/codependent.js';
export class Draft {
    players = [];
    draftId;
    leagueId;
    constructor(leagueId) {
        this.leagueId = leagueId;
        const self = this;
        db.run(`INSERT INTO drafts (league_id) VALUES (?)`, [leagueId], function(err) {
            if (err) {
                console.log(err);
                return;
            }
            self.draftId = this.lastID;
            generatePlayers(3);
        });
    }

    generatePlayers(numUsers) {
        const numPlayers = numUsers * 3 + 5;
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