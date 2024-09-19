import e from 'express';
import {db} from '../database.js';
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
    match_id;

    // CONSTANTS
    GAME_LENGTH = 40;    // number of ticks to play the game for
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
    TRICK_CHANCE = 1/3;
    ASSIST_MODIFIER = 1;

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

        // Loop through offense team players and set offenseTarget to player object
        for (const player of this.offenseTeam.players) {
            console.log(player.id, player.offensePriority, player.offensePriorityTarget)
            if (player.offensePriorityTarget !== null) {
                console.log("Looking")
                player.offensePriorityTarget = this.getPlayerById(player.offensePriorityTarget);
            }
        }

        // Loop through defense team players and set defenseTarget to player object
        for (const player of this.defenseTeam.players) {
            console.log(player.defensePriorityTarget);
            if (player.defensePriorityTarget !== null) {
                console.log("Looking")
                player.defensePriorityTarget = this.getPlayerById(player.defensePriorityTarget);
            }
        }

        // Loop through offense team players and set offenseTarget to player object
        for (const player of this.defenseTeam.players) {
            if (player.offensePriorityTarget !== null) {
                console.log("Looking")
                player.offensePriorityTarget = this.getPlayerById(player.offensePriorityTarget);
            }
        }

        // Loop through defense team players and set defenseTarget to player object
        for (const player of this.offenseTeam.players) {
            if (player.defensePriorityTarget !== null) {
                console.log("Looking")
                player.defensePriorityTarget = this.getPlayerById(player.defensePriorityTarget);
            }
        }
    }

    // Function to get player object by id
    getPlayerById(id) {
        console.log("Finding player: " + id);
        for (const player of this.offenseTeam.players) {
            if (player.id === id) {
                console.log("Found player: " + player.name);
                return player;
            }
        }
        for (const player of this.defenseTeam.players) {
            if (player.id === id) {
                console.log("Found player: " + player.name);
                return player;
            }
        }

        const self = this;
        db.run(`INSERT INTO match_history (league_id, home_team_id, away_team_id, weather) 
                VALUES (?, ?, ?, ?, ?)`, [homeTeam.leagueID, homeTeam.team_id, awayTeam.team_id,
                weather.name], function(err) {
            if (err) {
                console.error('Error inserting match:', err.message);
                return;
            }
            self.match_id = this.lastID;
        });

    }

    tick() { //every game tick
        this.turnedover = false;
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
        this.doAdvancement();
        if(!this.turnedover) {
            this.doScoring();
        }

        db.run(`INSERT INTO match_ticks_history (tick, match_id, possession_team_id, ball_position) 
            VALUES (?, ?, ?, ?)`, [this.gameTicks, this.match_id, this.offenseTeam.team_id,
                this.position], function(err) {
            if (err) {
                console.error('Error inserting match_ticks_history:', err.message);
            }
        });

        if(this.gameTicks == this.GAME_LENGTH - 1) {
            db.run(`UPDATE match_history SET home_team_score = ?, away_team_score = ? WHERE id = ?`,
                [this.homeTeam.score, this.awayTeam.score, this.match_id],
                function(err) {
                    if (err) {
                        console.error('Error updating scores in match_history:', err.message);
                    }
                }
            )
        }
    }

    resetTempStats() {
        for(const player of this.offenseTeam.players) {
            player.tempBulk = 0;
            player.tempFinesse = 0;
            player.tempHeight = 0;
            player.tempStrength = 0;
            player.tempTrickiness = player.trickiness;
            player.tempFocus = player.focus;

        }
        for(const player of this.defenseTeam.players) {
            player.tempBulk = 0;
            player.tempFinesse = 0;
            player.tempHeight = 0;
            player.tempStrength = 0;
            player.tempTrickiness = player.trickiness;
            player.tempFocus = player.focus;
        }
    }

    resetInjuries() {
        for(const player of this.offenseTeam.players) {
            if(!player.injury) {
                player.bulk = player.baseBulk;
                player.finesse = player.baseFinesse;
                player.height = player.baseHeight;
                player.strength = player.baseStrength;
                if(player.tempInjury > 0) {
                    console.log(player.name + " temp injury: " + player.tempInjury + " finesse: " + player.finesse);
                }
            }
            else {
                player.bulk = player.baseBulk * 0.5;
            }
        }
        for(const player of this.defenseTeam.players) {
            if(!player.injury) {
                player.bulk += player.tempInjury;
                player.finesse += player.tempInjury;
                player.height += player.tempInjury;
                player.strength += player.tempInjury;
            }
            player.tempInjury = 0;
        }
    }

    applyInjuries() { 
        for(const player of this.offenseTeam.players) {
            player.bulk -= player.tempInjury;
            player.finesse -= player.tempInjury;
            player.height -= player.tempInjury;
            player.strength -= player.tempInjury;
            if(player.tempInjury > 0) {
                console.log(player.name + " temp injury: " + player.tempInjury + " finesse: " + player.finesse);
            }
            player.tempInjury = 0;
        }
        for(const player of this.defenseTeam.players) {
            player.bulk -= player.tempInjury;
            player.finesse -= player.tempInjury;
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
        player.assist(target, this.ASSIST_MODIFIER);
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
            let minTrickiness = 100; //if multiple advancers, its the least tricky advancer
            let advancingPlayer;
            for (const player of this.offenseTeam.players) {
                if(player.offensePriority === "Advance" && this.turnedover == false) {
                    advancingPlayer = player;
                    if(player.tempTrickiness < minTrickiness) {minTrickiness = player.trickiness;}
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
                if(player.defensePriority === "Defend_Advance") {
                    if(minTrickiness > player.tempFocus && Math.random() < this.TRICK_CHANCE) { //trickiness check
                        console.log(player.name + " was tricked!");
                    }
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
            if(numAdvancers > 1 || numAdvancers == 0) {console.log(this.offenseTeam.teamName + " advanced " + netAdvance + " yards!");}
            else {console.log(advancingPlayer.name + " advanced " + netAdvance + " yards!");}

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
            }
        }
    }

    doScoring() {
        if(this.position >= this.FIELD_LENGTH) { //removed automatic touchdowns
            this.position = this.FIELD_LENGTH;
            for (const player of this.offenseTeam.players) {
                if(player.offensePriority === "Advance") { //on touchdown, the player who is advancing will try to score
                    console.log(player.name + " is attempting a touchdown!");
                    this.shoot(player); //shoot
                }
            }
        } else { //check for trying to score
            if(this.position >= this.FIELD_LENGTH-this.offenseTeam.scoreRange) {
                for (const player of this.offenseTeam.players) {
                    if(player.offensePriority === "Score" && Math.random() > 0.8 - player.finesse * 0.2) { //scorers have 30% chance of attempting a shot
                        this.shoot(player); //shoot
                    }
                }
            }
        }
    }

    turnover() { 
        console.log("Turnover!");
        this.turnedover = true;
        this.possessionTicks = 0;
        this.position = this.FIELD_LENGTH - this.position;
        const tempTeam = this.offenseTeam;
        this.offenseTeam = this.defenseTeam;
        this.defenseTeam = tempTeam;
    }

    shoot(shooter) {
        let numShooters = 0;
        for (const player of this.offenseTeam.players) { //count number of shooters
            if(player.offensePriority === "Score") {
                numShooters++;
            }
        }
        console.log(shooter.name + " is shooting!");
        //console.log(shooter.finesse + " + " + shooter.tempFinesse);
        let score = this.weather.scoreEffect(shooter, this.offenseTeam, this.defenseTeam, this.position);
        if(score == null) { //no weather effect, handle scoring as usual
            let shooting = Math.random() * (shooter.finesse + shooter.tempFinesse)
            //console.log("Shooting: " + shooting);
            for (const player of this.defenseTeam.players) {
                if(player.defensePriority === "Defend_Score") {
                    if(shooter.tempTrickiness > player.tempFocus && Math.random() < this.TRICK_CHANCE) { //trickiness check
                        console.log(player.name + " was tricked!");
                    }
                    else {
                        shooting -= (Math.random() * (player.bulk + player.tempBulk)) / numShooters; //defenders split defense among all the shooters
                    }
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
        else {
            console.log("Shot missed!\n");
        }
        this.turnover();
    }
}

export { Match };