import { Weather } from './weather.js';

export class Snowy extends Weather {
    description = "Advancing is more difficult, chance for turnover slightly higher";

    advanceEffect(advancer, offenseTeam, defenseTeam, position) { // snowy affects advancing
        console.log("SNOW")

        // Loop through offense team, calculate amount advanced
        let numAdvancers = 0;
        let advanceAmount = 0;
        for (const player of this.offenseTeam.players) {
            if(player.offensePriority === "Advance") {
                numAdvancers++;
                advanceAmount += Math.random() * (player.strength + player.tempStrength) + 0.1;
                //console.log(player.name + " strength " + player.strength + " + " + player.tempStrength);
            }
        }
        if(numAdvancers > 1) {advanceAmount *= 0.8;} //if more than one player is advancing, reduce the amount advanced by 20%
        if(numAdvancers == 0) {advanceAmount = Math.random() * 2;} //if no players are advancing, a little advancement occurs

        // Loop through defense team, calculate amount defended
        let numDefenders = 0;
        let defendAmount = 0;
        for (const player of this.defenseTeam.players) {
            if(player.defensePriority === "Defend Advance") {
                numDefenders++;
                defendAmount += Math.random() * (player.bulk + player.tempBulk)
                //console.log(player.name + " bulk " + player.bulk + " + " + player.tempBulk);
            }
        }
        if(numDefenders > 1) {defendAmount *= 0.8;} //if more than one player is defending, reduce the amount defended by 20%

        // Calculate net advancement
        let netAdvance = 0;
        console.log("Advance: " + advanceAmount + " Defend: " + defendAmount);
        if(advanceAmount > defendAmount) {
            netAdvance = Math.random() * (advanceAmount - defendAmount) * 2 + (advanceAmount - defendAmount);
        } else {
            netAdvance = 0;
        }
        netAdvance *= 0.8 //decrease advancement because of the snow

        // Calculate turnover chance (increase slope from 0.05 to 0.06, max from 0.02)
        let turnoverChance = this.possessionTicks * 0.05 * (defendAmount / (advanceAmount + defendAmount));
        if (turnoverChance > 0.2) {turnoverChance = 0.2;} //max turnover chance of 15%
        
        // This will trigger a turnover back in the Match class
        if(Math.random() < turnoverChance) {
            advanceAmount = -1;
        }

        return advanceAmount
    }
}