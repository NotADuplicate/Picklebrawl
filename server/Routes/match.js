import express from 'express';
import { db } from '../database.js';

const router = express.Router();

const TIME_PER_TICK = 1000;

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
    console.log("Getting match tick for match id:", matchId, " tick: ", tick);
    db.get('SELECT tick, possession_team_id, ball_position, player_possession_id, created_at FROM match_ticks_history, match_history WHERE match_id = ? AND tick = ? AND id = ?', [matchId, tick, matchId], (err, tick_row) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Error fetching match tick!' });
        }
        console.log(tick_row);
        if(!tick_row) {
            console.log("Match tick not found!!!");
            return res.json({ message: 'Match tick not found' });
        }
        const matchCreatedAt = new Date(tick_row.created_at + ' UTC').getTime();
        const currentTime = new Date().getTime();
        const timePassed = currentTime - matchCreatedAt;
        if(timePassed < TIME_PER_TICK * tick) {
            console.log(matchCreatedAt, currentTime);
            console.log(tick * TIME_PER_TICK, timePassed);
            return res.json({ message: 'Match tick not reached yet' });
        }
        const behindRealTime = timePassed / TIME_PER_TICK > (tick_row.tick+3); //if the client is more than 3 ticks behind real time
        console.log("Ticks passed: ", timePassed / TIME_PER_TICK);
        console.log("Behind real time: ", behindRealTime);

        console.log(`Time passed since match creation: ${timePassed} ms`);
        db.get('SELECT * FROM scoring_history, players WHERE match_id = ? AND tick = ? AND players.id = shooter_id', [matchId, tick], (err, score_row) => {
            if (err) {
                return res.status(500).json({ message: 'Error fetching score history!' });
            }
            db.all('SELECT * FROM attack_history WHERE match_id = ? AND tick = ?', [matchId, tick], (err, attack_rows) => {
                if (err) {
                    return res.status(500).json({ message: 'Error fetching attack history!' });
                }
                db.all('SELECT * FROM match_trick_history WHERE match_id = ? AND tick = ?', [matchId, tick], (err, trick_rows) => {
                    if (err) {
                        console.log(err);
                        return res.status(500).json({ message: 'Error fetching trick history!' });
                    }
                    res.json({
                        matchTick: tick_row,
                        scoringHistory: score_row,
                        attackHistory: attack_rows,
                        trickHistory: trick_rows,
                        behindRealTime: behindRealTime
                    });
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
        WHERE (home_team_id = teams.id OR away_team_id = teams.id)
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