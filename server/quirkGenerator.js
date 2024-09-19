import { db } from './database.js';
import * as quirks from './Models/Quirks/index.js';

export class QuirkGenerator {
    //This should give errors of unable to add quirks that are already in the table, this should be fine it just means when we add new quirks they'll be added on runtime
    static loadQuirks() {
        const quirkKeys = Object.keys(quirks);
        console.log('Loading quirks:', quirkKeys);
        for(let i = 0; i < quirkKeys.length; i++) {
            const quirkClass = quirks[quirkKeys[i]];
            const quirk = new quirkClass();
            db.run(`INSERT INTO quirks (id, title, description) VALUES (?, ?, ?)`, [i, quirk.title, quirk.description], function(err) {
                if (err) {
                    //console.error('Error inserting quirk:', err.message);
                }
            });
        }
    }
}