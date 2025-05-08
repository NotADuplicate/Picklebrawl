import {Player} from './player.js';
import {db} from '../database.js';

class Team {
    players;
    score;
    teamName;
    owner_id;
    owner;
    teamId;
    leagueId;
    scoreRange = 30;
    full_dead = false;
    sorcery;

    constructor() {
        this.players = [];
    }

    async setInfo(teamName, owner_id, leagueId, generatePlayers = true) {
        return new Promise(async (resolve, reject) => {
            this.teamName = teamName;
            this.owner_id = owner_id;
            this.leagueId = leagueId;
            console.log("NEW TEAM: " + teamName);
            if (generatePlayers) 
                await this.generatePlayers();
            resolve();
        })
    }

    save(callback) {
        console.log("Saving team");
        const self = this;
        db.run(`INSERT INTO teams (name, league_id, owner_id) VALUES (?, ?, ?)`, [this.teamName, this.leagueId, this.owner_id], function(err) {
            if (err) {
                console.log("Error saving team: " + err);
                return callback(err);
            }

            self.teamId = this.lastID;
            console.log("Team ID: " + self.teamId);

            // Save players and associate them with the team
            const savePlayer = (player, cb) => {
                player.save(cb, self.teamId, false);
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
    }

    getPlayers() {
        return this.players;
    }

    async generatePlayers() {
        for (let i = 0; i < 6; i++) {
            const player = new Player();
            await player.pickRandomQuirk(false, this.leagueId);
            player.randomize_stats(Math.floor(Math.random() * 3) + 17);
            this.addPlayer(player);
        }
    }

    async load(id) {
        return new Promise((resolve, reject) => {
            db.get(`SELECT * FROM teams, users WHERE users.id = teams.owner_id AND teams.id = ?`, [id], (err, row) => {
                if (err) {
                    console.log("Error loading team: " + err);
                    reject(err);
                }

                this.teamName = row.name;
                this.owner = row.username;
                this.leagueId = row.league_id;
                this.teamId = id;
                console.log("Loaded team: " + this.teamName);
                resolve();
            });
        });
    }
}
export {Team};