import { db } from './database.js';
import * as quirks from './Models/Quirks/index.js';

export class QuirkGenerator {
    static idToQuirkMap = {};

    //This should give errors of unable to add quirks that are already in the table, this should be fine it just means when we add new quirks they'll be added on runtime
    static loadQuirks() {
        const quirkKeys = Object.keys(quirks);
        console.log('Loading quirks:', quirkKeys);
        // Array to hold quirks that failed due to id conflict
        const failedIdInserts = [];
        let highestId = 0;
        // Loop over quirks in order. For each quirk, check if a record with the same title exists.
        for (let i = 0; i < quirkKeys.length; i++) {
            const currentId = i;
            const quirk = quirks[quirkKeys[currentId]];
            console.log("Processing quirk", currentId, ":", quirk.title);
            
            // Check if the title already exists in DB
            db.get(
                `SELECT id FROM quirks WHERE title = ?`,
                [quirk.title],
                function(err, row) {
                    if (err) {
                        console.log("Error checking for existing quirk:", err.message);
                        return;
                    }
                    
                    if (row) {
                        // Title exists—skip insertion for this quirk.
                        console.log("Quirk already exists (by title):", quirk.title);
                        highestId = Math.max(highestId,row.id)
                        QuirkGenerator.idToQuirkMap[row.id] = quirk;
                        db.run(`UPDATE quirks SET description = ?, power_modifier = ? WHERE title = ?`,
                            [quirk.description, quirk.POWER_MODIFIER, quirk.title], (err) => {
                            if(err) {
                                console.log("Err updating quirk: ", err)
                            }
                        });
                        return;
                    }
                    
                    // Title not present: attempt to insert using id i.
                    db.run(
                        `INSERT INTO quirks (title, id, description, power_modifier) VALUES (?, ?, ?, ?)`,
                        [quirk.title, currentId, quirk.description, quirk.POWER_MODIFIER],
                        function(err) {
                            if (err) {
                                console.log("Failed to insert quirk:", quirk.title, err.message);
                                // If failure is due to the id being taken, save it for later reinsertion.
                                if (err.message.includes("quirks.id")) {
                                    console.log("Unique constraint failed for id on quirk:", currentId, quirk.title);
                                    failedIdInserts.push({ originalId: currentId, quirk });
                                }
                            } else {
                                console.log("Inserted quirk:", quirk.title, "with id", i);
                                highestId = Math.max(highestId,currentId)
                                QuirkGenerator.idToQuirkMap[currentId] = quirk;
                            }
                        }
                    );
                }
            );
        }
        
        // After processing all quirks, wait a moment to allow the async operations to complete,
        // then reinsert all quirks that failed due to id conflict.
        setTimeout(() => {
            console.log("Highest id: ", highestId)
            let newId = highestId+1; // Start new ids after the last original id.
            failedIdInserts.forEach(({ originalId, quirk }) => {
                const currentId = newId;
                db.run(
                    `INSERT INTO quirks (title, id, description, power_modifier) VALUES (?, ?, ?, ?)`,
                    [quirk.title, currentId, quirk.description, quirk.POWER_MODIFIER],
                    function(err) {
                        if (err) {
                            console.log("Failed to reinsert quirk with new id for:", quirk.title, newId, err.message);
                        } else {
                            console.log("Reinserted quirk with new id", currentId, quirk.title);
                            QuirkGenerator.idToQuirkMap[currentId] = quirk;
                        }
                    }
                );
                newId++;
            });
        }, 1000); // Delay (adjust if needed) to ensure initial inserts have finished

        setTimeout(() => {
            console.log(this.idToQuirkMap)
        }, 2000);
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

    static getQuirkId(quirk) {
        for (const id in QuirkGenerator.idToQuirkMap) {
            if (QuirkGenerator.idToQuirkMap[id].title === quirk.title) {
                return parseInt(id, 10);
            }
        }
        return null;
    }

    static pickRandomQuirk(draft = false) {
        const quirkMap = QuirkGenerator.idToQuirkMap;
        const keys = Object.keys(quirkMap);
        // Filter keys based on the draft flag.
        const filteredKeys = keys.filter(key => {
            const quirk = quirkMap[key];
            return (!draft && quirk.APPEARS_IN_GENERATION) || (draft && quirk.APPEARS_IN_DRAFT);
        });
    
        // Calculate the total likelihood.
        const totalLikelihood = filteredKeys.reduce((sum, key) => sum + quirkMap[key].likelihood, 0);
        
        let randomValue = Math.random() * totalLikelihood;
        let cumulativeLikelihood = 0;
        let selectedKey = null;
        
        // Shuffle the filtered keys to randomize order
        filteredKeys.sort(() => Math.random() - 0.5);
        
        // Loop through and pick based on likelihood weighting.
        for (const key of filteredKeys) {
            cumulativeLikelihood += quirkMap[key].likelihood;
            if (randomValue < cumulativeLikelihood) {
                selectedKey = key;
                break;
            }
        }
        
        return selectedKey;
    }
}