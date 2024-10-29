import { Team } from '../Models/team.js';
import express from 'express';
import { db } from '../database.js';
import { Draft } from '../Models/draft.js';

const router = express.Router();

router.get('/draft/players', (req, res) => {
    const { draftId } = req.query;
    console.log("Getting draft players from draftId ", draftId);
    db.all(`SELECT * FROM players WHERE draft_id = ?`, [draftId], (err, players) => {
        if (err) {
            return res.status(400).json({ message: 'Error getting players!' });
        }
        console.log("Players: ", players);
        res.json(players);
    });
});

export default router;