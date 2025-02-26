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
    db.all('SELECT tick, possession_team_id, ball_position, player_possession_id, created_at FROM match_ticks_history, match_history WHERE match_id = ? AND id = ?', [matchId, matchId], (err, tick_rows) => {
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
        SELECT users.username AS owner, teams.name, teams.id, home_team_id, away_team_id
        FROM match_history, teams, users
        WHERE (home_team_id = teams.id OR away_team_id = teams.id) AND users.id = teams.owner_id
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
        SELECT name, team_id, title, players.id, offensive_role, defensive_role, description, offensive_target_id, defensive_target_id
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
    let query = `
WITH scoring AS (
    SELECT 
        shooter_id AS player_id,
        SUM(successful_score * points_worth) AS points_scored,
        SUM(CASE WHEN successful_score AND blitzer_id IS NULL THEN 1 ELSE 0 END) AS field_goals_successful,
        SUM(CASE WHEN blitzer_id IS NULL THEN 1 ELSE 0 END) AS field_goals_attempted,
        SUM(CASE WHEN successful_score AND blitzer_id IS NOT NULL THEN 1 ELSE 0 END) AS blitz_goals_successful,
        SUM(CASE WHEN blitzer_id IS NOT NULL THEN 1 ELSE 0 END) AS blitz_goals_attempted
    FROM scoring_history
    WHERE match_id = ${matchId}
    GROUP BY shooter_id
),
blitzes AS (
    SELECT 
        blitzer_id AS player_id,
        COUNT(DISTINCT tick) AS blitzes
    FROM scoring_history
    WHERE match_id = ${matchId} AND blitzer_id IS NOT NULL
    GROUP BY blitzer_id
),
blocks AS (
    SELECT
        blocker_id AS player_id,
        SUM(points_worth) AS points_blocked
    FROM scoring_history
    WHERE match_id = ${matchId} AND blocker_id IS NOT NULL
    GROUP BY blocker_id
),
tricks AS (
    SELECT 
        tricker_id AS player_id, 
        COUNT(*) AS tricks
    FROM match_trick_history
    WHERE match_id = ${matchId}
    GROUP BY tricker_id
),
damage AS (
    SELECT 
        attacking_player_id AS player_id,
        SUM(damage_done) AS damage_done
    FROM attack_history
    WHERE match_id = ${matchId}
    GROUP BY attacking_player_id
),
damage_taken AS (
    SELECT 
        attacked_player_id AS player_id,
        SUM(damage_done) AS damage_taken
    FROM attack_history
    WHERE match_id = ${matchId}
    GROUP BY attacked_player_id
),
advancements AS (
    SELECT 
        player_id, 
        SUM(CASE WHEN "type" = 'Advance' THEN advancement ELSE 0 END) AS advancements,
        SUM(CASE WHEN "type" = 'Steal' THEN 1 ELSE 0 END) AS steals,
        SUM(CASE WHEN "type" = 'Defend' THEN advancement ELSE 0 END) AS defense
    FROM advancement_history
    WHERE match_id = ${matchId}
    GROUP BY player_id
)
SELECT 
    p.name,
    ph.offensive_role,
    ph.defensive_role,
    ph.offense_action_property,
    ph.defense_action_property,
    offense_target.name AS offensive_target,
    defense_target.name AS defensive_target,
    COALESCE(s.field_goals_attempted, 0) AS field_goals_attempted,
    COALESCE(s.field_goals_successful, 0) AS field_goals_successful,
    COALESCE(s.blitz_goals_attempted, 0) AS blitz_goals_attempted,
    COALESCE(s.blitz_goals_successful, 0) AS blitz_goals_successful,
    p.team_id AS team_id,
    COALESCE(s.points_scored, 0) AS points_scored,
    COALESCE(t.tricks, 0) AS tricks,
    COALESCE(b.blitzes, 0) AS blitzes,
    COALESCE(a.advancements, 0) AS advancements,
    COALESCE(a.defense, 0) AS defense,
    COALESCE(d.damage_done, 0) AS damage,
    COALESCE(bl.points_blocked, 0) AS points_blocked,
    COALESCE(a.steals, 0) AS steals,
    COALESCE(dt.damage_taken, 0) AS damage_taken
FROM player_history ph
JOIN players p ON ph.player_id = p.id
LEFT JOIN scoring s ON ph.player_id = s.player_id
LEFT JOIN blitzes b ON ph.player_id = b.player_id
LEFT JOIN tricks t ON ph.player_id = t.player_id
LEFT JOIN advancements a ON ph.player_id = a.player_id
LEFT JOIN damage d ON ph.player_id = d.player_id
LEFT JOIN blocks bl ON ph.player_id = bl.player_id
LEFT JOIN players offense_target ON ph.offensive_target_id = offense_target.id
LEFT JOIN players defense_target ON ph.defensive_target_id = defense_target.id
LEFT JOIN damage_taken dt ON ph.player_id = dt.player_id
WHERE ph.match_id = ${matchId}
GROUP BY 
    ph.player_id, 
    p.name, 
    p.team_id, 
    s.points_scored, 
    s.field_goals_successful,
    s.field_goals_attempted,
    s.blitz_goals_successful,
    s.blitz_goals_attempted,
    t.tricks, 
    b.blitzes,
    a.advancements,
    d.damage_done,
    bl.points_blocked
    `;
    db.all(query, (err, stats) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ message: 'Error fetching stats!' });
        }
        res.json(stats);
    });
});

export default router;