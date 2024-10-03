import express from 'express';
import { db } from '../database.js';

const router = express.Router();

router.get('/match/match-id', (req, res) => {
    console.log("MATCH ID\n\n\n\n\n\n\n")
    console.log("Getting match id for match name:", req.query.challengeId);
    const { challengeId } = req.query;
    db.get('SELECT id FROM match_history WHERE challenge_id = ?', [challengeId], (err, match) => {
        if (err) {
            return res.status(500).json({ message: 'Error fetching match id!' });
        }
        console.log(match);
        res.json(match);
    });
});

router.get('/match/match-tick', (req, res) => {
    // req is the request, req.query is the parameters in the request
    const { matchId, tick } = req.query;
    //console.log("Getting match tick for match id:", matchId);
    db.get('SELECT * FROM match_ticks_history WHERE match_id = ? AND tick = ?', [matchId, tick], (err, tick_row) => {
        if (err) {
            return res.status(500).json({ message: 'Error fetching match tick!' });
        }
        db.get('SELECT * FROM scoring_history, players WHERE match_id = ? AND tick = ? AND players.id = shooter_id', [matchId, tick], (err, score_row) => {
            if (err) {
                return res.status(500).json({ message: 'Error fetching score history!' });
            }
            db.all('SELECT * FROM attack_history WHERE match_id = ? AND tick = ?', [matchId, tick], (err, attack_rows) => {
                if (err) {
                    return res.status(500).json({ message: 'Error fetching attack history!' });
                }
                res.json({
                    matchTick: tick_row,
                    scoringHistory: score_row,
                    attackHistory: attack_rows
                });
            });
        });
    });
});

router.get('/match/teams', (req, res) => {
    console.log("Getting teams for match id:", req.query.matchId);
    const { matchId } = req.query;
    let query = `
        SELECT owner, name, teams.id, home_team_id, away_team_id
        FROM match_history, teams
        WHERE home_team_id = teams.id OR away_team_id = teams.id
        AND match_history.id = ${matchId}
    `;
    db.all(query, (err, teams) => {
        console.log(teams);
        if (err) {
            console.log(err);
            return res.status(500).json({ message: 'Error fetching teams!' });
        }
        res.json(teams);
    });
});

router.get('/match/players', (req, res) => {
    console.log("Getting players for match id:", req.query.matchId);
    const { matchId } = req.query;
    let query = `
        SELECT name, team_id, title, players.id, offensive_role, defensive_role, description
        FROM players, player_history, quirks
        WHERE players.id = player_history.player_id AND players.quirk = quirks.id
        AND match_id = ${matchId}
    `;
    db.all(query, (err, players) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ message: 'Error fetching players!' });
        }
        res.json(players);
    });
});

export default router;