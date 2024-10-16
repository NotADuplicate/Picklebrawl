import { Team } from '../Models/team.js';
import { Match } from '../Models/match.js';
import express from 'express';
import { db } from '../database.js';
import { Player } from '../Models/player.js';
import { Weather } from '../Models/Weather/weather.js';

const router = express.Router();

// Fetch all challenges
router.get('/challenges', (req, res) => {
    console.log('Getting challenges for team: ', req.query.teamId);
    const team_id = req.query.teamId;
    if (!team_id) {
        return res.status(400).json({ error: 'team_id query parameter is required' });
    }

    db.all(
        'SELECT * FROM challenges WHERE (challenger_team_id = ? OR challenged_team_id = ?) AND (status = ? OR status = ?)',
        [team_id, team_id, 'pending', 'accepted'],
        (err, rows) => {
            console.log("Challenges: ", rows);
            if (err) {
                console.error(err);
                res.status(500).json({ error: 'Internal server error' });
            } else {
                res.json(rows);
            }
        }
    );
});

// Create a new challenge
router.post('/challenges', (req, res) => {
    const { teamId, myTeamId } = req.body;
    console.log('Creating challenge: ', myTeamId, teamId);
    db.get(
        'SELECT * FROM challenges WHERE ((challenger_team_id = ? AND challenged_team_id = ?) OR (challenger_team_id = ? AND challenged_team_id = ?)) AND status = ?',
        [myTeamId, teamId, teamId, myTeamId, 'pending'],
        (err, row) => {
            if (err) {
                console.error(err);
                res.status(500).json({ error: 'Internal server error' });
            } else if (row) {
                res.json({ row });
            } else {
                db.run(
                    'INSERT INTO challenges (challenger_team_id, challenged_team_id) VALUES (?, ?)',
                    [myTeamId, teamId],
                    function (err) {
                        if (err) {
                            console.error(err);
                            res.status(500).json({ error: 'Internal server error' });
                        } else {
                            res.status(201).json({ id: this.lastID });
                        }
                    }
                );
            }
        }
    );
});

// Accept a challenge
router.post('/challenges/:id/accept', (req, res) => {
    const { id } = req.params;
    db.run(
        'UPDATE challenges SET status = ? WHERE id = ?',
        ['accepted', id],
        function (err) {
            if (err) {
                console.error(err);
                res.status(500).json({ error: 'Internal server error' });
            } else {
                res.json({ id });
            }
        }
    );
});

//Add players to one side of a challenge
router.post('/challenges/:id/add-players', (req, res) => {
    console.log("Add players")
    const { id } = req.params;
    const { teamId, players } = req.body;
    console.log("Req body players: ", req.body.players)

    db.get('SELECT * FROM challenges WHERE id = ?', [id], (err, row) => {
        if (err) {
            console.error('Error fetching row:', err);
            return;
        }
        if (!row) {
            console.error('No row found');
            return;
        }

        // Check which team ID matches
        let columnToUpdate;
        if (row.challenger_team_id == teamId) {
            columnToUpdate = 'challenger_players_set';
            if(row.challenger_players_set) {
                console.log("Challenger players already set")
                return;
            }
        } else if (row.challenged_team_id == teamId) {
            if(row.challenged_players_set) {
                console.log("Challenged players already set")
                return;
            }
            columnToUpdate = 'challenged_players_set';
        } else {
            console.log('No matching team ID found');
            console.log('Team ID:', teamId);
            console.log('Row:', row);
            return;
        }
        console.log(row)
        console.log("Updating challenges set: ", columnToUpdate)

        const getQuery = `SELECT ${columnToUpdate} FROM challenges WHERE id = ?`;
        db.get(getQuery, [id], (err, row) => {
            if (err) {
                console.error('Error fetching row:', err);
                return;
            }
            console.log("Row: ", row);
            for(let i = 0; i < players.length; i++) {
                const player = players[i];
                console.log("Challengeid: ", id, "TeamId: ", teamId, "Player: ", player)
                db.run(
                    'INSERT INTO challenge_players (challenge_id, team_id, player_id) VALUES (?, ?, ?)', [id, teamId, player], function (err) {
                        if (err) {
                            console.log("Error adding player to challenge players: ", err)
                            console.error(err);
                            res.status(500).json({ error: 'Internal server error' });
                            return;
                        }
                        console.log("Added player to challenge players: ", player)
                    }
                );
            }
        });

        // Update the players set column
        const query = `UPDATE challenges SET ${columnToUpdate} = ? WHERE id = ?`;

        db.run(query, [true, id], function(err) {
                if (err) {
                    console.error(err);
                    res.status(500).json({ error: 'Internal server error' });
                } else {
                    res.json({ id });
                }
                console.log("Updated challenge players set of team: ", columnToUpdate)
        });
    });
});

