import { Team } from '../Models/team.js';
import express from 'express';
import { db } from '../database.js';
import { Draft } from '../Models/draft.js';

const router = express.Router();

console.log('Loading leagues routes');

const insertTeam = (teamName, leagueId, owner, callback) => {
    console.log('Inserting team:', teamName, leagueId, owner);
    const team = new Team();
    team.setInfo(teamName, owner, leagueId);
    team.save(callback);
};

router.post('/create-league', (req, res) => {
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

router.post('/join-league', (req, res) => {
    const { leagueName, leaguePassword, username, teamName } = req.body;

    db.get(`SELECT * FROM leagues WHERE name = ?`, [leagueName], (err, league) => {
        if (err || !league) {
            return res.status(400).json({ message: 'League does not exist!' });
        }

        if (league.password !== leaguePassword) {
            return res.status(400).json({ message: 'Incorrect league password!' });
        }


        insertTeam(teamName, league.id, username, (err) => {
            if (err) {
                console.log("Error creating team: ", err)
                return res.status(400).json({ message: 'Error creating team!' });
            }
            db.run(`INSERT INTO league_users (league_id, username) VALUES (?, ?)`, [league.id, username], (err) => {
                if (err) {
                    console.log(err);
                    return res.status(400).json({ message: 'Error joining league!' });
                }
                res.json({ message: 'Joined league and created team successfully!' });
            });
        });
    });
});

router.get('/leagues', (req, res) => {
    const { user, leagueName } = req.query;
    console.log("Getting leagues with user:", user);
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

router.post('/start-league', (req, res) => {
    console.log("Starting league")
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
        const draft = new Draft(league.id);
    });
});

router.get('/matches', (req, res) => {
    console.log("Getting matches for league id:", req.query.leagueId);
    const { leagueId } = req.query;
    let query = `
        SELECT 
            DISTINCT match_history.id, 
            created_at, 
            home_team.name AS home_team_name, 
            away_team.name AS away_team_name, 
            home_team_score, 
            away_team_score,
            (strftime('%s', 'now') - strftime('%s', created_at)) > 101 AS is_over,
            SUM(CASE WHEN scoring_history.team_id = home_team_id THEN scoring_history.successful_score * (CASE WHEN blitzer_id IS NULL THEN 2 ELSE 1 END) ELSE 0 END) AS home_team_live_score,
            SUM(CASE WHEN scoring_history.team_id = away_team_id THEN scoring_history.successful_score * (CASE WHEN blitzer_id IS NULL THEN 2 ELSE 1 END) ELSE 0 END) AS away_team_live_score
        FROM 
            match_history
        JOIN 
            teams AS home_team ON home_team_id = home_team.id
        JOIN 
            teams AS away_team ON away_team_id = away_team.id
        LEFT JOIN
            scoring_history ON match_history.id = scoring_history.match_id AND scoring_history.tick*2 < (strftime('%s', 'now') - strftime('%s', created_at))
        WHERE 
            match_history.league_id = ${leagueId}
        GROUP BY 
            match_history.id
        ORDER BY
            created_at DESC
    `;

    db.all(query, (err, matches) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ message: 'Error fetching matches!' });
        }
        res.json(matches);
    });
});

router.get('/league/drafts', (req, res) => {
    const { leagueId } = req.query;
    console.log("Checking for active draft in league id:", leagueId);

    db.get(`SELECT * FROM drafts WHERE league_id = ? AND active = 1`, [leagueId], (err, draft) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ message: 'Error checking for active draft!' });
        }

        if (!draft) {
            return res.status(404).json({ message: 'No active draft found for this league!' });
        }

        res.json(draft);
    });
});

export default router;