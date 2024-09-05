import express from 'express';
import fs from 'fs';
import path from 'path';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';
import { db } from './database.js';
import { Team } from './Models/team.js';

const app = express();
const PORT = 3000;

// Convert import.meta.url to __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(bodyParser.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// Serve login.html as the default page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/login/login.html'));
});

// Endpoint to create an account
app.post('/create-account', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required!' });
    }

    db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, [username, password], function(err) {
        if (err) {
            console.error('Error inserting user:', err.message);
            return res.status(400).json({ message: 'Username already exists!' });
        }
        res.json({ message: 'Account created successfully!' });
    });
});

// Endpoint to log in
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required!' });
    }

    db.get(`SELECT * FROM users WHERE username = ? AND password = ?`, [username, password], (err, row) => {
        if (err) {
            console.error('Error querying user:', err.message);
            return res.status(500).json({ message: 'Internal server error!' });
        }
        if (!row) {
            return res.status(400).json({ message: 'Invalid username or password!' });
        }
        res.json({ message: 'Login successful!' });
    });
});

const insertTeam = (teamName, leagueId, owner, callback) => {
    console.log('Inserting team:', teamName, leagueId, owner);
    const team = new Team(teamName, owner, leagueId);
    team.save(callback);
};

app.post('/create-league', (req, res) => {
    const { leagueName, leaguePassword, username, teamName } = req.body;
    console.log('Creating league:', leagueName, leaguePassword, username, teamName);

    db.run(`INSERT INTO leagues (name, password, founder, started) VALUES (?, ?, ?, ?)`, [leagueName, leaguePassword, username, false], function(err) {
        if (err) {
            return res.status(400).json({ message: 'Error creating league!' });
        }
        const leagueId = this.lastID; 
        db.run(`INSERT INTO league_users (league_id, username) VALUES (?, ?)`, [leagueId, username], (err) => {
            if (err) {
                return res.status(400).json({ message: 'Error joining league!' });
            }
            console.log('League ID:', leagueId);

            insertTeam(teamName, leagueId, username, (err) => {
                if (err) {
                    return res.status(400).json({ message: 'Error creating team!' });
                }
                res.json({ message: 'League and team created successfully!' });
            });
        });
    });
});

app.post('/join-league', (req, res) => {
    const { leagueName, leaguePassword, username, teamName } = req.body;

    db.get(`SELECT * FROM leagues WHERE name = ?`, [leagueName], (err, league) => {
        if (err || !league) {
            return res.status(400).json({ message: 'League does not exist!' });
        }

        if (league.password !== leaguePassword) {
            return res.status(400).json({ message: 'Incorrect league password!' });
        }

        db.run(`INSERT INTO league_users (league_id, username) VALUES (?, ?)`, [league.id, username], (err) => {
            if (err) {
                return res.status(400).json({ message: 'Error joining league!' });
            }

            insertTeam(teamName, league.id, username, (err) => {
                if (err) {
                    return res.status(400).json({ message: 'Error creating team!' });
                }
                res.json({ message: 'Joined league and created team successfully!' });
            });
        });
    });
});

app.get('/leagues', (req, res) => {
    const { user, leagueName } = req.query;
    let query = `
        SELECT leagues.id, leagues.name AS leagueName, leagues.founder, leagues.started, 
               GROUP_CONCAT(league_users.username) AS players
        FROM leagues
        LEFT JOIN league_users ON leagues.id = league_users.league_id
    `;
    let params = [];

    if (user) {
        query += ' WHERE league_users.username = ?';
        params.push(user);
    }

    if (leagueName) {
        query += user ? ' AND leagues.name = ?' : ' WHERE leagues.name = ?';
        params.push(leagueName);
    }

    query += ' GROUP BY leagues.id';

    console.log("Getting leagues with query:", query, "params:", params);

    db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Error fetching leagues!' });
        }
        // Transform the players from a comma-separated string to an array
        const leagues = rows.map(row => ({
            ...row,
            players: row.players ? row.players.split(',') : []
        }));
        res.json(leagues);
    });
});

app.post('/start-league', (req, res) => {
    const { leagueName, username } = req.body;
    db.get(`SELECT * FROM leagues WHERE name = ?`, [leagueName], (err, league) => {
        if (err || !league) {
            return res.status(400).json({ message: 'League does not exist!' });
        }

        if (league.founder !== username) {
            return res.status(400).json({ message: 'Only the founder can start the league!' });
        }

        db.run(`UPDATE leagues SET started = ? WHERE id = ?`, [true, league.id], (err) => {
            if (err) {
                return res.status(400).json({ message: 'Error starting league!' });
            }
            res.json({ message: 'League started successfully!' });
        });
    });
});

// Endpoint to fetch teams by league ID
app.get('/teams', (req, res) => {
    console.log("Getting teams");
    const leagueId = req.query.leagueId;
    db.all(`SELECT * FROM teams WHERE league_id = ?`, [leagueId], (err, teams) => {
        if (err) {
            return res.status(500).json({ message: 'Error fetching teams!' });
        }
        res.json(teams);
    });
});

app.get('/teams/:teamId', (req, res) => {
    const teamId = req.params.teamId;
    db.get(`SELECT * FROM teams WHERE id = ?`, [teamId], (err, team) => {
        if (err) {
            return res.status(500).json({ message: 'Error fetching team!' });
        }
        res.json(team);
    });
});

app.get('/teams/:teamId/players', (req, res) => {
    console.log("Getting players");
    const teamId = req.params.teamId;
    db.all(`SELECT * FROM players WHERE team_id = ?`, [teamId], (err, players) => {
        if (err) {
            console.log("Error fetching players:", err);
            return res.status(500).json({ message: 'Error fetching players!' });
        }
        res.json(players);
    });
});

// Fetch all challenges
app.get('/challenges', (req, res) => {
    console.log('Getting challenges');
    const team_id = req.query.teamId;
    if (!team_id) {
        return res.status(400).json({ error: 'team_id query parameter is required' });
    }

    db.all(
        'SELECT * FROM challenges WHERE (challenger_team_id = ? OR challenged_team_id = ?) AND status = ?',
        [team_id, team_id, 'pending'],
        (err, rows) => {
            if (err) {
                console.error(err);
                res.status(500).json({ error: 'Internal server error' });
            } else {
                console.log('Challenges:', rows);
                res.json(rows);
            }
        }
    );
});

// Create a new challenge
app.post('/challenges', (req, res) => {
    const { teamId, myTeamId } = req.body;
    console.log('Creating challenge: ', myTeamId, teamId);
    db.run(
        'INSERT INTO challenges (challenger_team_id, challenged_team_id) VALUES (?, ?)',
        [myTeamId, teamId],
        function (err) {
            if (err) {
                console.error(err);
                res.status(500).json({ error: 'Internal server error' });
            } else {
                res.status(201).json({ id: this.lastID });
            }
        }
    );
});

// Accept a challenge
app.post('/challenges/:id/accept', (req, res) => {
    const { id } = req.params;
    db.run(
        'UPDATE challenges SET status = ? WHERE id = ?',
        ['accepted', id],
        function (err) {
            if (err) {
                console.error(err);
                res.status(500).json({ error: 'Internal server error' });
            } else {
                res.json({ id });
            }
        }
    );
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});