// IMPORTANT: Note that running this file should only be done with no db file, and it will clear
// the db at the end.

import {db} from '../server/database.js';
import { Team } from '../server/Models/team.js'; // Adjust the path as necessary
import { Player } from '../server/Models/player.js'; // Adjust the path as necessary
import { Match } from '../server/Models/match.js'; // Adjust the path as necessary
import * as weather from '../server/Models/Weather/index.js'
import { assert } from 'chai';

// Assume that 2 teams have been added with ids 1 and 2 respectively
// Can't get load team to work
let team1 = new Team("A", "Rachel", 1, null, false)
let team2 = new Team("B", "Charlie", 2, null, false)
team1.load(1)
team2.load(2)
console.log("Team objects created")
console.log("Team1 name: " + team1.teamName)
assert(team1.teamName != "A")
assert(team2.teamName != "B")

let weatherObj = new weather.Windy()
console.log("Weather object created")
let match = new Match(team1, team2, weatherObj)
console.log("Match object created")

// Run a match between them
for(let i = 0; i < 4; i++) {
    match.tick()
    console.log("Tick: " + toString(i))
}

// Remember to delete database.sqlite at the end
