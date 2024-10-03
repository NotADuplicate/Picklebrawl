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
    weather;    // stored as a weather object
    match_id;
    possessionLengths = [];
    homeAdvancements = [];
    awayAdvancements = [];
    shotsAttempted = 0;
    players;

    // CONSTANTS
    GAME_LENGTH = 100;    // number of ticks to play the game for // TODO: set to 100 when done testing
    FIELD_LENGTH = 100;
    MULTIPLE_ADVANCERS_REDUCTION = 0.2;
    NO_ADVANCERS_MAX_ADVANCEMENT = 2;
    MULTIPLE_ADVANCE_DEFENDERS_REDUCTION = 0.2;
    MAX_ADVANCEMENT_PER_TICK = null;
    NET_ADVANCEMENT_MODIFIER = 1.0;
    TURNOVER_CHANCE_INCREASE_PER_TICK = 0.05;
    TURNOVER_CHANCE_MAX = 0.2;
    SHOOTING_DISTANCE_MODIFIER = 0.1;
    INJURY_PERMANENCE_MODIFIER = 1;    // TODO: not implemented yet
    TRICK_CHANCE = 1/3;
    ASSIST_MODIFIER = 1;

    constructor(homeTeam, awayTeam, weather) {
        console.log("\n\n\n\n\n\n");
        this.homeTeam = homeTeam;
        this.awayTeam = awayTeam;
        this.homeTeam.score = 0;
        this.awayTeam.score = 0;
        this.offenseTeam = this.homeTeam;
        this.defenseTeam = this.awayTeam;
        this.weather = weather;
    }

    runMatch() {
        for(let i = 0; i < this.GAME_LENGTH; i++) {
            this.tick();
            //await new Promise(r => setTimeout(r, 100));
        }
    }

    setTargets() {
        // Loop through offense team players and set offenseTarget to player object
        for (const player of this.players) {
            console.log(player.name, player.id, player.offensePriority, player.offensePriorityTarget)
            if (player.offensePriorityTarget !== null) {
                player.offensePriorityTarget = this.getPlayerById(player.offensePriorityTarget);
                player.savedOffensePriorityTarget = player.offensePriorityTarget;
            }
            if (player.defensePriorityTarget !== null) {
                player.defensePriorityTarget = this.getPlayerById(player.defensePriorityTarget);
                player.savedDefensePriorityTarget = player.defensePriorityTarget;
            }
        }
    }

    savePriorities() {
        // Loop through offense team players and save their priorities
        for (const player of this.players) {
            // Save offense priorities
            player.savedOffensePriority = player.offensePriority;
            player.savedOffensePriorityTarget = player.offensePriorityTarget;
            if(player.offensePriority == "Rest") {
                player.baseBulk *= 1.5;
                player.baseFinesse *= 1.5;
                player.baseHeight *= 1.5;
                player.baseStrength *= 1.5;
            }
            // Save defense priorities
            player.savedDefensePriority = player.defensePriority;
            player.savedDefensePriorityTarget = player.defensePriorityTarget;
            if(player.defensePriority == "Rest") {
                player.baseBulk *= 1.5;
                player.baseFinesse *= 1.5;
                player.baseHeight *= 1.5;
                player.baseStrength *= 1.5;
            }
            // Insert priorities into player_history
            var player_history_id;    // save the id of this row in the db
            const self = this;

            // Set target ids
            var offenseId = null;
            var defenseId = null;
            if (player.offensePriorityTarget != null) {
                offenseId = player.offensePriorityTarget.id
            }
            if (player.defensePriorityTarget != null) {
                defenseId = player.defensePriorityTarget.id
            }
            console.log("OFFENSE:", player.offensePriority)
            console.log("DEFENSE:", player.defensePriority)

            db.run(`INSERT INTO player_history ` 
                + `(match_id, second_half, player_id, offensive_role, offensive_target_id, `
                + `defensive_role, defensive_target_id) `
                + `VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [self.match_id, false, player.id, player.offensePriority, offenseId,
                player.defensePriority, defenseId], function(err) {
                if (err) {
                    console.error('Error inserting player into player_history:', err.message);
                }
                player_history_id = this.lastID;
            });
        }
    }

    startGame(challengeId) {
        this.players = this.homeTeam.players.concat(this.awayTeam.players);
        const self = this;
        return new Promise((resolve, reject) => {
            db.run(`INSERT INTO match_history (league_id, home_team_id, away_team_id, challenge_id,`
                + `weather) VALUES (?, ?, ?, ?,?)`, 
                [this.homeTeam.leagueId, this.homeTeam.teamId, this.awayTeam.teamId, challengeId, this.weather.name], function(err) {
                if (err) {
                    console.log('Error inserting match into match_history:', err.message);
                    reject(err);
                }
                self.match_id = this.lastID;
                self.setTargets();
                self.savePriorities();
                console.log("NEW MATCH: " + self.homeTeam.teamName + " vs " + self.awayTeam.teamName);
                self.weather.startGameEffect(self, self.offenseTeam, self.defenseTeam);
                
                // Sort players by their quirk's START_EFFECT_ORDER
                self.players.sort((a, b) => a.quirk.START_EFFECT_ORDER - b.quirk.START_EFFECT_ORDER);

                // Activate startGameEffect in the sorted order
                for(const player of self.players) {
                    player.quirk.startGameEffect(self, player);
                    player.setHp();
                }
                self.runMatch();
                resolve();
            });
        });
    }

    endGame() {
        console.log("Game over!");
        console.log(this.offenseTeam.teamName + " " + this.offenseTeam.score + " - " + this.defenseTeam.score + " " + this.defenseTeam.teamName)
        //console.log("Possession lengths: " + this.possessionLengths);
        //console.log("Average possession length: " + this.possessionLengths.reduce((a, b) => a + b, 0) / this.possessionLengths.length);
        //console.log("Shots attempted: " + this.shotsAttempted);
        //console.log("Average " + this.offenseTeam.teamName + " advancement: " + this.homeAdvancements.reduce((a, b) => a + b, 0) / this.homeAdvancements.length);
        //console.log("Average " + this.defenseTeam.teamName + " advancement: " + this.awayAdvancements.reduce((a, b) => a + b, 0) / this.awayAdvancements.length);

        // Update match_history
        const self = this;
        db.run(`UPDATE match_history SET home_team_score = ?, away_team_score = ? WHERE id = ?`,
            [self.homeTeam.score, self.awayTeam.score, self.match_id], function(err) {
            if (err) {
                console.error("Error updating scores in match_history:", err.message);
            }
            function calculateAverageAdvancement(advancements, start, end) {
                const slice = advancements.slice(start, end);
                const sum = slice.reduce((a, b) => a + b, 0);
                return sum / slice.length;
            }

            const homeAdvancements = [
                calculateAverageAdvancement(self.homeAdvancements, 0, 12),
                calculateAverageAdvancement(self.homeAdvancements, 12, 25),
                calculateAverageAdvancement(self.homeAdvancements, 25, 37),
                calculateAverageAdvancement(self.homeAdvancements, 37, 50)
            ];

            const awayAdvancements = [
                calculateAverageAdvancement(self.awayAdvancements, 0, 12),
                calculateAverageAdvancement(self.awayAdvancements, 12, 25),
                calculateAverageAdvancement(self.awayAdvancements, 25, 37),
                calculateAverageAdvancement(self.awayAdvancements, 37, 50)
            ];

            console.log(self.homeAdvancements[60])
            console.log(self.awayAdvancements[60])

            console.log("Home Team Average Advancements (first 25, second 25, third 25, fourth 25):", homeAdvancements);
            console.log("Away Team Average Advancements (first 25, second 25, third 25, fourth 25):", awayAdvancements);
        });
    }

    // Function to get player object by id
    getPlayerById(id) {
        //console.log("Finding player: " + id);
        for (const player of this.players) {
            if (player.id === id) {
                //console.log("Found player: " + player.name);
                return player;
            }
        }
    }

    tick() { //every game tick
        //console.log("");
        this.turnedover = false;
        //console.log("Tick " + this.gameTicks);
        //console.log(this.offenseTeam.teamName + " " + this.position + " " + this.defenseTeam.teamName);
        this.possessionTicks++;
        this.gameTicks++;
        this.weather.tickEffect(this.offenseTeam, this.defenseTeam);
        
        for(const player of this.players) {
            player.quirk.tickEffect(player, this);
        }

        this.resetTempStats();
        this.setRandomPriorities(); //randomly change priorities
        this.doPriority("Assist", this.assist, true) //calculate assists and add temp stats to player
        this.doPriority("Protect", this.protect, true) //calculate protection and add ProtectBulk to player 
        this.resetInjuries();
        this.doPriority("Attack", this.attack, true) //calculate injuries and tick stat decreases
        this.applyInjuries();
        this.doAdvancement();
        if(!this.turnedover) {
            this.doScoring();
        }

        db.run(`INSERT INTO match_ticks_history (tick, match_id, possession_team_id, ball_position) `
            + `VALUES (?, ?, ?, ?)`, [this.gameTicks, this.match_id, this.offenseTeam.teamId, this.position],
            function(err) {
                if (err) {
                    console.error('Error inserting into match_tick_history:', err.message);
                }
            }
        )

       if(this.gameTicks == this.GAME_LENGTH) {
            this.endGame();
        }
    }

    setRandomPriorities() { //each player has a 5% chance to change their priority, saves their base priority
        const offensePriorityList = ["Assist", "Protect", "Attack", "Advance", "Score"];
        const defensePriorityList = ["Assist", "Protect", "Attack", "Defend_Advance", "Defend_Score"];
        for(const player of this.offenseTeam.players) {
            if(Math.random() < 0.05 && player.offensePriority == player.savedOffensePriority) {
                player.offensePriority = offensePriorityList[Math.floor(Math.random() * offensePriorityList.length)];
                player.offensePriorityTarget = "Any";
                //console.log(player.name + " changed priority from " + player.savedOffensePriority + " to " + player.offensePriority);
            }
            else {
                player.offensePriority = player.savedOffensePriority;
                player.offensePriorityTarget = player.savedOffensePriorityTarget;
            }
        }
        for(const player of this.defenseTeam.players) {
            if(Math.random() < 0.05 && player.defensePriority == player.savedDefensePriority) {
                player.defensePriority = defensePriorityList[Math.floor(Math.random() * defensePriorityList.length)];
                player.defensePriorityTarget = "Any";
                //console.log(player.name + " changed priority from " + player.savedDefensePriority + " to " + player.defensePriority);
            }
            else {
                player.defensePriority = player.savedDefensePriority;
                player.defensePriorityTarget = player.savedDefensePriorityTarget;
            }
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
        for(const player of this.players) {
            player.tempInjury = 0;
            if(player.hp >= player.maxHp * 0.5) {
                player.bulk = player.baseBulk;
                player.finesse = player.baseFinesse;
                player.height = player.baseHeight;
                player.strength = player.baseStrength;
            }
            else {
                player.bulk = Math.max(0.5, player.baseBulk * (0.5 + player.hp / player.maxHp));
                player.finesse = Math.max(0.5, player.baseFinesse * (0.5 + player.hp / player.maxHp));
                player.height = Math.max(0.5, player.baseHeight * (0.5 + player.hp / player.maxHp));
                player.strength = Math.max(0.5, player.baseStrength * (0.5 + player.hp / player.maxHp));
                console.log(player.name + " is injured! Hp: " + player.hp);
                console.log("Bulk: " + player.bulk + " Finesse: " + player.finesse + " Height: " + player.height + " Strength: " + player.strength);
            }
        }
    }

    applyInjuries() { 
        for(const player of this.players) {
            player.bulk = Math.max(player.bulk-player.tempInjury,0);
            player.finesse = Math.max(player.finesse-player.tempInjury,0);
            player.height = Math.max(player.height-player.tempInjury,0);
            player.strength = Math.max(player.strength-player.tempInjury,0);
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
                            if(player.offensePriorityTarget == "Any") {
                                this.assist(player,this.offenseTeam.players[Math.floor(Math.random() * this.offenseTeam.players.length)]);
                            }
                            else {
                                this.assist(player, player.offensePriorityTarget);
                            }
                            break;
                        case "Protect":
                            if(player.offensePriorityTarget == "Any") {
                                this.protect(player,this.offenseTeam.players[Math.floor(Math.random() * this.offenseTeam.players.length)]);
                            }
                            else {
                                this.protect(player, player.offensePriorityTarget);
                            }
                            break;
                        case "Attack":
                            if(player.offensePriorityTarget == "Any") {
                                this.attack(player,this.defenseTeam.players[Math.floor(Math.random() * this.defenseTeam.players.length)]);
                            }
                            else {
                                this.attack(player, player.offensePriorityTarget);
                            }
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
                            if(player.defensePriorityTarget == "Any") {
                                this.assist(player,this.defenseTeam.players[Math.floor(Math.random() * this.defenseTeam.players.length)]);
                            }
                            else {
                                this.assist(player, player.defensePriorityTarget);
                            }   
                            break;
                        case "Protect":
                            if(player.defensePriorityTarget == "Any") {
                                this.protect(player,this.defenseTeam.players[Math.floor(Math.random() * this.defenseTeam.players.length)]);
                            }
                            else {
                                this.protect(player, player.defensePriorityTarget);
                            }
                            break;
                        case "Attack":
                            if(player.defensePriorityTarget == "Any") {
                                this.attack(player,this.offenseTeam.players[Math.floor(Math.random() * this.offenseTeam.players.length)]);
                            }
                            else {
                                this.attack(player, player.defensePriorityTarget);
                            }
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
        player.attack(this, target, this.weather.INJURY_PERMANENCE_MODIFIER);
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
                    advanceAmount += Math.random() * (player.strength + player.tempStrength) + player.strength/2;
                    //console.log(player.name + " strength " + player.strength + " + " + player.tempStrength);
                }
            }
            if(numAdvancers > 1) {advanceAmount *= 1-(this.MULTIPLE_ADVANCERS_REDUCTION*numAdvancers);} //if more than one player is advancing, reduce the amount advanced by 20%
            if(numAdvancers == 0) {advanceAmount = Math.random() * this.NO_ADVANCERS_MAX_ADVANCEMENT;} //if no players are advancing, a little advancement occurs

            // Loop through defense team, calculate amount defended
            let numDefenders = 0;
            let defendAmount = 0;
            for (const player of this.defenseTeam.players) {
                if(player.defensePriority === "Defend_Advance") {
                    if(minTrickiness > player.tempFocus && Math.random() < this.TRICK_CHANCE) { //trickiness check
                        //console.log(player.name + " was tricked!");
                    }
                    else {
                        defendAmount += Math.random() * (player.bulk + player.tempBulk);
                    }
                    numDefenders++;
                    //console.log(player.name + " bulk " + player.bulk + " + " + player.tempBulk);
                }
            }
            if(numDefenders > 1) {defendAmount *= 1-(this.MULTIPLE_ADVANCE_DEFENDERS_REDUCTION*numDefenders);} //if more than one player is defending, reduce the amount defended by 20%

            // Calculate net advancement
            let netAdvance = 0;
            //console.log("Advance: " + advanceAmount + " Defend: " + defendAmount);
            if(advanceAmount > defendAmount) {
                netAdvance = Math.random() * (advanceAmount - defendAmount) * 2 + (advanceAmount - defendAmount);
            } else {
                netAdvance = 0;
            }
            if(this.offenseTeam == this.awayTeam) {this.awayAdvancements.push(netAdvance);}
            else {this.homeAdvancements.push(netAdvance);}

            // Cap net advancement if necessary
            if(this.MAX_ADVANCEMENT_PER_TICK != null) {
                if(netAdvance > this.MAX_ADVANCEMENT_PER_TICK) {netAdvance = this.MAX_ADVANCEMENT_PER_TICK}
            }
            
            this.position += netAdvance;

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
                if(player.offensePriority === "Advance" && !this.turnedover) { //on touchdown, the player who is advancing will try to score
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
        this.turnedover = true;
        this.possessionLengths.push(this.possessionTicks);
        this.possessionTicks = 0;
        this.position = this.FIELD_LENGTH - this.position;
        const tempTeam = this.offenseTeam;
        this.offenseTeam = this.defenseTeam;
        this.defenseTeam = tempTeam;
        for(const player of this.players) {
            player.quirk.turnoverEffect(player, this);
        }
    }

    shoot(shooter) {
        let numShooters = 0;
        for (const player of this.offenseTeam.players) { //count number of shooters
            if(player.offensePriority === "Score") {
                numShooters++;
            }
        }
        this.shotsAttempted++;
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
            score = shooting > -2; //wanted to make it easier to score bc its influenced by distance and defenders
        }
        const range = Math.max(Math.round(this.FIELD_LENGTH - this.position),0);
        db.run(`INSERT INTO scoring_history (match_id, tick, shooter_id, successful_score, team_id, range) `
            + `VALUES (?, ?, ?, ?, ?, ?)`, [this.match_id, this.gameTicks, shooter.id, score, this.offenseTeam.teamId, range],
            function(err) {
                if (err) {
                    console.error('Error inserting score into scoring_history:', err.message);
                }
            });
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