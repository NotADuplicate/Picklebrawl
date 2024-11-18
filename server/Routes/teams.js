import express from 'express';
import { db } from '../database.js';

const router = express.Router();

console.log('Loading leagues routes');

router.get('/teams', (req, res) => {
    console.log("Getting teams");
    const leagueId = req.query.leagueId;
    db.all(`SELECT teams.id, teams.name, league_id, username AS owner FROM teams
        LEFT JOIN users on users.id = teams.owner_id WHERE league_id = ?`, [leagueId], (err, teams) => {
        if (err) {
            console.log("Error fetching teams:", err);
            return res.status(500).json({ message: 'Error fetching teams!' });
        }
        res.json(teams);
    });
});

router.get('/teams/:teamId', (req, res) => {
    const teamId = req.params.teamId;
    db.get(`SELECT * FROM teams WHERE id = ?`, [teamId], (err, team) => {
        if (err) {
            return res.status(500).json({ message: 'Error fetching team!' });
        }
        res.json(team);
    });
});

router.get('/teams/:teamId/players', (req, res) => {
    console.log("Getting players");
    const teamId = req.params.teamId;
    db.all(`SELECT players.*, quirks.description AS quirk_description, quirks.title AS quirk_title 
            FROM players 
            INNER JOIN quirks ON players.quirk = quirks.id 
            WHERE team_id = ?`, [teamId], (err, players) => {
        if (err) {
            console.log("Error fetching players:", err);
            return res.status(500).json({ message: 'Error fetching players!' });
        }
        //console.log("Players:", players);
        res.json(players);
    });
});

export default router;