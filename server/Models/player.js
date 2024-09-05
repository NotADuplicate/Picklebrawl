import {db} from '../database.js';

class Player {
    name;
    id;
    bulk = 1;
    scoring = 1;
    assist = 1;
    offense = 1;
    medicine = 1;

    constructor() {
        this.name = this.generateName();
    }

    get name() {
        return this.name;
    }

    set id(id) {
        this.id = id;
    }

    save(callback, teamId) {
        const self = this;
        db.run(`INSERT INTO players (team_id, name, bulk, scoring, assist, offense, medicine) VALUES (?, ?, ?, ?, ?, ?, ?)`, 
            [teamId, this.name, this.bulk, this.scoring, this.assist, this.offense, this.medicine], function(err) {
            if (err) {
                console.log("Error saving player: " + err);
                return cb(err);
            }
            self.id = this.lastID;
            callback(null);
        });
    }

    randomize_stats(power) {
        const totalPoints = power;
        const minPoints = 1;
        const maxPoints = Math.floor(totalPoints / 5);

        const stats = [this.bulk, this.scoring, this.assist, this.offense, this.medicine];

        for (let i = 0; i < power; i++) {
            stats[Math.floor(Math.random()*stats.length)] += 1;
        }
        [this.bulk, this.scoring, this.assist, this.offense, this.medicine] = stats;
        console.log(this.bulk, this.scoring, this.assist, this.offense, this.medicine);
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
            'Lebron', 'James', 'Usmanov', 'Nipp', 'Polio', 'Nixon', 'Obama', 'Biden'
        ]);
        return name;
        //return "John Doe";
    }
}

export {Player};