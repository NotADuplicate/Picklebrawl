import express from 'express';
import { db } from '../database.js';

const router = express.Router();

const TIME_PER_TICK = 1000;

router.get('/match/match-id', (req, res) => {
    console.log("MATCH ID\n\n\n\n\n\n\n")
    console.log("Getting match id for challenge id:", req.query.challengeId);
    const { challengeId } = req.query;
    db.get('SELECT id FROM match_history WHERE challenge_id = ?', [challengeId], (err, match) => {
        if (err) {
            return res.status(500).json({ message: 'Error fetching match id!' });
        }
        console.log(match);
        res.json(match);
    });
});

router.get('/match/match-ticks', (req, res) => {
    // req is the request, req.query is the parameters in the request
    const { matchId, tick } = req.query;
    console.log("Getting match ticks for match id:", matchId);
    db.all(`SELECT tick, possession_team_id, ball_position, player_possession_id, created_at FROM match_ticks_history, match_history WHERE match_id = ? AND id = ?
        ORDER BY tick ASC`, [matchId, matchId], (err, tick_rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Error fetching match tick!' });
        }
        if(tick_rows.length == 0) {
            console.log("Match ticks not found!!!");
            return res.json({ message: 'Match tick not found' });
        }
        const matchCreatedAt = new Date(tick_rows[0].created_at + ' UTC').getTime();

        db.all('SELECT * FROM scoring_history, players WHERE match_id = ? AND players.id = shooter_id', [matchId], (err, score_rows) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ message: 'Error fetching score history!' });
            }
            db.all('SELECT * FROM attack_history WHERE match_id = ?', [matchId, tick], (err, attack_rows) => {
                if (err) {
                    console.log(err);
                    return res.status(500).json({ message: 'Error fetching attack history!' });
                }
                db.all('SELECT * FROM match_trick_history WHERE match_id = ?', [matchId], (err, trick_rows) => {
                    if (err) {
                        console.log(err);
                        return res.status(500).json({ message: 'Error fetching trick history!' });
                    }
                    db.all('SELECT * FROM match_action_history WHERE match_id = ?', [matchId], (err, action_rows) => {
                        if (err) {
                            console.log(err);
                            return res.status(500).json({ message: 'Error fetching action history!' });
                        }
                        db.all(`SELECT * FROM advancement_history WHERE "type" = 'Breakaway' AND match_id = ?`, [matchId], (err, breakaways) => {
                            if(err) {
                                console.log(err);
                                return res.status(500).json({ message: 'Error fetching breakaway history!' });
                            }
                            res.json({
                                matchTicks: tick_rows,
                                scoringHistory: score_rows,
                                attackHistory: attack_rows,
                                trickHistory: trick_rows,
                                actionHistory: action_rows,
                                breakawayHistory: breakaways,
                                matchCreatedAt: matchCreatedAt
                            });
                        })
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
        SELECT users.username AS owner, teams.name, teams.id, home_team_id, away_team_id, friendly_tick_secs
        FROM match_history, teams, users, leagues
        WHERE (home_team_id = teams.id OR away_team_id = teams.id) AND users.id = teams.owner_id AND leagues.id = match_history.league_id
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
        SELECT name, team_id, title, players.id, offensive_role, defensive_role, description, offensive_target_id, defensive_target_id, player_history.health
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

router.get('/match/match-stats', (req, res) => {
    console.log("Getting stats for match id:", req.query.matchId);
    const { matchId } = req.query;
    let query = `SELECT * FROM match_stats WHERE match_id = ${matchId}`;
    db.all(query, (err, stats) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ message: 'Error fetching stats!' });
        }
        res.json(stats);
    });
});

export default router;