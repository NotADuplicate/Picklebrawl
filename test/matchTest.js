import { Team } from '../server/Models/team.js'; // Adjust the path as necessary
import { Player } from '../server/Models/player.js'; // Adjust the path as necessary
import { Match } from '../server/Models/match.js'; // Adjust the path as necessary
import * as weather from '../server/Models/Weather/index.js'
import { use } from 'chai';
import { db } from '../server/database.js';


const username = "username"
const password = "password"
const username2 = "username2"

const leagueName = "leagueName"
const leaguePassword = "leaguePassword"
const teamName = "teamName"
const teamName2 = "teamName2"

createMatch()

async function createMatch() {
    await createAccount(username, password)
    await createAccount(username2, password)
    await createLeague(leagueName, leaguePassword, username, teamName)
    await joinLeague(leagueName, leaguePassword, username2, teamName2)
    await getTeamIds(leagueName, leaguePassword)
}


//Must create user accounts before league
function createAccount(username, password) {
    return new Promise((resolve, reject) => {
        fetch('/create-account', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        }).then(resolve())
    })
}


//Then can create a league
function createLeague(leagueName, leaguePassword, username, teamName) {
    return new Promise((resolve, reject) => {
        fetch('/create-league', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ leagueName, leaguePassword, username, teamName })
        }).then(resolve({ teamId }))
    })
}

//Then join the league
function joinLeague(leagueName, leaguePassword, username, teamName) {
    return new Promise((resolve, reject) => {
        fetch('/join-league', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ leagueName, leaguePassword, username, teamName })
        }).then(resolve({ teamId }))
    })
}

// Get teamIds
function getTeamIds(leagueName, leaguePassword) {
    return new Promise((resolve, reject) => {
        let ids = db.run(`SELECT id 
                FROM teams
                LEFT JOIN leagues ON teams.league_id = leagues.id 
                WHERE leagues.name = ${leagueName} AND leagues.password = ${leaguePassword}`)
        console.log(ids)
    }).then(resolve({ ids }))
}

//Then can create a challenge
function createChallenge() {    // need teamIds
    fetch(`/challenges`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ teamId, myTeamId })
    })
    fetch(`/challenges/${1}/accept`, {
        method: 'POST'
    })
}

//Then can add players to the challenge
function addPlayers() {
    fetch(`/challenges/${1}/add-players`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ teamId, players })
    })
}