router.post('/challenges/:id/remove-players', (req, res) => {
    console.log("Remove players")
    const { id } = req.params;
    const { teamId, players } = req.body;
    console.log("Req body players: ", req.body.players)

    db.get('SELECT * FROM challenges WHERE id = ?', [id], (err, row) => {
        if (err) {
            console.error('Error fetching row:', err);
            return;
        }
        if (!row) {
            console.error('No row found');
            return;
        }
        console.log("Row: ", row);

        if((row.challenger_players_set && row.challenged_players_set) || row.challenger_actions_set || row.challenged_actions_set) {
            console.log("Players already been locked in");
            res.json({ message: 'Players already locked in' });
            return;
        }
        // Check which team ID matches
        let columnToUpdate;
        if (row.challenger_team_id == teamId) {
            columnToUpdate = 'challenger_players_set';
            if(!row.challenger_players_set) {
                res.json({ message: 'Players already removed' });
                console.log("Challenger players already removed")
                return;
            }
        } else if (row.challenged_team_id == teamId) {
            columnToUpdate = 'challenged_players_set';
            if(!row.challenged_players_set) {
                res.json({ message: 'Players already removed' });
                console.log("Challenged players already removed")
                return;
            }
        } else {
            console.log('No matching team ID found');
            console.log('Team ID:', teamId);
            console.log('Row:', row);
            return;
        }
        console.log("Updating challenges set: ", columnToUpdate)

        // Update the players set column
        const query = `UPDATE challenges SET ${columnToUpdate} = ? WHERE id = ?`;

        db.run(query, [false, id], function(err) {
                if (err) {
                    console.error(err);
                    res.status(500).json({ error: 'Internal server error' });
                } else {
                    db.run(
                        'DELETE FROM challenge_players WHERE challenge_id = ? AND team_id = ?', [id, teamId], function (err) {
                        if (err) {
                            console.error(err);
                            res.status(500).json({ error: 'Internal server error' });
                        }
                        else {
                            res.json({ message: "Players successfully removed" });
                        }
                        }
                    );
                }
        });
    });
});

//Add actions to one side of a challenge
router.post('/challenges/:id/add-actions', (req, res) => {
    console.log("Add actions")
    const { id } = req.params;
    const { teamId, players, offenseActions, offenseTargets, defenseActions, defenseTargets, offenseProperties, defenseProperties } = req.body;
    console.log("Req body players: ", req.body.players)
    db.get('SELECT challenger_team_id, challenged_team_id FROM challenges WHERE id = ?', [id], (err, row) => {
        if (err) {
            console.error('Error fetching row:', err);
            return;
        }
        if (!row) {
            console.error('No row found');
            return;
        }

        // Check which team ID matches
        let columnToUpdate;
        if (row.challenger_team_id == teamId) {
            columnToUpdate = 'challenger_actions_set';
        } else if (row.challenged_team_id == teamId) {
            columnToUpdate = 'challenged_actions_set';
        } else {
            console.log('No matching team ID found');
            console.log('Team ID:', teamId);
            console.log('Row:', row);
            return;
        }
        console.log("Updating challenges set: ", columnToUpdate)

        const getQuery = `SELECT ${columnToUpdate} FROM challenges WHERE id = ?`;

        db.get(getQuery, [id], (err, row) => {
            if (err) {
                console.error('Error fetching row:', err);
                return;
            }
            console.log("Row: ", row);
            if(row[columnToUpdate]) {
                console.log("Actions already set")
                return;
            }

            const promises = players.map((player, i) => {
                console.log("Challengeid: ", id, "TeamId: ", teamId, "Player: ", player, "OffenseActions: ", offenseActions[i], "OffenseTargets: ", offenseTargets[i], "DefenseActions: ", defenseActions[i], "DefenseTargets: ", defenseTargets[i]);
                return new Promise((resolve, reject) => {
                    db.run(
                        'UPDATE challenge_players SET offense_action = ?, defense_action = ?, offense_target_id = ?, defense_target_id = ?, offense_property = ?, defense_property = ? WHERE challenge_id = ? AND player_id = ?',
                        [offenseActions[i], defenseActions[i], offenseTargets[i], defenseTargets[i], offenseProperties[i], defenseProperties[i], id, player],
                        function (err) {
                            if (err) {
                                console.error(err);
                                reject(err);
                            } else {
                                resolve();
                            }
                        }
                    );
                });
            });

            Promise.all(promises) //wait for all players to be inserted before running match
                .then(() => {
                    // Update the players set column
                    const query = `UPDATE challenges SET ${columnToUpdate} = ? WHERE id = ?`;

                    db.run(query, [true, id], function(err) {
                        if (err) {
                            console.error(err);
                            res.status(500).json({ error: 'Internal server error' });
                        } else {
                            res.json({ id });
                        }
                        console.log("Updated challenge players set of team: ", columnToUpdate);

                        db.get('SELECT * FROM challenges WHERE id = ?', [id], (err, row) => {
                            if (err) {
                                console.error('Error fetching row:', err);
                                return;
                            }
                            console.log("Challenge row after updating actions: ", row);
                            if(row.challenger_players_set && row.challenged_players_set && row.challenger_actions_set && row.challenged_actions_set) {
                                runMatch(row.id);
                            }
                        });
                    });
                })
                .catch(err => {
                    res.status(500).json({ error: 'Internal server error' });
                });
        });
    }); 
});

