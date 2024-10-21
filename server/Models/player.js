import {db} from '../database.js';
import * as quirks from './Quirks/index.js';
import {QuirkGenerator} from '../quirkGenerator.js';

class Player {
    name;
    id;
    quirkId;
    team;

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

    hp;
    maxHp;
    ATTACK_MODIFIER = 1;
    advance;

    PLAYER_ASSIST_MODIFIER = 0.75;

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
        const quirkKeys = Object.keys(quirks);
        const quirkClass = quirks[quirkKeys[quirkId]];
        this.quirk = quirkClass;
        console.log("Set stats of player ", this.name);
    }

    setHp() {
        this.maxHp = 100;
        this.hp = 100;
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

    save(callback, teamId) {
        const self = this;
        db.run(`INSERT INTO players (team_id, name, bulk, finesse, height, strength, trickiness, focus, quirk) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
            [teamId, this.name, this.bulk, this.finesse, this.height, this.strength, this.trickiness, this.focus, this.quirkId], function(err) {
            if (err) {
                console.log("Error saving player: " + err);
                return callback(err);
            }
            callback(null);
        });
    }

    pickRandomQuirk(draft = false) {
        const quirkKeys = Object.keys(quirks);

        const selectedQuirkKey = QuirkGenerator.pickRandomQuirk(draft);
    
        const quirkClass = quirks[selectedQuirkKey];
        this.quirkId = quirkKeys.indexOf(selectedQuirkKey);
        this.quirk = quirkClass;
        console.log("Picked quirk: ", quirkClass.title);
        this.quirk.nameGenerationChanges(this);
    }

    randomize_stats(power) {
        power += this.quirk.POWER_MODIFIER;
        //return; // Disable randomization for now
        const totalPoints = power + this.quirk.POWER_MODIFIER;

        const stats = [this.bulk, this.finesse, this.height, this.strength, this.trickiness, this.focus];

        for (let i = 0; i < power; i++) {
            stats[Math.floor(Math.random()*stats.length-1)] += 1;
        }

        const extraStats = stats[4]; //trickiness and focus should split points between them
        stats[4] = 0;
        for(let i = 0; i < extraStats; i++) {
            stats[4+Math.floor(Math.random()*2)] += 1;
        }

        [this.bulk, this.finesse, this.height, this.strength, this.trickiness, this.focus] = stats;
        this.quirk.playerStatGenerationChanges(this, power);
    }

    generateName() {
        const sample = arr => arr[Math.floor(Math.random() * arr.length)];
        let name = [];
        if (Math.floor(Math.random() * 3) !== 1) {
            if (name.length === 0) {
                if (Math.floor(Math.random() * 2) === 1) {
                    name.push(sample([
                        'W', 'W', 'R', 'R', 'R', 'T', 'T', 'Y', 'P', 'P', 'P', 'P', 'S', 'S', 'S', 'D',
                        'D', 'D', 'D', 'D', 'F', 'F', 'G', 'G', 'H', 'J', 'J', 'J', 'J', 'J', 'K', 'L',
                        'L', 'Z', 'Z', 'X', 'C', 'V', 'B', 'B', 'B', 'B', 'N', 'N', 'M', 'M', 'M', 'M', 'Qu']));
                } else {
                    name.push(sample('WTPPPPSDFFGGKZZCCCVBBBB'));
                    if (['W', 'Z'].includes(name[0])) {
                        name.push(sample('rh'));
                    } else if (['T', 'P', 'C', 'B'].includes(name[0])) {
                        name.push(sample('rhl'));
                    } else {
                        name.push(sample('rrl'));
                    }
                }
            }
        }
        if (name.length === 0) {
            name.push(sample([
                'A', 'A', 'A', 'A', 'A', 'E', 'E', 'E', 'I', 'I', 'I', 'O', 'O', 'O',
                'U', 'U', 'U', 'Y', 'Ea', 'Ea', 'Ou', 'Io', 'S', 'S', 'S', 'Oi', 'Au'
            ]));
        } else {
            name.push(sample([
                'a', 'a', 'a', 'a', 'a', 'e', 'e', 'e', 'i', 'i', 'i', 'o', 'o', 'o',
                'u', 'u', 'u', 'y', 'ea', 'ea', 'ou', 'io', 'oe'
            ]));
        }
        for (let i = 0; i < sample("000011111112223"); i++) {
            name.push(sample("wrrrtttppppssdddddggfhjjjkllzcvbbbbnnmmm"));
            name.push(sample([
                'a', 'a', 'a', 'a', 'a', 'e', 'e', 'e', 'i', 'i', 'i', 'o',
                'o', 'o', 'u', 'u', 'u', 'y', 'ea', 'ea', 'ou', 'io', 'oe'
            ]));
        }
        name = name.join('') + sample("wrrtttyppsdddfghhkllzxcvbbnnnnmmmm");
        name += ' ' + sample([
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
            'Philips', name, 'King', 'Jr', 'III', 'IV', 'VI', 'VII', 'Pickle', 'Jordan', 'Diaz',
            'Swift', 'Rodrigo', 'Parker', 'Sprow', 'Cox', '', 'Kennedy', 'Charlie', 'Zac', 'Pup',
            'Lebron', 'James', 'Usmanov', 'Nipp', 'Polio', 'Nixon', 'Obama', 'Biden', 'Usmanov'
        ]);
        return name;
    }

    attack(match, target) {
        if(this.quirk.attackEffect(this, target) == null) { //if its not null then use the quirk attack effect
            // TODO: add code in quirk attack effects to add to db
            const damage = Math.random() * (this.strength + this.tempStrength);
            const defense = Math.random() * (target.bulk + target.protectBulk);
            const finalDamage = (damage - defense);
            if (finalDamage < 0) {
                return;
            }
            if(finalDamage > 5) {
                console.log(this.name + " dealt " + finalDamage + " damage to " + target.name);
                console.log("Strength: " + this.strength + " Temp Strength: " + this.tempStrength);
                console.log("Bulk: " + target.bulk + " Protect Bulk: " + target.protectBulk);
            }
            target.tempInjury += finalDamage;

            const hpDamage = 3*(Math.random(0,finalDamage)*this.ATTACK_MODIFIER) + 1.5;
            db.run(`INSERT INTO attack_history (match_id, tick, attacking_player_id, attacked_player_id, `
                + `damage_done, permanent_injury, percent_health_done) VALUES (?, ?, ?, ?, ?, ?, ?)`, [match.match_id, match.gameTicks,
                this.id, target.id, hpDamage, false, 100*hpDamage/target.maxHp], function(err) {
                    if (err) {
                        console.error('Error inserting attack into attack_history:', err.message);
                    }
            });
            target.hp = Math.max(0,target.hp-hpDamage);
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

        //I think trickiness and focus should work differently since they are discrete stats where that its more important to understand the specific number
        target.tempTrickiness = Math.min(this.trickiness, target.tempTrickiness); //assisting should be bad for trickiness otherwise assisting scorers is really strong
        target.tempFocus = Math.max(this.focus, target.tempFocus); 
    }

    protect(target) {
        target.protectBulk += this.height*0.8;
    }

    load(id) {
        this.id = id;
        return new Promise((resolve, reject) => {
            db.get(`SELECT * FROM players WHERE id = ?`, [id], (err, row) => {
                if (err) {
                    console.log("Error loading player: " + err);
                    return reject(err);
                }
                if (row) {
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
}

export {Player};