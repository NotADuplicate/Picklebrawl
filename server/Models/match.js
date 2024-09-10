import e from 'express';
import {Player} from './player.js';
import {Team} from './team.js';
import * as Weather from './Weather/weather.js';

class Match {
    homeTeam;
    awayTeam;
    offenseTeam;
    defenseTeam;
    position = 50;
    possessionTicks = 0;
    gameTicks = 0;
    weather;

    // CONSTANTS
    FIELD_LENGTH = 100;
    MULTIPLE_ADVANCERS_REDUCTION = 0.8;
    NO_ADVANCERS_MAX_ADVANCEMENT = 2;
    MULTIPLE_ADVANCE_DEFENDERS_REDUCTION = 0.8;
    MAX_ADVANCEMENT_PER_TICK = null;
    NET_ADVANCEMENT_MODIFIER = 1.0;
    TURNOVER_CHANCE_INCREASE_PER_TICK = 0.05;
    TURNOVER_CHANCE_MAX = 0.2;
    SHOOTING_DISTANCE_MODIFIER = 0.1;
    INJURY_PERMANENCE_MODIFIER = 1;    // TODO: not implemented yet

    constructor(homeTeam, awayTeam, weather) {
        this.homeTeam = homeTeam;
        this.awayTeam = awayTeam;
        this.homeTeam.score = 0;
        this.awayTeam.score = 0;
        this.offenseTeam = this.homeTeam;
        this.defenseTeam = this.awayTeam;
        this.weather = weather;
        console.log("NEW MATCH: " + this.homeTeam.teamName + " vs " + this.awayTeam.teamName);
        this.weather.startGameEffect(this, this.offenseTeam, this.defenseTeam);
    }

    tick() { //every game tick
        console.log("Tick " + this.gameTicks);
        console.log(this.offenseTeam.teamName + " " + this.position + " " + this.defenseTeam.teamName);
        this.possessionTicks++;
        this.gameTicks++;
        this.weather.tickEffect(this.offenseTeam, this.defenseTeam);
        this.resetTempStats();
        this.doPriority("Assist", this.assist, true) //calculate assists and add temp stats to player
        this.doPriority("Protect", this.protect, true) //calculate protection and add ProtectBulk to player 
        this.resetInjuries();
        this.doPriority("Attack", this.attack, true) //calculate injuries and tick stat decreases
        this.applyInjuries();
        this.doAdvancement() 
        this.doScoring()
    }

    resetTempStats() {
        for(const player of this.offenseTeam.players) {
            player.tempBulk = 0;
            player.tempAgility = 0;
            player.tempHeight = 0;
            player.tempStrength = 0;

        }
        for(const player of this.defenseTeam.players) {
            player.tempBulk = 0;
            player.tempAgility = 0;
            player.tempHeight = 0;
            player.tempStrength = 0;
        }
    }

    resetInjuries() {
        for(const player of this.offenseTeam.players) {
            if(!player.injury) {
                player.bulk = player.baseBulk;
                player.agility = player.baseAgility;
                player.height = player.baseHeight;
                player.strength = player.baseStrength;
                if(player.tempInjury > 0) {
                    console.log(player.name + " temp injury: " + player.tempInjury + " agility: " + player.agility);
                }
            }
            else {
                player.bulk = player.baseBulk * 0.5;
            }
        }
        for(const player of this.defenseTeam.players) {
            if(!player.injury) {
                player.bulk += player.tempInjury;
                player.agility += player.tempInjury;
                player.height += player.tempInjury;
                player.strength += player.tempInjury;
            }
            player.tempInjury = 0;
        }
    }

    applyInjuries() { 
        for(const player of this.offenseTeam.players) {
            player.bulk -= player.tempInjury;
            player.agility -= player.tempInjury;
            player.height -= player.tempInjury;
            player.strength -= player.tempInjury;
            if(player.tempInjury > 0) {
                console.log(player.name + " temp injury: " + player.tempInjury + " agility: " + player.agility);
            }
            player.tempInjury = 0;
        }
        for(const player of this.defenseTeam.players) {
            player.bulk -= player.tempInjury;
            player.agility -= player.tempInjury;
            player.height -= player.tempInjury;
            player.strength -= player.tempInjury;
            player.tempInjury = 0;
        }
    }

    doPriority(priority, action, targeted) {
        // Loop through offense team
        for (const player of this.offenseTeam.players) {
            if (player.offensePriority === priority) {
                //console.log(player.name + " " + player.offensePriority)
                if (targeted) {
                    switch(priority) {
                        case "Assist":
                            this.assist(player, player.offensePriorityTarget);
                            break;
                        case "Protect":
                            this.protect(player, player.offensePriorityTarget);
                            break;
                        case "Attack":
                            this.attack(player, player.offensePriorityTarget);
                            break;
                        default:
                            console.log("Action: ", player.offensePriorityTarget.name)
                            action(player, player.offensePriorityTarget);
                    }
                } else {
                    console.log("Action:")
                    action(player);
                }
            }
        }

        // Loop through defense team
        for (const player of this.defenseTeam.players) {
            if (player.defensePriority === priority) {
                if (targeted) {
                    switch(priority) {
                        case "Assist":
                            this.assist(player, player.defensePriorityTarget);
                            break;
                        case "Protect":
                            this.protect(player, player.defensePriorityTarget);
                            break;
                            case "Attack":
                                this.attack(player, player.defensePriorityTarget);
                                break;
                        default:
                            action(player, player.defensePriorityTarget);
                    }
                } else {
                    action(player);
                }
            }
        }
    }