//Remove actions from one side of a challenge
router.post('/challenges/:id/remove-actions', (req, res) => {
    console.log("Add actions")
    const { id } = req.params;
    const { teamId } = req.body;
    db.get('SELECT * FROM challenges WHERE id = ?', [id], (err, row) => {
        if (err) {
            console.error('Error fetching row:', err);
            return;
        }
        if (!row) {
            console.error('No row found');
            return;
        }

        if(row.challenger_actions_set && row.challenged_actions_set) {
            console.log("Actions already been locked in");
            res.json({ message: 'Actions already locked in' });
            return;
        }

        // Check which team ID matches
        let columnToUpdate;
        if (row.challenger_team_id == teamId) {
            columnToUpdate = 'challenger_actions_set';
            if(!row.challenger_actions_set) {
                res.json({ message: 'Actions already removed' });
                console.log("Challenger actions already removed")
                return;
            }
        } else if (row.challenged_team_id == teamId) {
            columnToUpdate = 'challenged_actions_set';
            if(!row.challenged_actions_set) {
                res.json({ message: 'Actions already removed' });
                console.log("Challenged actions already removed")
                return;
            }
        } else {
            console.log('No matching team ID found');
            console.log('Team ID:', teamId);
            console.log('Row:', row);
            return;
        }
        console.log("Updating challenges set: ", columnToUpdate)

        // Update the players set column
        const query = `UPDATE challenges SET ${columnToUpdate} = ? WHERE id = ?`;

        db.run(query, [false, id], function(err) {
                if (err) {
                    console.error(err);
                    res.status(500).json({ error: 'Internal server error' });
                } else {
                    res.json({ message: "Actions successfully removed" });
                }
                console.log("Updated challenge players set of team: ", columnToUpdate)
        });
    });
});

router.get('/challenges/:id/players-actions', (req, res) => {
    const { id } = req.params;

    db.get('SELECT * FROM challenges WHERE id = ?', [id], (err, challenge) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (!challenge) {
            console.log("No challenge")
            return res.status(404).json({ error: 'Challenge not found' });
        }

        const { challenger_players_set, challenged_players_set, challenger_actions_set, challenged_actions_set } = challenge;

        const flags = {
            challengerPlayersSet: challenger_players_set,
            challengedPlayersSet: challenged_players_set,
            challengerActionsSet: challenger_actions_set,
            challengedActionsSet: challenged_actions_set
        };

        db.all('SELECT * FROM challenge_players WHERE challenge_id = ?', [id], (err, rows) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            //console.log("Challenge players: ", rows)
            res.json({ flags, playersActions: rows });
        });
    });
});

// Get quirk effects for all players in a challenge
router.post('/challenges/:id/quirk-effects', (req, res) => {
    const { ids } = req.body;
    let players = [];
    Promise.all(ids.map((playerId, index) => {
        const player = new Player();
        return player.load(playerId).then(() => {
            players.push(player);
        });
    })).then(() => {
        players.sort((a, b) => a.quirk.START_EFFECT_ORDER - b.quirk.START_EFFECT_ORDER);
        players.forEach(player => {
            player.quirk.challengeStatModification(players, player);
        });
        res.json(players);
    });
});

// Get quirk actions for all players in a challenge
router.post('/challenges/quirk-actions', (req, res) => {
    const { ids } = req.body;
    let extraActions = [];
    Promise.all(ids.map(playerId => {
        console.log("PlayerId: ", playerId)
        const player = new Player();
        return player.load(playerId).then(() => {
            const action = player.quirk.extraActions();
            if(action) {
                extraActions.push({ playerId, action });
            }
        });
    })).then(() => {
        res.json(extraActions);
    });
});

function runMatch(challengeId) {
    let id = challengeId;
    console.log("Running match from challengeId: ", id)

    db.run('UPDATE challenges SET status = ? WHERE id = ?', ['completed', id], function(err) {
        if (err) {
            console.error(err);
        }
    });

    db.get('SELECT * FROM challenges WHERE id = ?', [id], (err, row) => {
        console.log("Row: ", row)
        if(err) {
            console.error(err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        const { challenger_team_id, challenged_team_id } = row;
        const challengerTeam = new Team();
        challengerTeam.load(challenger_team_id);
        const challengedTeam = new Team();
        challengedTeam.load(challenged_team_id);
        db.all('SELECT * FROM challenge_players WHERE challenge_id = ?', [id], async (err, rows) => {
            if(err) {
                console.error(err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                const { player_id, offense_action, defense_action, offense_target_id, defense_target_id, offense_property, defense_property } = row;
                const player = new Player();
                await player.load(player_id);
                player.setPriorities(offense_action, defense_action, offense_target_id, defense_target_id, offense_property, defense_property);
                if(row.team_id == challenger_team_id) {
                    challengerTeam.addPlayer(player);
                } else {
                    challengedTeam.addPlayer(player);
                }
            }
            const match = new Match(challengerTeam, challengedTeam, new Weather());
            await match.startGame(challengeId);

        })
    })
}
runMatch(1);
export default router;