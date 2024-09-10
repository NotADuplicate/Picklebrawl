import { Weather } from './weather.js';

export class Speedlimit extends Weather {
    SPEED_LIMIT = 10
    description = "You can't advance more than " + this.SPEED_LIMIT + "m per tick";

    advanceEffect(offenseTeam, defenseTeam, position) {
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

        // Cap net advancement at the speed limit
        if(netAdvance > this.SPEED_LIMIT) {netAdvance = this.SPEED_LIMIT}

        this.position += netAdvance;
        console.log(this.offenseTeam.teamName + " advanced " + netAdvance + " yards!");

        // Calculate turnover chance
        let turnoverChance = this.possessionTicks * 0.05 * (defendAmount / (advanceAmount + defendAmount));
        if (turnoverChance > 0.2) {turnoverChance = 0.2;} //max turnover chance of 20%
        
        if(Math.random() < turnoverChance) {
            this.turnover();
        }
    }
}