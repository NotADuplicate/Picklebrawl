import {Player} from './player.js';
import {db} from '../database.js';

class Team {
    players;
    score;
    teamName;
    owner;
    teamId;
    leagueId;
    scoreRange = 30;

    constructor() {
        this.players = [];
    }

    setInfo(teamName, owner, leagueId, generatePlayers = true) {
        this.teamName = teamName;
        this.owner = owner;
        this.leagueId = leagueId;
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
            callback(null);
        });
    }

    addPlayer(player) {
        this.players.push(player);
        console.log("Team " + this.teamName + " added player " + player.name);
    }

    getPlayers() {
        return this.players;
    }

    generatePlayers() {
        for (let i = 0; i < 10; i++) {
            const player = new Player();
            player.pickRandomQuirk(false);
            player.randomize_stats(Math.floor(Math.random() * 5) + 10);
            this.addPlayer(player);
        }
    }

    async load(id) {
        return new Promise((resolve, reject) => {
            db.get(`SELECT * FROM teams WHERE id = ?`, [id], (err, row) => {
                if (err) {
                    console.log("Error loading team: " + err);
                    reject(err);
                }

                this.teamName = row.name;
                this.owner = row.owner;
                this.leagueId = row.league_id;
                this.teamId = row.id;
                console.log("Loaded team: " + this.teamName);
                resolve();
            });
        });
    }
}
export {Team};