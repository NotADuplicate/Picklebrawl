import { Team } from '../server/Models/team.js'; // Adjust the path as necessary
import { Player } from '../server/Models/player.js'; // Adjust the path as necessary
import { Match } from '../server/Models/match.js'; // Adjust the path as necessary
//import { Windy } from '../server/Models/Weather/windy.js'; // Adjust the path as necessary
//import { Snowy } from '../server/Models/Weather/snowy.js'; // Adjust the path as necessary
import * as weather from '../server/Models/Weather/index.js'

/*let team1 = new Team('Team A', 1, 'charlie', false);
let team2 = new Team('Team B', 1, 'rachel', false);

let stats = [
    [6,5,3,3],
    [3,8,4,3],
    [6,1,4,4],
    [4,5,5,4]
]

let rachelPlayers = []
for (let i = 0; i < 4; i++) {
    const player = new Player();
    player.setStats(stats[i][0], stats[i][1], stats[i][2], stats[i][3]);
    rachelPlayers[i] = player;
    team1.addPlayer(player);
}

stats = [
    [5,4,4,4],
    [5,6,1,3],
    [6,2,1,7],
    [2,4,5,4]
]

let charliePlayers = []
for (let i = 0; i < 4; i++) {
    const player = new Player();
    player.setStats(stats[i][0], stats[i][1], stats[i][2], stats[i][3]);
    charliePlayers[i] = player;
    team2.addPlayer(player);
}

charliePlayers[2].setPriorities("Advance", "Attack", "", rachelPlayers[1]);
charliePlayers[3].setPriorities("Assist", "Defend Score", charliePlayers[2], rachelPlayers[3]);
charliePlayers[1].setPriorities("Score", "Assist", charliePlayers[3], charliePlayers[2]);
charliePlayers[0].setPriorities("Protect", "Assist", charliePlayers[2], charliePlayers[3]);
team2.scoreRange = 25;

rachelPlayers[0].setPriorities("Assist", "Defend Advance", rachelPlayers[2]);
console.log("HERE HERE!!!!")
console.log(rachelPlayers[2].name);
console.log(rachelPlayers[0].offensePriorityTarget)
rachelPlayers[1].setPriorities("Score", "Defend Score", rachelPlayers[0]);
rachelPlayers[2].setPriorities("Advance", "Defend Advance", rachelPlayers[1]);
rachelPlayers[3].setPriorities("Protect", "Protect", rachelPlayers[0], rachelPlayers[0]);
team1.scoreRange = 10;

let wind = new weather.Snowy();
//wind.startGameEffect(team1, team2);
let match = new Match(team1, team2, wind);
for(let i = 0; i < 40; i++) {
    match.tick();
}*/
let counts = [];
for(let i = 0; i < 1000; i++) {
    let players = [];
    for (let i = 0; i < 8; i++) {
        const player = new Player();
        players.push(player);
    }
    
    let alphabet = 'abcdefghijklmnopqrstuvwxyz';
    let lettersNotPresent = alphabet.split('').filter(letter => {
        return players.every(player => !player.name.toLowerCase().includes(letter));
    });
    counts[i] = lettersNotPresent.length;
}

// Calculate the average
let sum = 0;
for (let i = 0; i < counts.length; i++) {
    sum += counts[i];
}
const average = sum / counts.length;

// Calculate the standard deviation
let deviationSum = 0;
for (let i = 0; i < counts.length; i++) {
    deviationSum += Math.pow(counts[i] - average, 2);
}
const standardDeviation = Math.sqrt(deviationSum / counts.length);

console.log("Average: " + average);
console.log("Standard Deviation: " + standardDeviation);