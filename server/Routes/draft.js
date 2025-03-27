import { Team } from '../Models/team.js';
import express from 'express';
import { db } from '../database.js';
import { Draft } from '../Models/draft.js';
import { authenticator } from '../Models/authenticator.js';

const router = express.Router();
let scheduledDraftExpires = {};

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
        db.all(`SELECT bulk, finesse, cardio, height, strength, intelligence, power, players.id, title, description, name
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
    //Check that team is either supposed to be drafting or has draft picks
    db.get(`SELECT teams.id FROM teams, drafts
    WHERE teams.owner_id = ? AND drafts.id = ? AND (drafts.currently_drafting_team_id = teams.id OR teams.draft_picks>0)`, [user, draftId], (err, team) => {
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

            db.all(`SELECT teams.id, draft_timer_mins FROM teams LEFT JOIN leagues on teams.league_id = leagues.id
                WHERE in_season = TRUE AND league_id = (SELECT league_id FROM drafts WHERE drafts.id = ?) ORDER BY teams.id`, [draftId], (err, teams) => {
                if (err) {
                    console.log("Error getting teams: ", err);
                    return res.status(400).json({ message: 'Error getting teams!' });
                }
                const draft_timer_ms = teams[0].draft_timer_mins * 60 * 1000;
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
                    
                    db.run(`UPDATE players SET team_id = ? WHERE id = ? AND team_id IS NULL AND draft_id = ?`, [team.id, playerId, draftId], function(err) {
                        if (err) {
                            console.log("Error updating player: ", err);
                            return res.status(400).json({ message: 'Error updating player!' });
                        }
                        if (this.changes === 0) {
                            console.log("No players were updated!");
                            return res.status(400).json({ message: 'That player is not available' });
                        }
                        console.log("Updated player ", playerId, " to team ", team.id)

                        db.get(`SELECT teams.id, drafts.currently_drafting_team_id FROM teams, drafts
                            WHERE teams.owner_id = ? AND drafts.id = ?`, [user, draftId], (err, row) => {
                            if(err) {
                                console.log("Error checking team draft_picks: ", err);
                            }
                            if(row.id != row.currently_drafting_team_id) {
                                db.run(`UPDATE teams SET draft_picks=draft_picks-1 WHERE id = ?`, [row.id], (err) => {
                                    if(err) {
                                        console.log("Error decrementing draft picks: ", err);
                                    }
                                });
                            } else {
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
                                    if(scheduledDraftExpires[draftId]) {
                                        clearTimeout(scheduledDraftExpires[draftId]);
                                    }
                                    scheduledDraftExpires[draftId] = setTimeout(() => {
                                        skipTurn(draftId, draft_timer_ms);
                                    }, draft_timer_ms);
                                });
                            });
                        }
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
    db.get(`SELECT player_id FROM draft_premoves WHERE draft_id = ? AND team_id = ? ORDER BY queue_order ASC`, [draftId, nextTeamId], (err, premove) => {
        if (err) {
            console.log("Error getting premoves: ", err);
            callback(draftTurn);
            return;
        }
        if (!premove) {
            console.log("No player found in draft queue")
            callback(draftTurn);
            return;
        }
        db.get(`SELECT * FROM players WHERE id = ?`, [premove.player_id], (err, player) => {
            if (err) {
                console.log("Error getting player: ", err);
                callback(draftTurn);
                return;
            }
            if(player.team_id) {
                console.log("Player already drafted")
                db.run(`DELETE FROM draft_premoves WHERE draft_id = ? AND team_id = ? AND player_id = ?`, [draftId, nextTeamId, player.id], (err) => {
                    if (err) {
                        console.log("Error removing premove: ", err);
                        callback(draftTurn);
                        return;
                    }
                    console.log("Removed player ", player.id, " from premove queue")
                    draftQueue(teams, draftId, draftTurn, (turn) => {
                        callback(turn);
                    });
                    return;
                });
            } else {
                console.log("Queuing draft for player: ", player)
                db.run(`UPDATE players SET team_id = ? WHERE id = ?`, [nextTeamId, player.id], (err) => {
                    if (err) {
                        console.log("Error updating player: ", err);
                        callback(draftTurn);
                        return;
                    }
                    console.log("Updated player ", player.id, " to team ", nextTeamId)
                    db.run(`DELETE FROM draft_premoves WHERE draft_id = ? AND team_id = ? AND player_id = ?`, [draftId, nextTeamId, player.id], (err) => {
                        if (err) {
                            console.log("Error removing premove: ", err);
                            callback(draftTurn);
                            return;
                        }
                        console.log("Removed player ", player.id, " from premove queue")
                        draftTurn++;
                        draftQueue(teams, draftId, draftTurn, (turn) => {
                            callback(turn);
                        });
                    });
                });
            }
        });
    });
}

function skipTurn(draftId, timer) {
    if(scheduledDraftExpires[draftId]) {
        clearTimeout(scheduledDraftExpires[draftId]);
    }
    scheduledDraftExpires[draftId] = setTimeout(() => {
        skipTurn(draftId, timer);
    }, timer);
    console.log("Skipping turn for draft ", draftId);
    const currentTime = new Date();
    const currentHour = currentTime.getUTCHours();
    const estHour = (currentHour - 5 + 24) % 24; // Convert UTC to EST

    if (estHour < 10 || estHour >= 22) {
        console.log("Draft is outside of allowed hours (10 AM - 10 PM EST)");
        return;
    }
    db.get(`SELECT * FROM drafts WHERE id = ?`, [draftId], (err, draft) => {
        if (err) {
            console.log("Error finding draft: ", err);
            return;
        }
        if (!draft) {
            console.log("Draft not found")
            return;
        }
        db.all(`SELECT id FROM teams WHERE in_season = TRUE AND league_id = (SELECT league_id FROM drafts WHERE id = ?) ORDER BY id`, [draftId], (err, teams) => {
            if (err) {
                console.log("Error getting teams: ", err);
                return;
            }
            const thisTurn = draft.turn;
            draftQueue(teams,draftId,draft.turn, (turn) => {
                if(turn != thisTurn) {
                    console.log("Tried to skip someone with a queued draft")
                    return;
                }
                db.run(`UPDATE teams SET draft_picks = draft_picks + 1 WHERE id = (SELECT currently_drafting_team_id FROM drafts WHERE id = ?)`, [draftId], (err) => {
                    if(err) {
                        console.log("Error giving a team a draft pick:", err)
                    }
                })
                draftQueue(teams, draftId, turn+1, (nextTurn) => {
                    const backwards = Math.floor(nextTurn/teams.length) % 2;
                    const nextTeamIndex = !backwards ? nextTurn % teams.length : teams.length - nextTurn % teams.length - 1;
                    const nextTeamId = teams[nextTeamIndex].id;
                    db.run(`UPDATE drafts SET currently_drafting_team_id = ?, turn = ? WHERE id = ?`, [nextTeamId, nextTurn, draftId], (err) => {
                        if (err) {
                            console.log("Error updating turn: ", err);
                            return;
                        }
                    });
                });
            })
        });
    });
}

db.all(`SELECT drafts.id AS draft_id, turn, draft_timer_mins FROM drafts, leagues WHERE drafts.league_id = leagues.id`, (err, rows) => {
    if(err) {
        console.log("Setting draft timer error: ", err)
    }
    console.log(rows)
    for(const row of rows) {
        if(row.turn > 21) {
            db.run(`UPDATE drafts SET active=false WHERE id=${row.draft_id}`, (err) => {
                console.log("Error deactivating draft: ", err)
            })
        }
        else {
            const draft_timer_ms = row.draft_timer_mins * 60 * 1000;
            scheduledDraftExpires[row.draft_id] = setTimeout(() => {
                skipTurn(row.draft_id, draft_timer_ms);
            }, draft_timer_ms);
        }
    }
})

export default router;