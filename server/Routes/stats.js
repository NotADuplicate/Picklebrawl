import { Team } from '../Models/team.js';
import express from 'express';
import { db } from '../database.js';

const router = express.Router();

router.get('/game-stats', (req, res) => {
    // req is the request, req.query is the parameters in the request
    const { teamId } = req.query;
    console.log("Getting team stats for team id:", teamId);

    let query = `
        SELECT home_team_id, away_team_id, home_team_score, away_team_score
        FROM match_history
        WHERE home_team_id = {teamId}
        OR away_team_id = {team_Id}
    `;
    let params = [];

    db.each(query, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Error fetching games for game stats!' });
        }
        res.json(rows)
    });
    /*
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
    */
});

export default router;