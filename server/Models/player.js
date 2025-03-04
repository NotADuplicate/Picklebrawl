import {db} from '../database.js';
import * as quirks from './Quirks/index.js';
import {QuirkGenerator} from '../quirkGenerator.js';
import { NameGenerator } from './nameGenerator.js';

class Player {
    name;
    id;
    quirkId;
    team;
    power;
    range = 0;

    bulk = 1;
    finesse = 1;
    height = 1;
    strength = 1;
    trickiness = 0; //trickiness is defaulted a little lower
    focus = 1;

    baseBulk = 1;
    baseFinesse = 1;
    baseHeight = 1;
    baseStrength = 1;
    baseTrickiness = 1;
    baseFocus = 1;

    offensePriority = "";
    defensePriority = "";
    offensePriorityTarget = null;
    defensePriorityTarget = null;

    savedOffensePriority = "";
    savedDefensePriority = "";
    savedOffensePriorityTarget = null;
    savedDefensePriorityTarget = null;

    offenseProperty = "Default";
    defenseProperty = "Default";

    tempBulk = 0;
    tempFinesse = 0;
    tempHeight = 0;
    tempStrength = 0;
    tempTrickiness = 0; //im not sure how tricky/focus interacts with being assisted
    tempFocus = 0;
    protectBulk = 0;

    tempInjury = 0;
    injury = false;
    quirk = null;

    hp = 100;
    maxHp = 100;
    health = 0;
    ATTACK_MODIFIER = 1;
    advance = 0;
    assisters = 0;
    lastShotTick = -5;
    knockedOut = false;
    breakAwayChance = 0.04;

    PLAYER_ASSIST_MODIFIER = 0.75;
    PLAYER_SHOOTING_BONUS = 0;

    constructor() {
        this.name = this.generateName();
    }

    setStats(bulk, finesse, height, strength, trickiness, focus, quirkId) {
        this.bulk = bulk;
        this.finesse = finesse;
        this.height = height;
        this.strength = strength;
        this.trickiness = trickiness;
        this.focus = focus;
        this.baseBulk = bulk;
        this.baseFinesse = finesse;
        this.baseHeight = height;
        this.baseStrength = strength
        this.baseTrickiness = trickiness;
        this.baseFocus = focus;

        this.quirkId = quirkId;
        this.quirk = QuirkGenerator.idToQuirkMap[this.quirkId];
        console.log("Set stats of player ", this.name);
    }

    get name() {
        return this.name;
    }

    set id(id) {
        this.id = id;
    }

    setPriorities(offense, defense, offenseTarget = null, defenseTarget = null, offenseProperty = null, defenseProperty = null) {
        console.log(offense + " " + offenseTarget); 
        this.offensePriority = offense;
        this.defensePriority = defense;
        this.offensePriorityTarget = offenseTarget;
        this.defensePriorityTarget = defenseTarget;
        this.savedOffensePriority = offense;
        this.savedDefensePriority = defense;
        if(offenseProperty != null) {
            this.offenseProperty = offenseProperty;
        }
        if(defenseProperty != null) {
            this.defenseProperty = defenseProperty;
        }
    }

    save(callback, otherId, draft) {
        let query;
        if(draft) {
            query = `INSERT INTO players (draft_id, name, bulk, finesse, height, strength, trickiness, focus, quirk, power) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        } else {
            query = `INSERT INTO players (team_id, name, bulk, finesse, height, strength, trickiness, focus, quirk, power) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        }
        db.run(query, 
            [otherId, this.name, this.bulk, this.finesse, this.height, this.strength, this.trickiness, this.focus, this.quirkId, this.power], function(err) {
            if (err) {
                console.log("Error saving player: " + err);
                return callback(err);
            }
            callback(null);
        });
    }

    pickRandomQuirk(draft = false) {
        /*const quirkKeys = Object.keys(quirks);
        const selectedQuirkKey = QuirkGenerator.pickRandomQuirk(draft);
        const quirkClass = quirks[selectedQuirkKey];
        this.quirkId = quirkKeys.indexOf(selectedQuirkKey);
        this.quirk = quirkClass;*/
        this.quirkId = QuirkGenerator.pickRandomQuirk(draft);
        this.quirk = QuirkGenerator.idToQuirkMap[this.quirkId]
        console.log(this.name, " Pikced random quirk: ", this.quirkId, this.quirk.title)
        this.quirk.nameGenerationChanges(this);
    }

