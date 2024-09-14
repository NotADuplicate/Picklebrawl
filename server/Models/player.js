import {db} from '../database.js';

class Player {
    name;
    id;

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
    baseTrickiness = 0;
    baseFocus = 1;

    offensePriority = "";
    defensePriority = "";
    offensePriorityTarget = null;
    defensePriorityTarget = null;

    tempBulk = 0;
    tempFinesse = 0;
    tempHeight = 0;
    tempStrength = 0;
    tempTrickiness = 0; //im not sure how tricky/focus interacts with being assisted
    tempFocus = 0;
    protectBulk = 0;

    tempInjury = 0;
    injury = false;

    PLAYER_ASSIST_MODIFIER = 0.8;

    constructor() {
        this.name = this.generateName();
    }

    setStats(bulk, finesse, height, strength, trickiness, focus) {
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
        console.log("Saving player : " + this.name);
        db.run(`INSERT INTO players (team_id, name, bulk, finesse, height, strength, trickiness, focus) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
            [teamId, this.name, this.bulk, this.finesse, this.height, this.strength, this.trickiness, this.focus], function(err) {
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

        const stats = [this.bulk, this.finesse, this.height, this.strength, this.trickiness, this.focus];

        for (let i = 0; i < power; i++) {
            stats[Math.floor(Math.random()*stats.length)] += 1;
        }
        [this.bulk, this.finesse, this.height, this.strength, this.trickiness, this.focus] = stats;
        //console.log(this.bulk, this.scoring, this.height, this.offense);
    }

    distribute_stats(power) {
        let totalPoints = power;
        const minPoints = 1;
        const maxPoints = Math.floor(totalPoints / 2);

        const stats = [this.bulk, this.finesse, this.height, this.strength, this.trickiness, this.focus];
        const usedIndexes = [];

        while (usedIndexes.length < stats.length) {
            let index = Math.floor(Math.random() * stats.length);
            while (usedIndexes.includes(index)) {
                index = Math.floor(Math.random() * stats.length);
            }
            usedIndexes.push(index);

            let points = Math.floor(Math.random() * maxPoints) + minPoints;
            if (points > totalPoints) {
                points = totalPoints;
            }
            stats[index] += points;
            totalPoints -= points;
        }
        while (totalPoints > 0) {
            stats[Math.floor(Math.random()*stats.length)] += 1;
            totalPoints -= 1;
        }
        [this.bulk, this.finesse, this.height, this.strength, this.trickiness, this.focus] = stats;
        //console.log(this.bulk, this.scoring, this.height, this.offense);
    }

    generateName() {
        const sample = arr => arr[Math.floor(Math.random() * arr.length)];
        let name = [];
        if (Math.floor(Math.random() * 3) !== 1) {
            if (name.length === 0) {
                if (Math.floor(Math.random() * 2) === 1) {
                    name.push(sample('WWRRRTTYPPPPSSSDDDDDFFGGHJJJJJKLLZZXCVBBBBNNMMMQ'));
                } else {
                    name.push(sample('QWTPPPPSDFFGGKZZCCCVBBBB'));
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

    assist(target, modifier) {
        target.tempBulk += modifier * this.PLAYER_ASSIST_MODIFIER * (this.bulk + this.finesse) / 2;
        target.tempFinesse += modifier * this.PLAYER_ASSIST_MODIFIER * this.finesse;
        target.tempHeight += modifier * this.PLAYER_ASSIST_MODIFIER * (this.height + this.finesse) / 2;
        target.tempStrength += modifier * this.PLAYER_ASSIST_MODIFIER * (this.strength + this.finesse) / 2;

        //I think trickiness and focus should work differently since they are discrete stats where that its more important to understand the specific number
        target.tempTrickiness = min(this.trickiness, target.tempTrickiness); //assisting should be bad for trickiness otherwise assisting scorers is really strong
        target.tempFocus = max(this.focus, target.tempFocus); 
    }

    protect(target) {
        target.protectBulk += this.height*0.8;
    }
}

export {Player};