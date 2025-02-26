import { Team } from '../Models/team.js';
import express from 'express';
import { db } from '../database.js';
import { Draft } from '../Models/draft.js';
import { authenticator } from '../Models/authenticator.js';

const router = express.Router();

router.get('/draft/players', (req, res) => {
    const { draftId } = req.query;
    console.log("Getting draft players from draftId ", draftId);
    db.get('SELECT * FROM drafts WHERE id = ? AND active = TRUE', [draftId], (err, draft) => {
        if(err) {
            console.log(err);
            return res.status(400).json({message: "Error finding draft"})
        }
        if(!draft) {
            return res.status(404).json({message: "Draft not found"})
        }
        const order = draft.turn;
        db.all(`SELECT bulk, finesse, focus, height, strength, trickiness, players.id, title, description, name
            FROM players JOIN quirks on players.quirk = quirks.id 
            WHERE players.draft_id = ? AND players.team_id IS NULL`, [draftId], (err, players) => {
            if (err) {
                console.log("Draft error: ", err)
                return res.status(400).json({ message: 'Error getting players!' });
            }
            res.json({prospects: players, turn: order});
        });
    });
});

router.post('/draft/player', authenticator.authenticateToken, (req, res) => {
    const { playerId, draftId } = req.body;
    const user = req.userId;

    console.log("", user, " is drafting player: ", playerId)
    db.get(`SELECT teams.id FROM teams 
    JOIN drafts on currently_drafting_team_id = teams.id
    WHERE teams.owner_id = ? AND drafts.id = ?`, [user, draftId], (err, team) => {
        console.log(team);
        if (err) {
            console.log("Error finding team: ", err);
            return res.status(400).json({ message: 'Error finding team!' });
        }
        if (!team) {
            console.log("Team not found")
            return res.status(404).json({ message: 'Team not found!' });
        }

        db.get(`SELECT turn FROM drafts WHERE id = ?`, [draftId], (err, draft) => {
            if (err) {
                console.log("Error getting updated draft turn: ", err);
                return res.status(400).json({ message: 'Error getting updated draft turn!' });
            }
            let nextTurn = draft.turn+1;

            db.all(`SELECT id FROM teams WHERE in_season = TRUE AND league_id = (SELECT league_id FROM drafts WHERE id = ?) ORDER BY id`, [draftId], (err, teams) => {
                if (err) {
                    console.log("Error getting teams: ", err);
                    return res.status(400).json({ message: 'Error getting teams!' });
                }
                db.get(`SELECT COUNT(*) as playerCount FROM players WHERE team_id = ?`, [team.id], (err, result) => {
                    console.log("Player count: ", result.playerCount)
                    if (err) {
                        console.log("Error counting players: ", err);
                        return res.status(400).json({ message: 'Error counting players!' });
                    }
                    if (result.playerCount >= 8) {
                        console.log("Team is at its max size!")
                        return res.json({ message: 'Team is at its max size!' });
                    }
                    
                    db.run(`UPDATE players SET team_id = ? WHERE id = ?`, [team.id, playerId], (err) => {
                        if (err) {
                            console.log("Error updating player: ", err);
                            return res.status(400).json({ message: 'Error updating player!' });
                        }
                        console.log("Updated player ", playerId, " to team ", team.id)

                        draftQueue(teams, draftId, nextTurn, (turn) => {
                            nextTurn = turn;
                            console.log("Next turn: ", nextTurn)
                            //Calculate next team
                            const backwards = Math.floor(nextTurn/teams.length) % 2;
                            const nextTeamIndex = !backwards ? nextTurn % teams.length : teams.length - nextTurn % teams.length - 1;
                            const nextTeamId = teams[nextTeamIndex].id;

                            db.run(`UPDATE drafts SET currently_drafting_team_id = ?, turn = ? WHERE id = ?`, [nextTeamId, nextTurn, draftId], (err) => {
                                if (err) {
                                    console.log("Error updating currently drafting team: ", err);
                                    return res.status(400).json({ message: 'Error updating currently drafting team!' });
                                }
                                res.json({ message: 'Player updated successfully!' });
                            });
                        });
                    });
                });
            });
        });
    });
});

router.get('/draft/premoves', authenticator.authenticateToken, (req, res) => {
    const { draftId } = req.query;
    const user = req.userId;
    
    console.log("Getting premoves for draft ", draftId, " and user ", user);

    db.get(`SELECT * FROM teams WHERE league_id = (SELECT league_id from drafts WHERE drafts.id = ?) AND owner_id = ?`, [draftId, user], (err, team) => {
        if (err) {
            console.log("Error finding team: ", err);
            return res.status(400).json({ message: 'Error finding team!' });
        }
        if (!team) {
            console.log("Team not found")
            return res.status(404).json({ message: 'Team not found!' });
        }
        const teamId = team.id;
        db.all(`SELECT queue_order, player_id FROM draft_premoves, teams WHERE teams.id = ? AND owner_id = ? AND draft_id = ? AND team_id = ? 
            ORDER BY queue_order ASC`, [teamId, user, draftId, teamId], (err, premoves) => {
            if (err) {
                console.log("Error getting premoves: ", err);
                return res.status(400).json({ message: 'Error getting premoves!' });
            }
            res.json(premoves);
        });
    });
});