    pickSetQuirk(quirkClass) {
        const quirkKeys = Object.keys(quirks);
        const selectedQuirkKey = quirkClass;
        this.quirkId = quirkKeys.indexOf(selectedQuirkKey);
        this.quirk = quirks[selectedQuirkKey];
        console.log("Picked quirk: ", quirkClass.title);
        this.quirk.nameGenerationChanges(this);
    }

    randomize_stats(power) {
        this.power = power;
        power += this.quirk.POWER_MODIFIER;
        console.log("Quirk: ", this.quirkId, this.quirk.title)
        console.log(this.name, " setting points ", power, " quirk modifier of: ", this.quirk.POWER_MODIFIER)

        const stats = [this.bulk, this.finesse, this.height, this.strength, this.trickiness, this.focus];

        for (let i = 0; i < power; i++) {
            const ran = Math.floor(Math.random()*(stats.length-1))
            stats[ran] += 1;
        }

        const extraStats = stats[4]; //trickiness and focus should split points between them
        stats[4] = 0;
        for(let i = 0; i < extraStats; i++) {
            stats[4+Math.floor(Math.random()*2)] += 1;
        }

        [this.bulk, this.finesse, this.height, this.strength, this.trickiness, this.focus] = stats;
        const totalStats = this.bulk + this.finesse + this.height + this.strength + this.trickiness + this.focus;
        console.log("Total stats: ", totalStats-5)
        if(totalStats-5 > power) {
            console.log(this.name, " IS UNFAIRLY GOOD! \n")
        }
        else if(totalStats-5 < power) {
            console.log(this.name, " IS UNFAIRLY BAD! \n")
        }

        this.quirk.playerStatGenerationChanges(this, power);
    }

    generateName() {
        let name;
        const sample = arr => arr[Math.floor(Math.random() * arr.length)];
        if(Math.random() < 0.6) { name = NameGenerator.generate(); }
        else { name = NameGenerator.zacNameGeneration(); }
        let lastName = sample([
            'Smith', 'Johnson', 'Williams', 'Jones', 'Brown', 'Jones', 'Garcia',
            'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez',
            'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore',
            'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris',
            'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young',
            'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill',
            'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera',
            'Campbell', 'Mitchell', 'Carter', 'Roberts', 'Gomez', 'Phillips',
            'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz', 'Edwards', 'Collins',
            'Reyes', 'Stewart', 'Morris', 'Morales', 'Murphy', 'Cook', 'Rogers',
            'Gutierrez', 'Ortiz', 'Morgan', 'Cooper', 'Peterson', 'Bailey', 'Reed',
            'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson',
            'Watson', 'Brooks', 'Chavez', 'Wood', 'James', 'Bennett', 'Gray',
            'Mendoza', 'Ruiz', 'Hughes', 'Price', 'Alvarez', 'Castillo', 'Sanders',
            'Patel', 'Myers', 'Long', 'Ross', 'Foster', 'Jimenez', 'Arleth', 'Everhart',
            'Wohl', 'Baker', 'Lane', 'Henderson', 'Cole', 'Funte', 'Paul-Healy', 'Greene',
            'Philips', 'King', 'Jr', 'Pickle', 'Jordan', 'Diaz',
            'Swift', 'Rodrigo', 'Parker', 'Sprow', 'Cox', '', 'Kennedy', 'Charles', 'Zac', 'Pup',
            'Lebron', 'James', 'Usmanov', 'Nipp', 'Polio', 'Nixon', 'Obama', 'Biden', 'Usmanov'
        ]);
        if(name.length > 2 && name.length < 7 && Math.random() < 0.05) {
            lastName = name;
        }
        else if(name.length >= 7 && Math.random() < 0.1) {
            lastName = '';
        }
        name = name + ' ' + lastName;
        return name;
    }

    attack(match, target) {
        if(this.quirk.attackEffect(this, target, match) == null) { //if its not null then use the quirk attack effect
            const damage = Math.random() * (this.strength + this.tempStrength)*3/4;
            const defense = Math.random() * (target.bulk + target.protectBulk);
            const finalDamage = (damage - defense)+0.25;
            if (finalDamage < 0) {
                return;
            }
            target.tempInjury += finalDamage;

            const hpDamage = target.quirk.DAMAGE_TAKEN_MODIFIER*2*(Math.random(0,finalDamage)*this.ATTACK_MODIFIER) + 1.5;
            db.run(`INSERT INTO attack_history (match_id, tick, attacking_player_id, attacked_player_id, `
                + `damage_done, permanent_injury, percent_health_done) VALUES (?, ?, ?, ?, ?, ?, ?)`, [match.match_id, match.gameTicks,
                this.id, target.id, hpDamage, false, 100*hpDamage/target.maxHp], function(err) {
                    if (err) {
                        console.error('Error inserting attack into attack_history:', err.message);
                    }
            });
            target.hp = Math.max(0,target.hp-hpDamage);
            if(target.hp == 0) {
                target.knockout(match);
            }
        }
    }

