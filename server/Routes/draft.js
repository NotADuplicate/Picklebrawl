import { Team } from '../Models/team.js';
import express from 'express';
import { db } from '../database.js';
import { Draft } from '../Models/draft.js';

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

router.post('/draft/player', (req, res) => {
    const { playerId, user, draftId } = req.body;
    console.log("", user, " is drafting player: ", playerId)
    db.get(`SELECT teams.id FROM teams 
    JOIN drafts on currently_drafting_team_id = teams.id
    WHERE teams.owner = ?`, [user], (err, team) => {
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
            const nextTurn = draft.turn+1;

            db.all(`SELECT id FROM teams WHERE league_id = (SELECT league_id FROM drafts WHERE id = ?) ORDER BY id`, [draftId], (err, teams) => {
                if (err) {
                    console.log("Error getting teams: ", err);
                    return res.status(400).json({ message: 'Error getting teams!' });
                }

                
                const nextTeamId = teams[nextTurn % teams.length].id;
                console.log("Teams: ", teams, " Order: ", nextTurn, " Next team:" , nextTeamId);

                db.run(`UPDATE drafts SET currently_drafting_team_id = ?, turn = ? WHERE id = ?`, [nextTeamId, nextTurn, draftId], (err) => {
                    if (err) {
                        console.log("Error updating currently drafting team: ", err);
                        return res.status(400).json({ message: 'Error updating currently drafting team!' });
                    }
                    console.log("Set the next in drafting order")
                });
            });
        });

        db.run(`UPDATE players SET team_id = ? WHERE id = ?`, [team.id, playerId], (err) => {
            if (err) {
                console.log("Error updating player: ", err);
                return res.status(400).json({ message: 'Error updating player!' });
            }
            console.log("Updated player ", playerId, " to team ", team.id)
            res.json({ message: 'Player updated successfully!' });
        });
    });
});

export default router;