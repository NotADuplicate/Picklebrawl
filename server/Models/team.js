import {Player} from './player.js';
import {db} from '../database.js';

class Team {
    players;
    score;
    teamName;
    owner;
    teamId;
    leagueId;
    scoreRange = 20;

    constructor(teamName, owner, leagueId, loadTeamId, generatePlayers = true) {
        console.log(loadTeamId);
        this.players = [];
        if(loadTeamId != null) {
            this.load(loadTeamId);
        }
        else {
            this.teamName = teamName;
            this.owner = owner;
            this.leagueId = leagueId;
            console.log("NEW TEAM: " + teamName);
            if (generatePlayers) 
                this.generatePlayers();
        }
    }

    save(callback) {
        console.log("Saving team");
        const self = this;
        db.run(`INSERT INTO teams (name, league_id, owner) VALUES (?, ?, ?)`, [this.teamName, this.leagueId, this.owner], function(err) {
            if (err) {
                console.log("Error saving team: " + err);
                return callback(err);
            }

            self.teamId = this.lastID;
            console.log("Team ID: " + self.teamId);

            // Save players and associate them with the team
            const savePlayer = (player, cb) => {
                console.log("Saving player : " + player.name);
                player.save(cb, self.teamId);
            };

            for (let i = 0; i < self.players.length; i++) {
                savePlayer(self.players[i], (err) => {
                    if (err) {
                        return callback(err);
                    }
                });
            }
            console.log("Team saved");
        });
        
        callback(null);
    }

    addPlayer(player) {
        this.players.push(player);
        console.log("Team added player: " + player.bulk + " " + player.finesse + " " + player.height + " " + player.strength);
    }

    getPlayers() {
        return this.players;
    }

    generatePlayers() {
        for (let i = 0; i < 8; i++) {
            const player = new Player();
            player.pickRandomQuirk();
            player.randomize_stats(10 + Math.floor(Math.random()*5));
            //player.distribute_stats(10 + Math.floor(Math.random()*5));
            this.addPlayer(player);
        }
    }

    load(id) {
        const self = this;
        console.log("Trying to load")
        db.get(`SELECT * FROM teams WHERE id = ?`, [id], (err, row) => {
            if (err) {
                console.log("Error loading team: " + err);
                return;
            }

            self.teamName = row.name;
            self.owner = row.owner;
            self.leagueId = row.league_id;
            console.log("Loaded team: " + self.teamName);
        });
        console.log("Finished loading db command")
    }
}
export {Team};