    assist(target, modifier) {
        if(!target) {
            console.log(this.name, " is assisting null");
        }
        target.tempBulk += modifier * this.PLAYER_ASSIST_MODIFIER * (this.bulk + this.finesse) / 2;
        target.tempFinesse += modifier * this.PLAYER_ASSIST_MODIFIER * this.finesse;
        target.tempHeight += modifier * this.PLAYER_ASSIST_MODIFIER * (this.height + this.finesse) / 2;
        target.tempStrength += modifier * this.PLAYER_ASSIST_MODIFIER * (this.strength + this.finesse) / 2;
        target.tempBulk = Math.min(this.bulk, target.tempBulk);
        target.tempFinesse = Math.min(this.finesse, target.tempFinesse);
        target.tempHeight = Math.min(this.height, target.tempHeight);
        target.tempStrength = Math.min(this.strength, target.tempStrength);

        //I think trickiness and focus should work differently since they are discrete stats where that its more important to understand the specific number
        target.tempTrickiness = Math.min(this.trickiness, target.tempTrickiness); //assisting should be bad for trickiness otherwise assisting scorers is really strong
        target.tempFocus = Math.max(this.focus, target.tempFocus); 
    }

    knockout(match) {
        console.log("KNOCKED OUT")
        this.knockedOut = true;
        // Remove player from match players list
        const playerIndex = match.players.indexOf(this);
        if (playerIndex > -1) {
            match.players.splice(playerIndex, 1);
        }

        // Remove player from offense team if present
        const offenseIndex = match.offenseTeam.players.indexOf(this);
        if (offenseIndex > -1) {
            match.offenseTeam.players.splice(offenseIndex, 1);
        }

        // Remove player from defense team if present
        const defenseIndex = match.defenseTeam.players.indexOf(this);
        if (defenseIndex > -1) {
            match.defenseTeam.players.splice(defenseIndex, 1);
        }

        // Check if any team is empty and end the game if so
        if (match.offenseTeam.players.length === 0) {
            match.offenseTeam.full_dead = true;
        }
        else if (match.defenseTeam.players.length === 0) {
            match.defenseTeam.full_dead = true;
        }
    }

    protect(target) {
        target.protectBulk += this.height*0.8;
    }

    load(id) {
        console.log("Loading player")
        this.id = id;
        const self = this;
        return new Promise((resolve, reject) => {
            db.get(`SELECT * FROM players WHERE id = ?`, [id], (err, row) => {
                if (err) {
                    console.log("Error loading player: " + err);
                    return reject(err);
                }
                if (row) {
                    self.hp = Math.floor(row.health);
                    this.name = row.name;
                    this.team = row.team_id;
                    this.setStats(row.bulk, row.finesse, row.height, row.strength, row.trickiness, row.focus, row.quirk);
                    resolve(this); // Resolve with the player instance
                } else {
                    // Handle case where no player is found
                    console.log(`No player found with id: ${id}`);
                    resolve(null); // Or reject with an error if preferred
                }
            });
        });
    }

    reset_stats(id) {
        db.get(`SELECT * FROM players WHERE id = ?`, [id], (err, row) => {
            if(err) {
                console.log("Error resetting stats for player ", id, " :", err)
            }
            this.name = row.name
            console.log(this.name)
            this.quirkId = row.quirk;
            this.quirk = QuirkGenerator.idToQuirkMap[this.quirkId];
            console.log(this.quirkId, this.quirk)
            console.log("Quirk id: ", this.quirkId, " quirk: ", this.quirk.title)
            this.randomize_stats(row.power);
            db.run(`UPDATE players SET finesse = ?, height = ?, strength = ?, bulk = ?, trickiness = ?, focus = ?
                WHERE id = ?`, [this.finesse, this.height, this.strength, this.bulk, this.trickiness, this.focus, id])
            });
    }
}

export {Player};