router.post('/draft/premove', authenticator.authenticateToken, (req, res) => {
    const { draftId, playerId, order } = req.body;
    const user = req.userId;
    db.get(`SELECT * FROM teams WHERE league_id = (SELECT league_id from drafts WHERE drafts.id = ?) AND owner_id = ?`, [draftId, user], (err, team) => {
        if (err) {
            console.log("Error finding team: ", err);
            return res.status(400).json({ message: 'Error finding team!' });
        }
        if (!team) {
            console.log("Team not found")
            return res.status(404).json({ message: 'Team not found!' });
        }
        const teamId = team.id;

        db.get(`SELECT COUNT(*) as playerCount FROM players WHERE team_id = ?`, [teamId], (err, result) => {
            console.log("Player count: ", result.playerCount)
            if (err) {
                console.log("Error counting players: ", err);
                return res.status(400).json({ message: 'Error counting players!' });
            }
            if (result.playerCount >= 8) {
                console.log("Team is at its max size!")
                return res.json({ message: 'Team is at its max size!' });
            }
            db.run(`INSERT INTO draft_premoves (draft_id, team_id, player_id, queue_order) VALUES (?, ?, ?, ?)`, [draftId, teamId, playerId, order], (err) => {
                if (err) {
                    console.log("Error adding premove: ", err);
                    return res.status(400).json({ message: 'Error adding premove!' });
                }
                res.json({ message: 'Draft queued successfully!' });
            });
        });
    });
});

router.post('/draft/undo-premove', authenticator.authenticateToken, (req, res) => {
    const { draftId, playerId } = req.body;
    const user = req.userId;
    db.get(`SELECT * FROM teams WHERE league_id = (SELECT league_id from drafts WHERE drafts.id = ?) AND owner_id = ?`, [draftId, user], (err, team) => {
        if (err) {
            console.log("Error finding team: ", err);
            return res.status(400).json({ message: 'Error finding team!' });
        }
        if (!team) {
            console.log("Team not found")
            return res.status(404).json({ message: 'Team not found!' });
        }
        const teamId = team.id;

        db.run(`DELETE FROM draft_premoves WHERE draft_id = ? AND team_id = ? AND player_id = ?`, [draftId, teamId, playerId], (err) => {
            if (err) {
                console.log("Error removing premove: ", err);
                return res.status(400).json({ message: 'Error removing premove!' });
            }
            res.json({ message: 'Draft removed successfully!' });
        });
    });
});

function draftQueue(teams, draftId, draftTurn, callback) {
    console.log("Draft queue, turn: ", draftTurn);
    //Calculate next team
    const backwards = Math.floor(draftTurn/teams.length) % 2;
    const nextTeamIndex = !backwards ? draftTurn % teams.length : teams.length - draftTurn % teams.length - 1;
    const nextTeamId = teams[nextTeamIndex].id;
    db.get(`SELECT player_id FROM draft_premoves WHERE draft_id = ? AND team_id = ? ORDER BY queue_order ASC`, [draftId, nextTeamId], (err, player) => {
        if (err) {
            console.log("Error getting premoves: ", err);
            callback(draftTurn);
            return;
        }
        if (!player) {
            console.log("No player found in draft queue")
            callback(draftTurn);
            return;
        }
        db.get(`SELECT * FROM players WHERE id = ?`, [player.player_id], (err, player) => {
            if (err) {
                console.log("Error getting player: ", err);
                callback(draftTurn);
                return;
            }
            if(player.team_id) {
                console.log("Player already drafted")
                db.run(`DELETE FROM draft_premoves WHERE draft_id = ? AND team_id = ? AND player_id = ?`, [draftId, nextTeamId, player.player_id], (err) => {
                    if (err) {
                        console.log("Error removing premove: ", err);
                        callback(draftTurn);
                        return;
                    }
                    console.log("Removed player ", player.player_id, " from premove queue")
                    draftQueue(teams, draftId, draftTurn, (turn) => {
                        callback(turn);
                    });
                    return;
                });
            }
            console.log("Queuing draft for player: ", player)
            db.run(`UPDATE players SET team_id = ? WHERE id = ?`, [nextTeamId, player.player_id], (err) => {
                if (err) {
                    console.log("Error updating player: ", err);
                    callback(draftTurn);
                    return;
                }
                console.log("Updated player ", player.player_id, " to team ", nextTeamId)
                db.run(`DELETE FROM draft_premoves WHERE draft_id = ? AND team_id = ? AND player_id = ?`, [draftId, nextTeamId, player.player_id], (err) => {
                    if (err) {
                        console.log("Error removing premove: ", err);
                        callback(draftTurn);
                        return;
                    }
                    console.log("Removed player ", player.player_id, " from premove queue")
                    draftTurn++;
                    draftQueue(teams, draftId, draftTurn, (turn) => {
                        callback(turn);
                    });
                });
            });
        });
    });
}

export default router;