import {Player} from './player.js';
import {db} from '../database.js';

class Team {
    players;
    score;
    teamName;
    owner;
    leagueId;
    scoreRange = 30;

    constructor(teamName, owner, leagueId, generatePlayers = true) {
        this.teamName = teamName;
        this.owner = owner;
        this.leagueId = leagueId;
        this.players = [];
        console.log("NEW TEAM: " + teamName);
        if (generatePlayers) 
            this.generatePlayers();
    }

    save(callback) {
        console.log("Saving team");
        const self = this;
        db.run(`INSERT INTO teams (name, league_id, owner) VALUES (?, ?, ?)`, [this.teamName, this.leagueId, this.owner], function(err) {
            if (err) {
                console.log("Error saving team: " + err);
                return callback(err);
            }

            const teamId = this.lastID;
            console.log("Team ID: " + teamId);

            // Save players and associate them with the team
            const savePlayer = (player, cb) => {
                console.log("Saving player : " + player.name);
                player.save(cb, teamId);
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
        console.log(player.bulk + " " + player.agility + " " + player.height + " " + player.strength);
    }

    getPlayers() {
        return this.players;
    }

    generatePlayers() {
        for (let i = 0; i < 5; i++) {
            const player = new Player();
            player.randomize_stats(10 + Math.floor(Math.random()*5));
            this.addPlayer(player);
        }
    }
}
export {Team};