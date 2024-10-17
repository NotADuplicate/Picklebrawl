import { db } from './database.js';
import * as quirks from './Models/Quirks/index.js';

export class QuirkGenerator {
    //This should give errors of unable to add quirks that are already in the table, this should be fine it just means when we add new quirks they'll be added on runtime
    static loadQuirks() {
        const quirkKeys = Object.keys(quirks);
        console.log('Loading quirks:', quirkKeys);
        for(let i = 0; i < quirkKeys.length; i++) {
            const quirk = quirks[quirkKeys[i]];
            db.run(`INSERT INTO quirks (id, title, description) VALUES (?, ?, ?)`, [i, quirk.title, quirk.description], function(err) {
                if (err) {
                    //console.error('Error inserting quirk:', err.message);
                }
            });
        }
    }

    static findQuirk(title) {
        for (let i = 0; i < quirkKeys.length; i++) {
            const quirk= quirks[quirkKeys[i]];
            if (quirk.title === title) {
                return quirk;
            }
        }
        return null;
    }

    static pickRandomQuirk(draft = false) {
        const quirkKeys = Object.keys(quirks);
        const filteredQuirkKeys = quirkKeys.filter(key => (!draft && quirks[key].APPEARS_IN_GENERATION) || (draft && quirks[key].APPEARS_IN_DRAFT));
        const totalLikelihood = filteredQuirkKeys.reduce((sum, key) => sum + quirks[key].likelihood, 0);
        
        let randomValue = Math.random() * totalLikelihood;
        let cumulativeLikelihood = 0;
        let selectedQuirkKey;

        filteredQuirkKeys.sort(() => Math.random() - 0.5);
        for (const key of filteredQuirkKeys) {
            cumulativeLikelihood += quirks[key].likelihood;
            if (randomValue < cumulativeLikelihood) {
                selectedQuirkKey = key;
                break;
            }
        }
        return selectedQuirkKey;
    }
}