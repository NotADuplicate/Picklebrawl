import { Team } from '../server/Models/team.js'; // Adjust the path as necessary
import { Player } from '../server/Models/player.js'; // Adjust the path as necessary
import { Match } from '../server/Models/match.js'; // Adjust the path as necessary
import * as weather from '../server/Models/Weather/index.js'
import { use } from 'chai';
import { db } from '../server/database.js';

// This file will create matches directly in the db

/* Create users, so we can create league, then teams are created, then 
challenge, then we need to create player actions
*/


const username = "username"
const password = "password"
const username2 = "username2"

const leagueName = "leagueName"
const leaguePassword = "leaguePassword"
let leagueId = -1
const teamName = "teamName"
const teamName2 = "teamName2"

createMatch()

async function createMatch() {
    await createAccount(username, password)
    console.log("created acc 1")
    await createAccount(username2, password)
    console.log("created acc 2")
    //let leagueId = await createLeague(leagueName, leaguePassword)
    await createLeague(leagueName, leaguePassword)
    console.log("created league")
    await generateTeam(username)
    // awaits aren't working
}


// Must create user accounts before league
function createAccount(username, password) {
    return new Promise((resolve, reject) => {
        db.run(`INSERT INTO users (username, password) VALUES (?, ?)`,
            [username, password], function(err) {
                if (err) {
                    console.log("createDummyMatches createAccount not working: ", err)
                }
            }
        )
        .then(resolve())
    })
}

// Then can create a league
function createLeague(leagueName, leaguePassword) {
    return new Promise((resolve, reject) => {
        db.run(`INSERT INTO leagues (name, password, founder, started) VALUES (?, ?, ?, ?)`,
            [leagueName, leaguePassword, username, 0], function(err) {
                leagueId = this.lastID
                if (err) {
                    console.log("createDummyMatches createLeague first layer not working: ", err)
                }

                // Add both players to leagueUsers
                db.run(`INSERT INTO leagueUsers (league_id, username) VALUES (?, ?)`,
                    [leagueId, username], function(err) {
                        if (err) {
                            console.log("createDummyMatches createLeague second layer not working: ", err)
                        }
                        db.run(`INSERT INTO leagueUsers (league_id, username) VALUES (?, ?)`,
                            [leagueId, username2], function(err) {
                                if (err) {
                                    console.log("createDummyMatches createLeague third layer not working: ", err)
                                }
                            }
                        )
                    }
                )
            }
        )
        .then(resolve({ leagueId }))
    })
}

// Create teams
function generateTeam(username) {
    return new Promise((resolve, reject) => {
        db.run(`INSERT INTO teams (name, league, owner) VALUES (?, ?, ?)`,
            [teamName, leagueId, username], function(err) {
                console.log("createDummyMatches generateTeam in teams table not working: ", err)
            }
        ).then(resolve())
    })
}

//Then can add players to the challenge
function addPlayers() {
    fetch(`/challenges/${1}/add-players`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // Add the token here
        },
        body: JSON.stringify({ teamId, players })
    })
}