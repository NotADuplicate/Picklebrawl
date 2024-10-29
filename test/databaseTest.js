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
const namesFilePath = path.join(__dirname, './names.json');
let namesArray = [];

fs.readFile(namesFilePath, 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading names file:', err.message);
        return;
    }
    try {
        let namesJson = JSON.parse(data);
        NameGenerator.init(namesJson.names);
    } catch (parseErr) {
        console.error('Error parsing names file:', parseErr.message);
    }
});

let player = new Player();
const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
const playerName = player.generateName();
const lettersInName = alphabet.filter(letter => playerName.toLowerCase().includes(letter));
console.log(`Letters in player name: ${lettersInName.join(', ')}`);
/*for(i = 0; i < 8; i++) {
    player.generateName();

}
// Remember to delete database.sqlite at the end*/
