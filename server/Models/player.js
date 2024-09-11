import {db} from '../database.js';

class Player {
    name;
    id;

    bulk = 1;
    agility = 1;
    height = 1;
    strength = 1;

    baseBulk = 1;
    baseAgility = 1;
    baseHeight = 1;
    baseStrength = 1;

    offensePriority = "";
    defensePriority = "";
    offensePriorityTarget = null;
    defensePriorityTarget = null;

    tempBulk = 0;
    tempAgility = 0;
    tempHeight = 0;
    tempStrength = 0;
    protectBulk = 0;

    tempInjury = 0;
    injury = false;

    constructor() {
        this.name = this.generateName();
    }

    setStats(bulk, agility, height, strength) {
        this.bulk = bulk;
        this.agility = agility;
        this.height = height;
        this.strength = strength;
        this.baseBulk = bulk;
        this.baseAgility = agility;
        this.baseHeight = height;
        this.baseStrength = strength;
    }

    get name() {
        return this.name;
    }

    set id(id) {
        this.id = id;
    }

    setPriorities(offense, defense, offenseTarget = null, defenseTarget = null)  {
        console.log(offense + " " + offenseTarget); 
        if (["Attack", "Advance", "Protect", "Assist", "Score"].includes(offense)) {
            this.offensePriority = offense;
        }
        else {
            console.log(offense);
            throw new Error("Invalid offense priority");
        }
        if (["Attack", "Defend Advance", "Protect", "Assist", "Defend Score"].includes(defense)) {
            this.defensePriority = defense;
        }
        else {
            console.log(defense);
            throw new Error("Invalid defense priority");
        }
        this.offensePriorityTarget = offenseTarget;
        this.defensePriorityTarget = defenseTarget;
    }

    save(callback, teamId) {
        const self = this;
        db.run(`INSERT INTO players (team_id, name, bulk, agility, height, strength) VALUES (?, ?, ?, ?, ?, ?)`, 
            [teamId, this.name, this.bulk, this.agility, this.height, this.strength], function(err) {
            if (err) {
                console.log("Error saving player: " + err);
                return cb(err);
            }
            callback(null);
        });
    }

    randomize_stats(power) {
        //return; // Disable randomization for now
        const totalPoints = power;
        const minPoints = 1;
        const maxPoints = Math.floor(totalPoints / 5);

        const stats = [this.bulk, this.agility, this.height, this.strength];

        for (let i = 0; i < power; i++) {
            stats[Math.floor(Math.random()*stats.length)] += 1;
        }
        [this.bulk, this.agility, this.height, this.strength] = stats;
        //console.log(this.bulk, this.scoring, this.height, this.offense);
    }

    generateName() {
        const sample = arr => arr[Math.floor(Math.random() * arr.length)];
        let name = [];
        if (Math.floor(Math.random() * 3) !== 1) {
            if (name.length === 0) {
                if (Math.floor(Math.random() * 2) === 1) {
                    name.push(sample('WWRRRTTYPPPPSSSDDDDDFFGGHJJJJJKLLZZXCVBBBBNNMMM'));
                } else {
                    name.push(sample('WTPPPPSDFFGGKZZCCCVBBBB'));
                    if (name[0] === 'W') {
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
        //return "John Doe";
    }

    attack(target, INJURY_PERMANENCE_MODIFIER) {
        console.log(this.name + " is attacking " + target.name); 
        const damage = Math.floor(Math.random() * (this.strength + this.tempStrength));
        const defense = Math.floor(Math.random() * (target.bulk + target.protectBulk));
        const finalDamage = damage - defense;
        if (finalDamage < 0) {
            console.log(target.name + " defended the attack");
            return;
        }
        console.log(this.name + " dealt " + finalDamage + " damage to " + target.name);
        target.tempInjury += finalDamage;
        // TODO: implement permanent injury, using INJURY_PERMANENCE_MODIFIER
        /*if(Math.random() < finalDamage*0.1) {
            console.log(target.name + " is injured");
            target.injury = true;
        }*/
    }

    assist(target) {
        target.tempBulk += (this.bulk + this.agility) / 2;
        target.tempAgility += this.agility;
        target.tempHeight += (this.height + this.agility) / 2;
        target.tempStrength += (this.strength + this.agility) / 2;
    }

    protect(target) {
        target.protectBulk += this.height*0.8;
    }
}

export {Player};