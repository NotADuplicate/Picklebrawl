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

router.get('/active-teams', (req, res) => {
    console.log("Getting teams");
    const leagueId = req.query.leagueId;
    db.all(`SELECT teams.id, teams.draft_picks, leagues.name AS league_name, teams.name, league_id, username AS owner FROM teams
        LEFT JOIN users on users.id = teams.owner_id
        LEFT JOIN leagues on leagues.id = teams.league_id
        WHERE league_id = ? AND in_season = TRUE`, [leagueId], (err, teams) => {
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

router.get(`/teams/player/:playerId`, (req, res) => {
    const playerId = req.params.playerId;
    console.log("Getting stats of player:", playerId)
    const season = 1;
    db.get(`SELECT players.name AS player_name, teams.name AS team, 
        SUM(field_goals_attempted) AS total_FG_attempts, AVG(field_goals_attempted) AS avg_FG_attempts,
        SUM(field_goals_successful) AS total_FG_makes, AVG(field_goals_successful) AS avg_FG_makes,
        SUM(blitz_goals_attempted) AS total_blitz_attempts, AVG(blitz_goals_attempted) AS avg_blitz_attempts,
        SUM(blitz_goals_successful) AS total_blitz_makes, AVG(blitz_goals_successful) AS avg_blitz_makes,
        SUM(points_scored) AS total_points, AVG(points_scored) AS avg_points,
        SUM(advancements) AS total_advance, AVG(advancements) AS avg_advance,
        SUM(defense) AS total_defense, AVG(defense) AS avg_defense,
        SUM(points_blocked) AS total_blocks, AVG(points_blocked) AS avg_blocks,
        SUM(damage) AS total_dmg, AVG(damage) AS avg_dmg, COUNT(*) AS matches_played,
        SUM(steals) AS total_steals, AVG(steals) as avg_steals
        FROM players JOIN teams on players.team_id=teams.id
        LEFT JOIN match_stats ON player_id=players.id
        WHERE players.id = ? AND match_stats.match_type != "friendly" AND match_stats.season = ?
        ` [playerId, season], (err, rows) => {
            if(err) {
                console.log("Error getting player stats:",err)
            }
            res.json({rows})
        })
})

router.get(`/teams/team-stats/:teamId`, (req, res) => {
    const teamId = req.params.teamId;

    console.log("Getting stats of team:", teamId)
    const season = 1;
    db.all(`SELECT players.name AS player_name, teams.name AS team, 
        SUM(field_goals_attempted) AS total_FG_attempts, AVG(field_goals_attempted) AS avg_FG_attempts,
        SUM(field_goals_successful) AS total_FG_makes, AVG(field_goals_successful) AS avg_FG_makes,
        SUM(blitz_goals_attempted) AS total_blitz_attempts, AVG(blitz_goals_attempted) AS avg_blitz_attempts,
        SUM(blitz_goals_successful) AS total_blitz_makes, AVG(blitz_goals_successful) AS avg_blitz_makes,
        SUM(points_scored) AS total_points, AVG(points_scored) AS avg_points,
        SUM(advancements) AS total_advance, AVG(advancements) AS avg_advance,
        SUM(defense) AS total_defense, AVG(defense) AS avg_defense,
        SUM(points_blocked) AS total_blocks, AVG(points_blocked) AS avg_blocks,
        SUM(damage) AS total_dmg, AVG(damage) AS avg_dmg, COUNT(*) AS matches_played,
        SUM(steals) AS total_steals, AVG(steals) as avg_steals
        FROM players JOIN teams on players.team_id=teams.id
        LEFT JOIN match_stats ON player_id=players.id
        WHERE players.team_id = ? AND match_stats.match_type != "friendly" AND match_stats.season = ?
        GROUP BY players.id
        `[teamId, season], (err, rows) => {
            if(err) {
                console.log("Error getting player stats:",err)
            }
            res.json({rows})
        })
})

export default router;