    attack(player, target) {
        player.attack(target, this.weather.INJURY_PERMANENCE_MODIFIER);
    }
    
    assist(player, target) {
        player.assist(target);
    }

    protect(player, target) {
        player.protect(target);
    }

    doAdvancement() {
        let advancing = this.weather.advanceEffect(this.offenseTeam, this.defenseTeam, this.position);
        if(advancing == null) {
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
            if(numAdvancers > 1) {advanceAmount *= this.MULTIPLE_ADVANCERS_REDUCTION;} //if more than one player is advancing, reduce the amount advanced by 20%
            if(numAdvancers == 0) {advanceAmount = Math.random() * this.NO_ADVANCERS_MAX_ADVANCEMENT;} //if no players are advancing, a little advancement occurs

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
            if(numDefenders > 1) {defendAmount *= this.MULTIPLE_ADVANCE_DEFENDERS_REDUCTION;} //if more than one player is defending, reduce the amount defended by 20%

            // Calculate net advancement
            let netAdvance = 0;
            console.log("Advance: " + advanceAmount + " Defend: " + defendAmount);
            if(advanceAmount > defendAmount) {
                netAdvance = Math.random() * (advanceAmount - defendAmount) * 2 + (advanceAmount - defendAmount);
            } else {
                netAdvance = 0;
            }

            // Cap net advancement if necessary
            if(this.MAX_ADVANCEMENT_PER_TICK != null) {
                if(netAdvance > this.MAX_ADVANCEMENT_PER_TICK) {netAdvance = this.MAX_ADVANCEMENT_PER_TICK}
            }
            
            this.position += netAdvance;
            console.log(this.offenseTeam.teamName + " advanced " + netAdvance + " yards!");

            // Calculate turnover chance
            let turnoverChance = (this.possessionTicks * this.TURNOVER_CHANCE_INCREASE_PER_TICK * 
                (defendAmount / (advanceAmount + defendAmount)));
            if (turnoverChance > this.TURNOVER_CHANCE_MAX) {turnoverChance = this.TURNOVER_CHANCE_MAX;}
            
            if(Math.random() < turnoverChance) {
                this.turnover();
            }
        }
        else {
            if(advancing == -1) { //if -1 advancement, automatic turnover
                this.turnover();
            }
            else {
                this.position += advancing;
                console.log(this.offenseTeam.teamName + " advanced " + advancing + " yards!");
            }
        }
    }

    doScoring() {
        if(this.position >= this.FIELD_LENGTH) { //touchdown 
            this.offenseTeam.score += 1;
            this.position = (this.FIELD_LENGTH / 2);
            this.turnover();
        } else { //check for trying to score
            if(this.position >= this.FIELD_LENGTH-this.offenseTeam.scoreRange) {
                for (const player of this.offenseTeam.players) {
                    if(player.offensePriority === "Score" && Math.random() > 0.8 - player.agility * 0.2) { //scorers have 30% chance of attempting a shot
                        this.shoot(player); //shoot
                    }
                }
            }
        }
    }

    turnover() { 
        console.log("Turnover!");
        this.possessionTicks = 0;
        this.position = this.FIELD_LENGTH - this.position;
        const tempTeam = this.offenseTeam;
        this.offenseTeam = this.defenseTeam;
        this.defenseTeam = tempTeam;
    }

    shoot(player) {
        console.log(this.offenseTeam.teamName + " is shooting!");
        console.log(player.agility + " + " + player.tempAgility);
        let score = this.weather.scoreEffect(player, this.offenseTeam, this.defenseTeam, this.position);
        if(score == null) { //no weather effect, handle scoring as usual
            let shooting = Math.random() * (player.agility + player.tempAgility)
            console.log("Shooting: " + shooting);
            for (const player of this.defenseTeam.players) {
                if(player.defensePriority === "Defend Score") {
                    shooting -= Math.random() * (player.bulk + player.tempBulk);
                }
            }
            shooting -= (this.FIELD_LENGTH-this.position) * this.SHOOTING_DISTANCE_MODIFIER;
            score = shooting > -1; //wanted to make it easier to score bc its influenced by distance and defenders
        }
        if(score) {
            console.log(this.offenseTeam.teamName + " scored!\n");
            this.offenseTeam.score += 1;
            console.log(this.offenseTeam.teamName + " " + this.offenseTeam.score + " - " + this.defenseTeam.score + " " + this.defenseTeam.teamName)
            this.position = this.FIELD_LENGTH / 2;
        }
        this.turnover();
    }
}

export { Match };