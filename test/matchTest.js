import { Team } from '../server/Models/team.js'; // Adjust the path as necessary
import { Player } from '../server/Models/player.js'; // Adjust the path as necessary
import { Match } from '../server/Models/match.js'; // Adjust the path as necessary
//import { Windy } from '../server/Models/Weather/windy.js'; // Adjust the path as necessary
//import { Snowy } from '../server/Models/Weather/snowy.js'; // Adjust the path as necessary
import * as weather from '../server/Models/Weather/index.js'
import { use } from 'chai';

const username = "username"
const password = "password"
const username2 = "username2"

//Must create user accounts before league
fetch('http://localhost:3000/create-account', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password })
})
fetch('http://localhost:3000/create-account', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username2, password })
})

leagueName = "leagueName"
leaguePassword = "leaguePassword"
teamName = "teamName"
teamName2 = "teamName2"
//Then can create a league
fetch('http://localhost:3000/create-league', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ leagueName, leaguePassword, username, teamName })
})
//Then join the league
fetch('http://localhost:3000/join-league', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ leagueName, leaguePassword, username2, teamName2 })
})

teamId = 3;
myTeamId = 4;
//Then can create a challenge
fetch(`http://localhost:3000/challenges`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ teamId, myTeamId })
})
fetch(`http://localhost:3000/challenges/${1}/accept`, {
    method: 'POST'
})

//Then can add players to the challenge
fetch(`http://localhost:3000/challenges/${1}/add-players`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ teamId, players })
})