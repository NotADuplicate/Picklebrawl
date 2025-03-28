import e from 'express';
import {db} from '../database.js';
import {Season} from './season.js';
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
    playerWithPossession;
    blitzerId = null;
    minRanges = [];
    over = false;
    lastAdvance = 0;
    breakAway = 0;
    breakAwayer = null;
    type = "friendly";
    last_turned_over = 0;

    // CONSTANTS
    GAME_LENGTH = 100;    // number of ticks to play the game for // TODO: set to 100 when done testing
    FIELD_LENGTH = 100;
    MULTIPLE_ADVANCERS_REDUCTION = 0.1;
    NO_ADVANCERS_MAX_ADVANCEMENT = 2;
    MULTIPLE_ADVANCE_DEFENDERS_REDUCTION = 0.1;
    MAX_ADVANCEMENT_PER_TICK = null;
    NET_ADVANCEMENT_MODIFIER = 1.0;
    TURNOVER_CHANCE_INCREASE_PER_TICK = 0.015;
    RANDOM_PRIORITY_CHANCE = .15;
    TURNOVER_CHANCE_MAX = 0.3;
    SHOOTING_DISTANCE_LINEAR = 0.08;
    SHOOTING_DISTANCE_EXPONENTIAL = 0.001;
    INJURY_PERMANENCE_MODIFIER = 1;    // TODO: not implemented yet
    TRICK_CHANCE = 1/3;
    ASSIST_MODIFIER = 1;
    SHOOTING_BONUS = 1.5;
    ADVANCEMENT_MULTIPLIER = 1.3;
    MULTIPLE_BLOCKER_REDUCTION = 0.2;

    RANGE_DICTIONARY = {
        "Close": 12,
        "Medium": 28,
        "Far": 40,
        "Half Field": 55,
        "Full Field": 100
    }

    constructor(homeTeam, awayTeam, weather, type) {
        //console.log("\n\n\n\n\n\n");
        this.homeTeam = homeTeam;
        this.awayTeam = awayTeam;
        this.homeTeam.score = 0;
        this.awayTeam.score = 0;
        this.offenseTeam = this.homeTeam;
        this.defenseTeam = this.awayTeam;
        this.weather = weather;
        this.type = type;
        //console.log("Match type:", type)
    }

    runMatch() {
        while(!this.over) {
            this.tick();
            //await new Promise(r => setTimeout(r, 100));
        }
    }

    setTargets() {
        // Loop through offense team players and set offenseTarget to player object
        for (const player of this.players) {
            if (player.offensePriorityTarget !== null) {
                player.offensePriorityTarget = this.getPlayerById(player.offensePriorityTarget);
                player.savedOffensePriorityTarget = player.offensePriorityTarget;
            }
            else {
                player.offensePriorityTarget == "Any";
            }
            if(player.offenseProperty == "Any") {
                player.offensePriorityTarget = "Any";
            }
            if (player.defensePriorityTarget !== null) {
                player.defensePriorityTarget = this.getPlayerById(player.defensePriorityTarget);
                player.savedDefensePriorityTarget = player.defensePriorityTarget;
            }
            else {
                player.defensePriorityTarget = "Any";
            }
            if(player.defenseProperty == "Any") {
                player.defensePriorityTarget = "Any";
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
            //console.log("OFFENSE:", player.offensePriority)
            //console.log("DEFENSE:", player.defensePriority)

            db.run(`INSERT INTO player_history ` 
                + `(match_id, second_half, player_id, offensive_role, offensive_target_id, `
                + `defensive_role, defensive_target_id, health) `
                + `VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [self.match_id, false, player.id, player.offensePriority, offenseId,
                player.defensePriority, defenseId, player.hp], function(err) {
                if (err) {
                    console.error('Error inserting player into player_history:', err.message);
                }
                player_history_id = this.lastID;
                //console.log("Saved priority: ", this.lastID)
            });
        }
    }

    startGame(challengeId, type) {
        this.players = this.homeTeam.players.concat(this.awayTeam.players);
        const self = this;
        return new Promise((resolve, reject) => {
            db.run(`INSERT INTO match_history (league_id, home_team_id, away_team_id, challenge_id,`
                + `weather, type) VALUES (?, ?, ?, ?, ?, ?)`, 
                [this.homeTeam.leagueId, this.homeTeam.teamId, this.awayTeam.teamId, challengeId, this.weather.name, type], function(err) {
                if (err) {
                    //console.log('Error inserting match into match_history:', err.message);
                    reject(err);
                }
                self.match_id = this.lastID;
                self.setTargets();
                //console.log("NEW MATCH: " + self.homeTeam.teamName + " vs " + self.awayTeam.teamName);
                self.weather.startGameEffect(self, self.offenseTeam, self.defenseTeam);
                
                // Find and remove players with quirk title "Ghost"
                const ghostPlayers = self.players.filter(player => player.quirk.title === "Ghost");
                self.players = self.players.filter(player => player.quirk.title !== "Ghost");

                // Sort remaining players by their quirk's START_EFFECT_ORDER
                self.players.sort((a, b) => a.quirk.START_EFFECT_ORDER - b.quirk.START_EFFECT_ORDER);

                // Activate startGameEffect in the sorted order
                for(const player of self.players) {
                    //console.log("Player hp: ", player.id, player.hp)
                    player.quirk.startGameEffect(self, player);
                    if(player.offensePriority == "Score") {
                        player.range = self.RANGE_DICTIONARY[player.offenseProperty];
                    }
                }
                //do the second start effect
                self.players.sort((a, b) => a.quirk.SECOND_START_EFFECT_ORDER - b.quirk.SECOND_START_EFFECT_ORDER);
                for(const player of self.players) {
                    player.quirk.secondStartGameEffect(self, player);
                }

                // Re-add ghost players to the players list
                self.players.push(...ghostPlayers);      
                self.savePriorities();
                
                for(const player of self.players) {
                    player.quirk.thirdStartGameEffect(self, player);
                }
                self.runMatch();
                resolve();
            });
        });
    }

    endGame() {
        this.over = true;
        //console.log("Game over!");
        //console.log(this.offenseTeam.teamName + " " + this.offenseTeam.score + " - " + this.defenseTeam.score + " " + this.defenseTeam.teamName)

        //console.log("Possession lengths: ", this.possessionLengths)
        //console.log("Average: ", this.possessionLengths.length 
          //  ? this.possessionLengths.reduce((sum, val) => sum + val, 0) / this.possessionLengths.length 
            //: 0);

        // Update match_history
        const self = this;
        db.run(`UPDATE match_history SET home_team_score = ?, away_team_score = ? WHERE id = ?`,
            [self.homeTeam.score, self.awayTeam.score, self.match_id], function(err) {
            if (err) {
                console.error("Error updating scores in match_history:", err.message);
            }
            if(self.type == "tournament") {
                //console.log("Updating tournament match\n")
                const winnerId = self.homeTeam.score > self.awayTeam.score ? self.homeTeam.teamId : self.awayTeam.teamId;
                const season = new Season(self.homeTeam.leagueId);
                season.updateTournamentMatch(self.match_id, winnerId);
            }
        });
        if(this.type != "friendly") { //do health things for friendly matches
            const updatePromises = this.players.map(player => {
                return new Promise((resolve, reject) => {
                    db.run(`UPDATE players SET health = ? WHERE id = ?`, [Math.min(100, Math.round(player.hp)), player.id], function(err) {
                        if (err) {
                            console.error('Error updating player health:', err.message);
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                });
            });

            Promise.all(updatePromises).then(() => {
                //console.log("Healing Teams: ", this.offenseTeam.teamId, this.defenseTeam.teamId)
                const randHpIncrease = 25 + Math.random()*50;
                db.run(`UPDATE players SET health = MIN(100, health + ?) WHERE team_id = ? OR team_id = ?`,
                    [randHpIncrease, this.offenseTeam.teamId, this.defenseTeam.teamId], function(err) {
                        if(err) {
                            //console.log("Error regaining health ", err)
                        }
                        //console.log("Updated player health: ", this.changes)
                    })
            }).catch(err => {
                console.error('Error updating player health:', err);
            });
        }
    }

    // Function to get player object by id
    getPlayerById(id) {
        ////console.log("Finding player: " + id);
        for (const player of this.players) {
            if (player.id === id) {
                ////console.log("Found player: " + player.name);
                return player;
            }
        }
    }

    tick() { //every game tick
        if(this.over) {
            return;
        }

        if(this.offenseTeam.players.length == 0) {
            this.offenseTeam.full_dead = true;
        }
        if(this.defenseTeam.players.length == 0) {
            this.defenseTeam.full_dead = true;
        }

        this.turnedover = false;

        if(this.offenseTeam.full_dead) {
            //console.log("TURNOVER BC DEAD")
            this.turnover();
        }

        this.possessionTicks++;
        this.gameTicks++;
        ////console.log("TICK:", this.gameTicks, "\n")
        this.weather.tickEffect(this.offenseTeam, this.defenseTeam);
        this.playerWithPossession = this.offenseTeam.players[Math.floor(Math.random() * this.offenseTeam.players.length)];

        this.resetTempStats();
        this.setRandomPriorities(); //randomly change priorities
        this.doPriority("Assist", this.assist, true) //calculate assists and add temp stats to player
        this.doPriority("Protect", this.protect, true) //calculate protection and add ProtectBulk to player 
        this.resetInjuries();
        if(!this.offenseTeam.full_dead && !this.defenseTeam.full_dead) {
            this.doPriority("Attack", this.attack, true) //calculate injuries and tick stat decreases
        }
        this.applyInjuries();
        this.doAdvancement();
        if(!this.turnedover) {
            this.doScoring();
        }

        if(!this.offenseTeam.players.includes(this.playerWithPossession) || this.playerWithPossession.knockedOut) { //cant have possession if youre not on offense
            const healthyPlayer = this.offenseTeam.players.find(player => !player.knockedOut);
            if (healthyPlayer) {
                this.playerWithPossession = healthyPlayer;
            } else {
                //console.log("TURNOVER BC UNHEALTHY")
                this.turnover();
            }
        }

        db.run(`INSERT INTO match_ticks_history (tick, match_id, possession_team_id, ball_position, player_possession_id) `
            + `VALUES (?, ?, ?, ?, ?)`, [this.gameTicks, this.match_id, this.offenseTeam.teamId, this.position, this.playerWithPossession.id],
            function(err) {
                if (err) {
                    console.error('Error inserting into match_tick_history:', err.message);
                }
            }
        )

        if(this.gameTicks == Math.floor(this.GAME_LENGTH/2)) {
            //console.log("HALF TIME \n")
            for(const player of this.players) {
                player.quirk.halftimeEffect(this, player);
            }
        }

       if(this.gameTicks >= this.GAME_LENGTH) { //overtime
            this.FIELD_LENGTH -= 1.5;
            if((this.turnedover || this.offenseTeam.score > this.defenseTeam.score) && this.offenseTeam.score != this.defenseTeam.score) {
                this.endGame();
            }
        }
    }

    setRandomPriorities() { //each player has a 5% chance to change their priority, saves their base priority
        const offensePriorityList = ["Attack", "Advance", "Score"];
        const defensePriorityList = ["Attack", "Defend_Advance", "Defend_Score"];
        for(const player of this.offenseTeam.players) {
            if(player.knockedOut) {
                player.offensePriority = "KO";
                player.offensePriorityTarget = "Any";
            }
            else if(Math.random() < this.RANDOM_PRIORITY_CHANCE && player.offensePriority == player.savedOffensePriority) {
                player.offensePriority = offensePriorityList[Math.floor(Math.random() * offensePriorityList.length)];
                player.offensePriorityTarget = "Any";
                if(player.savedOffensePriority != player.offensePriority) {
                    db.run(`INSERT INTO match_action_history (tick, match_id, player_id, action) `
                        + `VALUES (?, ?, ?, ?)`, [this.gameTicks, this.match_id, player.id, player.offensePriority]);
                }
            }
            else {
                player.offensePriority = player.savedOffensePriority;
                player.offensePriorityTarget = player.savedOffensePriorityTarget;
            }
        }
        for(const player of this.defenseTeam.players) {
            if(player.knockedOut) {
                player.defensePriority = "KO";
                player.defensePriorityTarget = "Any";
            }
            else if(Math.random() < 0.05 && player.defensePriority == player.savedDefensePriority) {
                player.defensePriority = defensePriorityList[Math.floor(Math.random() * defensePriorityList.length)];
                player.defensePriorityTarget = "Any";
                ////console.log(player.name + " changed priority from " + player.savedDefensePriority + " to " + player.defensePriority);
                if(player.savedDefensePriority != player.defensePriority) {
                    db.run(`INSERT INTO match_action_history (tick, match_id, player_id, action) `
                        + `VALUES (?, ?, ?, ?)`, [this.gameTicks, this.match_id, player.id, player.offensePriority]);
                }
            }
            else {
                player.defensePriority = player.savedDefensePriority;
                player.defensePriorityTarget = player.savedDefensePriorityTarget;
            }
        }
    }

    resetTempStats() {
        for(const player of this.players) {
            player.tempBulk = 0;
            player.tempFinesse = 0;
            player.tempHeight = 0;
            player.tempStrength = 0;
            player.tempTrickiness = player.trickiness;
            player.tempFocus = player.focus;
            player.assisters = 0;
            player.protectBulk = 0;
        }
    }

    resetInjuries() {
        for(const player of this.players) {
            player.tempInjury = 0;
            //player.hp = 100;
            player.bulk = Math.max(0.5, player.baseBulk * (player.hp / player.maxHp));
            player.finesse = Math.max(0.5, player.baseFinesse * (player.hp / player.maxHp));
            player.height = Math.max(0.5, player.baseHeight * (player.hp / player.maxHp));
            player.strength = Math.max(0.5, player.baseStrength * (player.hp / player.maxHp));
            player.focus = player.baseFocus;
            player.trickiness = player.baseTrickiness;
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
        if(this.over) {
            return;
        }
        // Loop through offense team
        for (const player of this.offenseTeam.players) {
            if(action == "Attack" && (this.offenseTeam.full_dead || this.defenseTeam.full_dead)) {
                //console.log("Tried to attack but full dead")
                return;
            }

            //Protect even on the other end
            /*if(player.defensePriority == "Protect" && priority == "Protect") {
                if(player.defensePriorityTarget == "Any") {
                    this.protect(player,this.defenseTeam.players[Math.floor(Math.random() * this.defenseTeam.players.length)]);
                }
                else {
                    this.protect(player, player.defensePriorityTarget);
                }
            }*/
            if (player.offensePriority === priority  && !player.knockedOut) {
                if (targeted) {
                    switch(priority) {
                        case "Assist":
                            if(typeof(player.offensePriorityTarget) == "object" && player.offensePriorityTarget != null && player.offensePriorityTarget.knockedOut) {
                                this.assist(player,this.offenseTeam.players[Math.floor(Math.random() * this.offenseTeam.players.length)]);
                            }
                            else if(player.offensePriorityTarget == "Any") {
                                this.assist(player,this.offenseTeam.players[Math.floor(Math.random() * this.offenseTeam.players.length)]);
                            }
                            else {
                                this.assist(player, player.offensePriorityTarget);
                            }
                            break;
                        case "Protect":
                            if(typeof(player.offensePriorityTarget) == "object" && player.offensePriorityTarget != null && player.offensePriorityTarget.knockedOut) {
                                this.protect(player,this.offenseTeam.players[Math.floor(Math.random() * this.offenseTeam.players.length)]);
                            }
                            else if(player.offensePriorityTarget == "Any" && this.offenseTeam.players.length > 1) {
                                let target;
                                do {
                                    target = this.offenseTeam.players[Math.floor(Math.random() * this.offenseTeam.players.length)];
                                } while (target === player);
                                this.protect(player,target);
                            }
                            else {
                                this.protect(player, player.offensePriorityTarget);
                            }
                            break;
                        case "Attack":
                            if(typeof player.offensePriorityTarget == "object" && player.offensePriorityTarget != null && player.offensePriorityTarget.knockedOut) {
                                //console.log("First attck")
                                player.offensePriorityTarget = "Any";
                                this.attack(player,this.defenseTeam.players[Math.floor(Math.random() * this.defenseTeam.players.length)]);
                            }
                            else if(player.offensePriorityTarget == "Any") {
                                //console.log("Attack any, ", this.defenseTeam.players.length)
                                this.attack(player,this.defenseTeam.players[Math.floor(Math.random() * this.defenseTeam.players.length)]);
                            }
                            else if(typeof player.offensePriorityTarget == "object" && player.offensePriorityTarget != null) {
                                //console.log("Last attack")
                                this.attack(player, player.offensePriorityTarget);
                            }
                            break;
                        default:
                            //console.log("Action: ", player.offensePriorityTarget.name)
                            action(player, player.offensePriorityTarget);
                    }
                } else {
                    //console.log("Action:")
                    action(player);
                }
            }
        }

        // Loop through defense team
        for (const player of this.defenseTeam.players) {
            if (player.defensePriority === priority && !player.knockedOut) {
                if (targeted) {
                    switch(priority) {
                        case "Assist":
                            if(typeof(player.defensePriorityTarget) == "object" && player.defensePriorityTarget != null && player.defensePriorityTarget.knockedOut) {
                                this.assist(player,this.offenseTeam.players[Math.floor(Math.random() * this.offenseTeam.players.length)]);
                            }
                            else if(player.defensePriorityTarget == "Any") {
                                this.assist(player,this.defenseTeam.players[Math.floor(Math.random() * this.defenseTeam.players.length)]);
                            }
                            else {
                                this.assist(player, player.defensePriorityTarget);
                            }   
                            break;
                        case "Protect":
                            if(player.defensePriorityTarget == "Any" && this.defenseTeam.players.length > 1) {
                                let target;
                                do {
                                    target = this.defenseTeam.players[Math.floor(Math.random() * this.defenseTeam.players.length)];
                                } while (target === player);
                                this.protect(player,target);
                            }
                            else {
                                this.protect(player, player.defensePriorityTarget);
                            }
                            break;
                        case "Attack":
                            if(typeof player.defensePriorityTarget == "object" && player.defensePriorityTarget != null && player.defensePriorityTarget.knockedOut) {
                                //console.log("Attacking knocked out player");
                                player.defensePriorityTarget = "Any";
                                this.attack(player,this.offenseTeam.players[Math.floor(Math.random() * this.offenseTeam.players.length)]);
                            }
                            else if(player.defensePriorityTarget == "Any") {
                                //console.log("Attack any defense")
                                this.attack(player,this.offenseTeam.players[Math.floor(Math.random() * this.offenseTeam.players.length)]);
                            }
                            else if(player.defensePriorityTarget !== null) {
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
        player.attack(this, target);
    }
    
    assist(player, target) {
        player.assist(target, this.ASSIST_MODIFIER);
    }

    protect(player, target) {
        player.protect(target);
    }

    doAdvancement() {
        if(this.over) {
            return;
        }
        //console.log("Starting advancement")
        const self = this;
        if(this.turnedover) {return;}
        let advancing = this.weather.advanceEffect(this.offenseTeam, this.defenseTeam, this.position);
        if(advancing == null) {
            // Loop through offense team, calculate amount advanced
            let numAdvancers = 0;
            let advanceAmount = 0;
            let minTrickiness = 100; //if multiple advancers, its the least tricky advancer
            let topAdvancer = this.offenseTeam.players[Math.floor(Math.random() * this.offenseTeam.players.length)];
            let topAdvancerAmount = -1;
            for (const player of this.offenseTeam.players) {
                if(player.offensePriority === "Advance" && this.turnedover == false) {
                    if(player.trickiness < minTrickiness) {minTrickiness = player.trickiness;}
                    numAdvancers++;
                    player.advance = Math.random() * (player.strength + player.tempStrength) + player.strength / 4;
                    advanceAmount += player.advance;

                    // Track the player who contributes the most to the advanceAmount
                    if (player.advance > topAdvancerAmount) {
                        topAdvancer = player;
                        topAdvancerAmount = player.advance;
                    }
                }
            }
            if(numAdvancers > 1) {//if more than one player is advancing, reduce the amount advanced by 20%
                advanceAmount *= 1-(this.MULTIPLE_ADVANCERS_REDUCTION*numAdvancers);
            } 
            if(numAdvancers == 0) {//if no players are advancing, a little advancement occurs
                minTrickiness = -1;
                advanceAmount = Math.random() * this.NO_ADVANCERS_MAX_ADVANCEMENT;
            } 
            if(topAdvancer != null) {
                if(this.offenseTeam.players.includes(topAdvancer)) {
                    this.playerWithPossession = topAdvancer;
                }
                else {
                    //console.log("TOP ADVANCER IS A DEFENDER??")
                }
            }

            // Loop through defense team, calculate amount defended
            let defendAmount = 0;
            let numDefenders = 0;
            let topDefender = null;
            let topDefendAmount = 0;
            if(!this.defenseTeam.full_dead) {
                for (const player of this.defenseTeam.players) {
                    if(player.defensePriority === "Defend_Advance") {
                        if(player.quirk.beTrickedEffect(player, topAdvancer, this) && topAdvancer.quirk.trickEffect(topAdvancer, player, this)) { //trickiness check
                            //console.log(player.name, " was tricked by ", topAdvancer.name, topAdvancer.trickiness, player.focus)
                            db.run(`INSERT INTO match_trick_history (match_id, tick, tricker_id, tricked_id, trick_type) `
                                + `VALUES (?, ?, ?, ?, ?)`, [this.match_id, this.gameTicks, topAdvancer.id, player.id, "Advance"],
                                function(err) {
                                    if (err) {
                                        console.error('Error inserting trick into match_trick_history:', err.message);
                                    }
                                }
                            );
                        }
                        else {
                            player.defendAmount = Math.random() * (player.bulk + player.tempBulk);
                            defendAmount += player.defendAmount;

                            // Track the player who contributes the most to the defendAmount
                            if (player.defendAmount > topDefendAmount) {
                                topDefendAmount = player.defendAmount;
                                topDefender = player;
                            }
                        }
                        numDefenders++;
                        ////console.log(player.name + " bulk " + player.bulk + " + " + player.tempBulk);
                    }
                }
                if(numDefenders > 1) {defendAmount *= 1-(this.MULTIPLE_ADVANCE_DEFENDERS_REDUCTION*numDefenders);} //if more than one player is defending, reduce the amount defended by 20%
                defendAmount += Math.random() * 3;
            }

            // Calculate net advancement
            let netAdvance = 0;

            //Comeback mechanic
            advanceAmount += (1-this.position/this.FIELD_LENGTH)*4;
            advanceAmount += Math.max(9,this.defenseTeam.score -this.offenseTeam.score)/3;

            if(this.defenseTeam.full_dead) { this.breakAway = 10}
            if(this.breakAway > 0) { 
                //console.log("Breakaway: " + this.breakAway);
                this.breakAway -= 1 + 2*defendAmount/(advanceAmount+defendAmount);
                this.playerWithPossession = this.breakAwayer;
                defendAmount = 0;
                if(this.breakAway <= 0) {
                    //console.log("Breakaway over");
                }
            }

            if(advanceAmount > defendAmount) {
                const randomness = Math.random();
                netAdvance = randomness * (advanceAmount - defendAmount)*this.ADVANCEMENT_MULTIPLIER + (advanceAmount - defendAmount)/2;
                const netDefense = (randomness * advanceAmount + advanceAmount/2) * this.ADVANCEMENT_MULTIPLIER - netAdvance;
                this.savePlayerAdvancement(netAdvance);
                if(!this.defenseTeam.full_dead) {
                    this.savePlayerDefend(netDefense);
                }

                //Chance for a break away
                if(topAdvancer != null) {
                    if(Math.random() < topAdvancer.breakAwayChance && !this.defenseTeam.full_dead) {
                        this.breakAway = 10+Math.random()*5;
                        //console.log("Breakaway! ", this.breakAway);
                        topAdvancer.breakAwayChance -= 0.02;
                        this.breakAwayer = topAdvancer;
                        db.run(`INSERT INTO advancement_history (tick, match_id, player_id, advancement, type) `
                            + `VALUES (?, ?, ?, ?, ?)`, [this.gameTicks, this.match_id, topAdvancer.id, this.breakAway, "Breakaway"],
                            function(err) {
                                if (err) {
                                    console.error('Error inserting breakaway into advancement_history:', err.message);
                                }
                            }
                        );
                    }
                }
            } else {
                netAdvance = 0;
                if(!this.defenseTeam.full_dead) {
                    this.savePlayerDefend(Math.random() * (advanceAmount) * this.ADVANCEMENT_MULTIPLIER + (advanceAmount)/2);
                }
            }
            if(this.offenseTeam == this.awayTeam) {this.awayAdvancements.push(netAdvance);}
            else {this.homeAdvancements.push(netAdvance);}

            // Cap net advancement if necessary
            if(this.MAX_ADVANCEMENT_PER_TICK != null) {
                if(netAdvance > this.MAX_ADVANCEMENT_PER_TICK) {netAdvance = this.MAX_ADVANCEMENT_PER_TICK}
            }
            
            this.position += netAdvance;
            this.lastAdvance = netAdvance;

            // Calculate turnover chance
            if(!this.defenseTeam.full_dead && this.possessionTicks > 2) {
                let turnoverChance = (this.possessionTicks-this.last_turned_over) * this.TURNOVER_CHANCE_INCREASE_PER_TICK;
                //console.log("Turnover chance: ", this.possessionTicks, this.TURNOVER_CHANCE_INCREASE_PER_TICK)
                if (turnoverChance > this.TURNOVER_CHANCE_MAX) {turnoverChance = this.TURNOVER_CHANCE_MAX;}
                
                const rand = Math.random();
                
                if(rand < turnoverChance) {
                    //console.log("Turnover rand: ", rand)
                    this.possessionLengths.push(this.possessionTicks);
                    if(topDefender == null) {
                        topDefender = this.defenseTeam.players[Math.floor(Math.random() * this.defenseTeam.players.length)]
                    }
                    if(topDefender != null) {
                        this.playerWithPossession = topDefender;
                        db.run(`INSERT INTO advancement_history (tick, match_id, player_id, advancement, type) ` 
                            + `VALUES (?, ?, ?, ?, ?)`, [self.gameTicks, self.match_id, topDefender.id, 0, "Steal"],
                            function(err) {
                                if (err) {
                                    //console.log(self.gameTicks, self.match_id, topDefender.id)
                                    console.error('Error inserting steal into advancement_history:', err.message);
                                }
                            }
                        );
                    }
                    for (const possibleShooter of this.offenseTeam.players) {
                        possibleShooter.range += 5; //if the ball is being stolen then start shooting from further
                    }
                    //console.log("Stolen")
                    this.turnover();
                }
            }
        }
        else {
            if(advancing == -1 && !this.defenseTeam.full_dead) { //if -1 advancement, automatic turnover
                //console.log("Advancing -1 \n \n");
                this.turnover();
            }
            else {
                //console.log("Increasing position by:", advancing)
                this.position += advancing;
            }
        }
    }

    doScoring() {
        if(this.position >= this.FIELD_LENGTH) { //attempt touchdown
            this.position = this.FIELD_LENGTH;
            for (const player of this.offenseTeam.players) { //a close shooter might shoot it
                if(player.offensePriority==="Score" && player.offenseProperty === "Close" && Math.random()>0.35) {
                    this.shoot(player,false);
                    return;
                }
            }
            for (const player of this.offenseTeam.players) {
                if(player.offensePriority === "Advance" && !this.turnedover) { //on touchdown, the player who is advancing will try to score
                    if(player.offenseProperty === "Blitz") {
                        this.blitzerId = player.id;
                        //console.log("Blitz shot");
                        this.offenseTeam.players.forEach((blitzer) => {
                            if(blitzer!= player) {
                                this.shoot(blitzer, true);
                            }
                        });
                        this.position = this.FIELD_LENGTH / 2;
                        //console.log("Blitzed")
                        this.turnover();
                        return;
                    }
                    //console.log("Touchdown shot");
                    this.shoot(player, false); //shoot
                    return;
                }
            }
            const randomShooter = this.offenseTeam.players[Math.floor(Math.random() * this.offenseTeam.players.length)];
            this.shoot(randomShooter, false);
            return;
        } else if(this.breakAway <= 0){ //check for trying to score
            for (const player of this.offenseTeam.players) {
                if(player.offensePriority === "Score" && (Math.random() < this.position/this.FIELD_LENGTH || player.offenseProperty === "Close")) { //scorers have ~30% chance of attempting a shot
                    ////console.log("Scoring randomness passed for player: ", player.name)
                    let range = 0;
                    let minRange;
                    if(player.offenseProperty === "Close") {
                        minRange = 0;
                    }
                    else { // dont shoot if youre on track to make a blitz
                        minRange = Math.min(this.lastAdvance*Math.max(5-this.possessionTicks,0),18); 
                        ////console.log("Player: ", player.name, " has a min range of: ", minRange)
                    }
                    if(this.gameTicks > this.GAME_LENGTH - 10) { //last second shot
                        if(this.offenseTeam.score == 1+this.defenseTeam.score - this.offenseTeam.players.length) { //have to blitz
                            minRange = 100;                            
                        }
                        else if(this.offenseTeam.score == this.defenseTeam.score - 1) { //have to regular score
                            minRange = 0;
                        }
                    }
                    if (player.offenseProperty in this.RANGE_DICTIONARY) {
                        range = player.range;
                        //console.log(player.name, " range:", range)
                    } else if(Math.random() < 0.1) {
                        range = 10 + player.finesse * 5 +Math.random() * 20;
                        this.defenseTeam.players.forEach((defender) => {
                            if(defender.defensePriority === "Defend_Score") {
                                range -= defender.height*5;
                            }
                        });
                    }
                    //console.log("position:", this.position)
                    //console.log(this.position + range >= this.FIELD_LENGTH, 100-this.position >= minRange)
                    if(this.position + range >= this.FIELD_LENGTH && 100-this.position >= minRange) { //if player is in range to shoot
                        //console.log(player.lastShotTick)
                        if(player.lastShotTick < this.gameTicks - 8) {
                            //console.log("Shot from: ", this.position);
                            //console.log("Shot Breakaway: ", this.breakAway);
                            this.shoot(player, false); //shoot
                        }
                    }
                }
            }
        }
    }

    turnover() { 
        //console.log("TURNOVER\n");
        this.last_turned_over = 0;
        this.turnedover = true;
        this.possessionTicks = 0;
        this.position = this.FIELD_LENGTH - this.position;
        const tempTeam = this.offenseTeam;
        this.offenseTeam = this.defenseTeam;
        this.defenseTeam = tempTeam;
        for(const player of this.players) {
            player.quirk.turnoverEffect(player, this);
        }
    }

    shoot(shooter, blitz) {
        if(this.turnedover || shooter==null) {return;}
        if(!blitz) {
            this.blitzerId = null;
        }

        this.playerWithPossession = shooter;
        this.breakAway = 0;
        let numShooters = 0;
        let numBlockers = 0;
        let dedicatedShooterBonus = 0;
        if(!blitz) {
            //console.log("Dedicated shooter")
            dedicatedShooterBonus = 1.5;
        }
        for (const player of this.offenseTeam.players) { //count number of shooters
            if(player.offensePriority === "Score") {
                numShooters++;
            }
        }
        this.shotsAttempted++;
        shooter.lastShotTick = this.gameTicks;
        //console.log(shooter.name + " is shooting!");
        //console.log(shooter.finesse + " + " + shooter.tempFinesse);
        let score = this.weather.scoreEffect(shooter, this.offenseTeam, this.defenseTeam, this.position);
        let blocker_ids = [];
        const range = Math.max(Math.round(this.FIELD_LENGTH - this.position),0);
        if(score == null) { //no weather effect, handle scoring as usual
            let shooting = Math.random() * (shooter.finesse + shooter.tempFinesse + shooter.PLAYER_SHOOTING_BONUS + dedicatedShooterBonus)
            //console.log("Shooting: " + shooting);
            ////console.log("Shooting: " + shooting);
            for (const player of this.defenseTeam.players) {
                if(player.defensePriority === "Defend_Score") {
                    numBlockers++;
                    //console.log("Shooter trickiness: ", shooter.tempTrickiness);
                    //console.log("Defender focus: ", player.tempFocus);
                    if(player.quirk.beTrickedEffect(player, shooter, this) && shooter.quirk.trickEffect(shooter, player, this)) { //trickiness check
                        //console.log(player.name + " was tricked!");
                        db.run(`INSERT INTO match_trick_history (match_id, tick, tricker_id, tricked_id, trick_type) `
                            + `VALUES (?, ?, ?, ?, ?)`, [this.match_id, this.gameTicks, shooter.id, player.id, "Score"],
                            function(err) {
                                if (err) {
                                    console.error('Error inserting trick into match_trick_history:', err.message);
                                }
                            }
                        );
                    }
                    else {
                        let defendAmount = (Math.random() * (player.height + player.tempHeight));
                        //console.log(player.name, " temp height: ", player.height,  player.tempHeight)
                        //console.log(player.name, " providided this much defend: ", defendAmount)
                        if(numBlockers > 1) {defendAmount -= defendAmount*numBlockers*this.MULTIPLE_BLOCKER_REDUCTION}

                        if(defendAmount > shooting+this.SHOOTING_BONUS) { //block
                            blocker_ids.push(player.id);
                        }
                        if(!blitz) {
                            defendAmount /= Math.max(numShooters,1); //defenders split defense among all the shooters
                        } 
                        //console.log("Defend amount: " + defendAmount);
                        shooting -= defendAmount; 
                    }
                }
            }
            //console.log("Shooting after defenders: " + shooting);
            score = shooter.quirk.scoreEffect(shooter, this, shooting, range, this.SHOOTING_BONUS);
        }
        let suspense = Math.floor(Math.random() * 3);
        if(blitz) {
            suspense -= 2;
        }
        if(Math.abs(this.offenseTeam.score-this.defenseTeam) < 3) {
            suspense += 1;
        }
        if(this.gameTicks < this.GAME_LENGTH/2) {
            suspense -= 1;
        }
        if(Math.abs(this.offenseTeam.score-this.defenseTeam.score) > 5) {
            suspense -= 1;
        }
        if(this.gameTicks > this.GAME_LENGTH - 10 && this.offenseTeam.score <= this.defenseTeam.score && this.defenseTeam.score - this.offenseTeam.score < 3) {
            suspense += 2;
            //console.log("Game winning shot")
        }
        if(suspense < 0) {suspense = 0;}
        let blocker_id = null;
        if(blocker_ids.length > 0) {
            blocker_id = blocker_ids[Math.floor(Math.random()*blocker_ids.length)]
        }
        db.run(`INSERT INTO scoring_history (match_id, tick, shooter_id, successful_score, team_id, range, suspense, blitzer_id, blocker_id, points_worth) `
            + `VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [this.match_id, this.gameTicks, shooter.id, score, this.offenseTeam.teamId, range, suspense, 
                this.blitzerId, blocker_id, blitz==false ? 2 : 1],
            function(err) {
                if (err) {
                    console.error('Error inserting score into scoring_history:', err.message);
                }
            });
        if(score) {
            //console.log(this.offenseTeam.teamName + " scored!\n");
            this.offenseTeam.score += blitz ? 1 : 2;
            //console.log(this.offenseTeam.teamName + " " + this.offenseTeam.score + " - " + this.defenseTeam.score + " " + this.defenseTeam.teamName)
            if(!blitz) {
                this.position = this.FIELD_LENGTH / 2;
            }
        }
        else {
            shooter.range -= 7; //shooter will get closer next time
            //console.log("Shot missed!\n");
        }
        if(!blitz) {
            //console.log("Field goal")
            this.turnover();
            if(!score) { //missed shot gives 3 turnover free ticks
                this.last_turned_over = 3;
            }
        }
    }

    savePlayerAdvancement(netAdvance) {
        // Loop through offense team players with offensePriority of "Advance"
        let totalAdvance = 0;
        for (const player of this.offenseTeam.players) {
            if (player.offensePriority === "Advance") {
                totalAdvance += player.advance;
            }
        }

        if(totalAdvance > 0) {
            // Divide the netAdvance proportionally by their advance
            for (const player of this.offenseTeam.players) {
                if (player.offensePriority === "Advance") {
                    player.advance = (player.advance / totalAdvance) * netAdvance;
                    const self = this;
                    db.run(`INSERT INTO advancement_history (tick, match_id, player_id, advancement, type) ` 
                        + `VALUES (?, ?, ?, ?, ?)`, [self.gameTicks, self.match_id, player.id, player.advance, "Advance"],
                        function(err) {
                            if (err) {
                                console.error("Tick: ", self.gameTicks, "Match_id: ", self.match_id, "Player_id: ", player.id, "Advancement: ", player.advance, "Type: ", "Advance");
                                console.error('Error inserting advancement into advancement_history:', err.message);
                                
                            }
                        }
                    );
                }
            }
        }
    }

    savePlayerDefend(defendAmount) {
        const self = this;
        // Loop through defense team players with defensePriority of "Defend_Advance"
        let totalDefend = 0;
        for (const player of this.defenseTeam.players) {
            if (player.defensePriority === "Defend_Advance") {
                totalDefend += player.defendAmount;
            }
        }

        if(totalDefend > 0) {
            // Divide the defendAmount proportionally by their defense
            for (const player of this.defenseTeam.players) {
                if (player.defensePriority === "Defend_Advance") {
                    player.defendAmount = (player.defendAmount / totalDefend) * defendAmount;
                    db.run(`INSERT INTO advancement_history (tick, match_id, player_id, advancement, type) ` 
                        + `VALUES (?, ?, ?, ?, ?)`, [self.gameTicks, self.match_id, player.id, player.defendAmount, "Defend"],
                        function(err) {
                            if (err) {
                                //console.log(self.gameTicks, self.match_id, player.id, player.defendAmount)
                                console.error('Error inserting defend into advancement_history:', err.message);
                            }
                        }
                    );
                }
            }
        }
    }
}

export { Match };