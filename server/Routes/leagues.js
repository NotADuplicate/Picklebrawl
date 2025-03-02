import { Team } from '../Models/team.js';
import express from 'express';
import { db } from '../database.js';
import { Draft } from '../Models/draft.js';
import { Season } from '../Models/season.js';
import { authenticator } from '../Models/authenticator.js';
import { Player } from '../Models/player.js';

const router = express.Router();

console.log('Loading leagues routes');

const insertTeam = (teamName, leagueId, owner_id, callback) => {
    console.log('Inserting team:', teamName, leagueId, owner_id);
    const team = new Team();
    team.setInfo(teamName, owner_id, leagueId);
    team.save(callback);
};

router.post('/create-league', authenticator.authenticateToken, (req, res) => {
    const { leagueName, leaguePassword, teamName } = req.body;
    console.log('Creating league:', leagueName, leaguePassword, teamName);

    const founderId = req.userId;
    console.log('Founder ID:', founderId);
    db.run(`INSERT INTO leagues (name, password, founder_id, started) VALUES (?, ?, ?, ?)`, [leagueName, leaguePassword, founderId, false], function(err) {
        if (err) {
            return res.status(400).json({ message: 'Error creating league!' });
        }
        const leagueId = this.lastID; 
        db.run(`INSERT INTO league_users (league_id, user_id) VALUES (?, ?)`, [leagueId, founderId], (err) => {
            if (err) {
                return res.status(400).json({ message: 'Error joining league!' });
            }
            console.log('League ID:', leagueId);

            insertTeam(teamName, leagueId, founderId, (err) => {
                if (err) {
                    return res.status(400).json({ message: 'Error creating team!' });
                }
                res.json({ message: 'League and team created successfully!' });
            });
        });
    });
});

router.post('/join-league', authenticator.authenticateToken, (req, res) => {
    const { leagueName, leaguePassword, teamName } = req.body;

    const joinerId = req.userId;
    db.get(`SELECT * FROM leagues WHERE name = ?`, [leagueName], (err, league) => {
        if (err || !league) {
            return res.status(400).json({ message: 'League does not exist!' });
        }

        if (league.password !== leaguePassword) {
            return res.status(400).json({ message: 'Incorrect league password!' });
        }


        insertTeam(teamName, league.id, joinerId, (err) => {
            if (err) {
                console.log("Error creating team: ", err)
                return res.status(400).json({ message: 'Error creating team!' });
            }
            db.run(`INSERT INTO league_users (league_id, user_id) VALUES (?, ?)`, [league.id, joinerId], (err) => {
                if (err) {
                    console.log(err);
                    return res.status(400).json({ message: 'Error joining league!' });
                }
                res.json({ message: 'Joined league and created team successfully!' });
            });
        });
    });
});

router.get('/leagues', authenticator.authenticateToken, (req, res) => {
    console.log("Getting leagues for user id:", req.userId);
    const { leagueName } = req.query;
    let query = `
        SELECT leagues.id, leagues.name AS leagueName, leagues.started, username AS founder
        FROM leagues
        LEFT JOIN league_users ON leagues.id = league_users.league_id
        LEFT JOIN users ON leagues.founder_id = users.id
        WHERE league_users.user_id = ${req.userId}
    `;
    let params = [];

    if (leagueName) {
        query += ' AND leagues.name = ?';
        params.push(leagueName);
    }

    query += ' GROUP BY leagues.id';

    db.all(query, params, (err, rows) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ message: 'Error fetching leagues!' });
        }
        console.log("Leagues:", rows);
        // Transform the players from a comma-separated string to an array
        const leagues = rows.map(row => ({
            ...row,
            players: row.players ? row.players.split(',') : []
        }));
        res.json(leagues);
    });
});

router.post('/start-league', authenticator.authenticateToken, (req, res) => {
    console.log("Starting league")
    const { leagueName, startTime, draftTimeValue, friendlyTickValue, competitiveTickValue } = req.body;
    db.get(`SELECT * FROM leagues WHERE name = ?`, [leagueName], (err, league) => {
        if (err || !league) {
            console.log("Error or no league avilable: ", err);
            return res.status(400).json({ message: 'League does not exist!' });
        }

        if (league.founder_id != req.userId) {
            console.log('Only the founder can start the league!', league.founder_id, req.userId);
            return res.status(400).json({ message: 'Only the founder can start the league!' });
        }

        if(league.started) {
            console.log('League already started!');
            return res.status(400).json({ message: 'League already started!' });
        }

        db.run(`UPDATE leagues SET started = ?, draft_timer_mins = ?, friendly_tick_secs = ?, competitive_tick_secs = ? WHERE id = ?`, [true, draftTimeValue, friendlyTickValue, competitiveTickValue, league.id], (err) => {
            if (err) {
                return res.status(400).json({ message: 'Error starting league!' });
            }
            res.json({ message: 'League started successfully!' });
        });

        db.run(`UPDATE teams SET in_season = ? WHERE league_id = ?`, [true, league.id], (err) => {
            if (err) {
                console.log('Error updating teams:', err);
            }

            const season = new Season(league.id);
            console.log("Start time: ", startTime);
            season.setMatches(new Date(startTime), (err) => {
                if (err) {
                    console.log(err);
                }
            });
            const draft = new Draft(league.id);
        });
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
            type,
            (strftime('%s', 'now') - strftime('%s', created_at)) > 101*friendly_tick_secs AS is_over,
            SUM(CASE WHEN scoring_history.team_id = home_team.id THEN scoring_history.successful_score * (scoring_history.points_worth) ELSE 0 END) AS home_team_live_score,
            SUM(CASE WHEN scoring_history.team_id = away_team.id THEN scoring_history.successful_score * (scoring_history.points_worth) ELSE 0 END) AS away_team_live_score
        FROM 
            match_history
        JOIN 
            teams AS home_team ON home_team_id = home_team.id
        JOIN 
            teams AS away_team ON away_team_id = away_team.id
        JOIN
            leagues ON match_history.league_id = leagues.id
        LEFT JOIN
            scoring_history ON match_history.id = scoring_history.match_id AND scoring_history.tick*friendly_tick_secs < (strftime('%s', 'now') - strftime('%s', created_at))
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

    db.all(`SELECT * FROM drafts WHERE league_id = ? AND active = 1`, [leagueId], (err, draft) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ message: 'Error checking for active draft!' });
        }

        if (!draft) {
            return res.json([]);
        }

        res.json(draft);
    });
});

router.get('/league/upcoming', authenticator.authenticateToken, (req, res) => {
    const { leagueId } = req.query;
    console.log("Getting upcoming matches for league id:", leagueId);

    db.all(`SELECT my_team.id AS my_team_id, happening_at, challenger_team_id, challenged_team_id, challenges.id AS challenge_id, challenger.name AS challenger_name, challenged.name AS challenged_name
        FROM challenges, teams AS challenger, teams AS challenged, teams AS my_team WHERE challenger_team_id = challenger.id AND challenged_team_id = challenged.id
        AND my_team.owner_id = ? AND challenges.league_id = ? AND challenges.status = 'upcoming'
        AND (strftime('%s', happening_at) - strftime('%s', 'now')) > 0`, [req.userId, leagueId], (err, matches) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ message: 'Error fetching upcoming matches!' });
        }

        res.json(matches);
    });
});

export default router;