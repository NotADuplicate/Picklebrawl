import express from 'express';
import { db } from '../database.js';

const router = express.Router();

console.log('Loading leagues routes');

router.get('/teams', (req, res) => {
    console.log("Getting teams");
    const leagueId = req.query.leagueId;
    db.all(`SELECT teams.id, leagues.name AS league_name, teams.name, league_id, username AS owner FROM teams
        LEFT JOIN users on users.id = teams.owner_id
        LEFT JOIN leagues on leagues.id = teams.league_id
        WHERE league_id = ?`, [leagueId], (err, teams) => {
        if (err) {
            console.log("Error fetching teams:", err);
            return res.status(500).json({ message: 'Error fetching teams!' });
        }
        res.json(teams);
    });
});

router.get('/teams/:teamId', (req, res) => {
    const teamId = req.params.teamId;
    console.log("Getting team:", teamId);
    db.get(`SELECT teams.id AS id, teams.name, league_id, username AS owner FROM teams 
        LEFT JOIN users on users.id = teams.owner_id
        WHERE teams.id = ?`, [teamId], (err, team) => {
        if (err) {
            console.log("Error fetching team:", err);
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

router.post('/teams/playerDelete/:playerId', (req, res) => {
    const playerId = req.params.playerId;
    console.log("Deleting player:", playerId);
    db.run(`UPDATE players SET team_id = NULL WHERE id = ?`, [playerId], (err) => {
        if (err) {
            console.log("Error firing  player:", err);
            return res.status(500).json({ message: 'Error firing player!' });
        }
        res.json({ message: 'Player fired!' });
    });
});

export default router;