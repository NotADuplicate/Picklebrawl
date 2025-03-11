import { Team } from '../Models/team.js';
import { Match } from '../Models/match.js';
import express from 'express';
import { db } from '../database.js';
import { Player } from '../Models/player.js';
import { Weather } from '../Models/Weather/weather.js';
import { authenticator } from '../Models/authenticator.js';

const router = express.Router();

// Fetch all challenges
router.get('/challenges', authenticator.authenticateToken, (req, res) => {
    console.log('Getting challenges for team: ', req.query.teamId);
    const team_id = req.query.teamId;
    if (!team_id) {
        return res.status(400).json({ error: 'team_id query parameter is required' });
    }

    db.all(
        'SELECT challenges.id AS id, status, challenger_team_id, challenged_team_id FROM challenges, teams WHERE (challenger_team_id = ? OR challenged_team_id = ?) AND (status = ? OR status = ?) AND (teams.id = ? AND teams.owner_id = ?) AND friendly = true',
        [team_id, team_id, 'pending', 'accepted', team_id, req.userId],
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
router.post('/challenges', authenticator.authenticateToken, (req, res) => {
    const { teamId, myTeamId } = req.body;
    console.log('Creating challenge: ', myTeamId, teamId);
    db.get('SELECT * FROM teams where id = ? AND owner_id = ?', [myTeamId, req.userId], (err, row) => { 
        if (err) {
            console.error(err);
            res.status(500).json({ error: 'Internal server error' });
        }
        if (!row) {
            console.log("Team not found")
            return res.status(404).json({ error: 'Team not found' });
        }
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
                        'INSERT INTO challenges (challenger_team_id, challenged_team_id, friendly) VALUES (?, ?, true)',
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
});

// Accept a challenge
router.post('/challenges/:id/accept', authenticator.authenticateToken, (req, res) => {
    const { id } = req.params;
    console.log("Player ", req.userId, " accepting challenge: ", id)
    db.get('SELECT * FROM challenges WHERE id = ?', [id], (err, challenge) => {
        console.log(err, challenge)
        if (err) {
            console.log(err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (!challenge) {
            return res.status(404).json({ error: 'Challenge not found' });
        }

        console.log("Here")
        db.get('SELECT * FROM teams WHERE id = ? AND owner_id = ?', [challenge.challenged_team_id, req.userId], (err, team) => {
            console.log("Here")
            if (err) {
                console.log(err);
                return res.status(500).json({ error: 'Internal server error' });
            }

            if (!team) {
                return res.status(404).json({ error: 'Team not found or not authorized' });
            }

            db.run(
                'UPDATE challenges SET status = ? WHERE id = ?',
                ['accepted', id],
                function (err) {
                    if (err) {
                        console.error(err);
                        res.status(500).json({ error: 'Internal server error' });
                    } else {
                        console.log("Here")
                        res.json({ id });
                    }
                }
            );
        });
    });
});

//Add players to one side of a challenge
router.post('/challenges/:id/add-players', authenticator.authenticateToken, (req, res) => {
    console.log("Add players")
    const { id } = req.params;
    const { teamId, players } = req.body;
    console.log("Req body players: ", req.body.players)
    console.log("Challenge id: ", id)

    db.get('SELECT * FROM challenges WHERE challenges.id = ?', [id], (err, row) => {
        if (err) {
            console.error('Error fetching row:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        if (!row) {
            console.error('Challenge not found');
            res.json({ error: 'Challenge not found' });
            return;
        }

        // Check which team ID matches
        let columnToUpdate;
        let teamColumnToCheck;
        if (row.challenger_team_id == teamId) {
            teamColumnToCheck = 'challenger_team_id';
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
            teamColumnToCheck = 'challenged_team_id';
        } else {
            console.log('No matching team ID found');
            console.log('Team ID:', teamId);
            console.log('Row:', row);
            return;
        }
        console.log(row)
        console.log("Updating challenges set: ", columnToUpdate)

        const getQuery = `SELECT ${columnToUpdate} FROM challenges, teams WHERE challenges.id = ? AND teams.id = ${teamColumnToCheck} AND teams.owner_id = ?`;
        db.get(getQuery, [id, req.userId], (err, row) => {
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

router.post('/challenges/:id/remove-players', authenticator.authenticateToken, (req, res) => {
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
        let teamColumnToCheck;
        if (row.challenger_team_id == teamId) {
            columnToUpdate = 'challenger_players_set';
            teamColumnToCheck = 'challenger_team_id';
            if(!row.challenger_players_set) {
                res.json({ message: 'Players already removed' });
                console.log("Challenger players already removed")
                return;
            }
        } else if (row.challenged_team_id == teamId) {
            columnToUpdate = 'challenged_players_set';
            teamColumnToCheck = 'challenged_team_id';
            if(!row.challenged_players_set) {
                res.json({ message: 'Players already removed' });
                console.log("Challenged players already removed")
                return;
            }
        } else {
            console.log('No matching team ID found');
            console.log('Team ID:', teamId);
            console.log('Row:', row);
            res.status(404).json({ error: 'No matching team ID found' });
            return;
        }
        console.log("Updating challenges set: ", columnToUpdate)

        // Update the players set column
        const query = `UPDATE challenges SET ${columnToUpdate} = ? WHERE id = ? AND ${teamColumnToCheck} = (SELECT id FROM teams WHERE id = ${teamColumnToCheck} AND owner_id = ?)`;

        db.run(query, [false, id, req.userId], function(err) {
            if (err) {
                console.error(err);
                res.status(500).json({ error: 'Internal server error' });
            } else if (this.changes === 0) {
                res.status(404).json({ error: 'Invalid request' });
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
router.post('/challenges/:id/add-actions', authenticator.authenticateToken, (req, res) => {
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
        let teamColumnToCheck;
        if (row.challenger_team_id == teamId) {
            columnToUpdate = 'challenger_actions_set';
            teamColumnToCheck = 'challenger_team_id';
        } else if (row.challenged_team_id == teamId) {
            columnToUpdate = 'challenged_actions_set';
            teamColumnToCheck = 'challenged_team_id';
        } else {
            console.log('No matching team ID found');
            console.log('Team ID:', teamId);
            console.log('Row:', row);
            res.json({ error: 'No matching team ID found' });
            return;
        }
        console.log("Updating challenges set: ", columnToUpdate)

        const getQuery = `SELECT ${columnToUpdate} FROM challenges, teams WHERE challenges.id = ? AND teams.id = ${teamColumnToCheck} AND teams.owner_id = ?`;

        db.get(getQuery, [id, req.userId], (err, row) => {
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
                            //run friendly match if all actions are set
                            if(row.challenger_players_set && row.challenged_players_set && row.challenger_actions_set && row.challenged_actions_set && row.friendly==1) {
                                runMatch(row.id, row.friendly); 
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
router.post('/challenges/:id/remove-actions', authenticator.authenticateToken, (req, res) => {
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
        let teamColumnToCheck;
        if (row.challenger_team_id == teamId) {
            columnToUpdate = 'challenger_actions_set';
            teamColumnToCheck = 'challenger_team_id';
            if(!row.challenger_actions_set) {
                res.json({ message: 'Actions already removed' });
                console.log("Challenger actions already removed")
                return;
            }
        } else if (row.challenged_team_id == teamId) {
            columnToUpdate = 'challenged_actions_set';
            teamColumnToCheck = 'challenged_team_id';
            if(!row.challenged_actions_set) {
                res.json({ message: 'Actions already removed' });
                console.log("Challenged actions already removed")
                return;
            }
        } else {
            console.log('No matching team ID found');
            console.log('Team ID:', teamId);
            console.log('Row:', row);
            res.json({ error: 'No matching team ID found' });
            return;
        }
        console.log("Updating challenges set: ", columnToUpdate)

        // Update the players set column
        const query = `UPDATE challenges SET ${columnToUpdate} = ? WHERE id = ? AND ${teamColumnToCheck} = (SELECT id FROM teams WHERE id = ${teamColumnToCheck} AND owner_id = ?)`;

        db.run(query, [false, id, req.userId], function(err) {
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

router.get('/challenges/:id/players-actions', authenticator.authenticateToken, (req, res) => {
    const { id } = req.params;
    console.log("Getting players actions for challenge: ", id)

    db.get('SELECT * FROM challenges WHERE id = ?', [id], (err, challenge) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (!challenge) {
            console.log("No challenge")
            return res.status(404).json({ error: 'Challenge not found' });
        }

        console.log("Here")
        //Get which team the user is on
        db.get('SELECT id FROM teams WHERE (id = ? OR id = ?) AND owner_id = ?', [challenge.challenger_team_id, challenge.challenged_team_id, req.userId], (err, team) => {
            if(err) {
                console.error(err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            if(!team) {
                console.log("Team not found")
                return res.status(404).json({ error: 'Team not found' });
            }
            console.log("Team: ", team)
            const teamId = team.id;

            const { challenger_players_set, challenged_players_set, challenger_actions_set, challenged_actions_set, friendly } = challenge;

            const flags = {
                challengerPlayersSet: challenger_players_set,
                challengedPlayersSet: challenged_players_set,
                challengerActionsSet: challenger_actions_set,
                challengedActionsSet: challenged_actions_set,
                friendly: challenge.friendly
            };
            let playersShown = "Self";
            if(challenger_players_set && challenged_players_set && challenger_actions_set && challenged_actions_set) {
                playersShown = "All";
            }
            else if(challenger_players_set && challenged_players_set) {
                playersShown = "Players";
            }
    
            let query;
            if (playersShown === "All") {
                query = 'SELECT * FROM challenge_players WHERE challenge_id = ?';
            } else if (playersShown === "Players") {
                query = `SELECT player_id, team_id, NULL as offense_action, NULL as defense_action, NULL as offense_target_id, NULL as defense_target_id, NULL as offense_property, NULL as defense_property FROM challenge_players WHERE challenge_id = ? AND team_id IS NOT ${teamId}
                UNION SELECT player_id, team_id, offense_action, defense_action, offense_target_id, defense_target_id, offense_property, defense_property FROM challenge_players WHERE challenge_id = ${id} AND team_id = ${teamId}`;
            } else {
                query = `SELECT player_id FROM challenge_players WHERE challenge_id = ? AND team_id = ${teamId}`;
            }

            db.all(query, [id], (err, rows) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: 'Internal server error' });
                }
                //console.log("Challenge players: ", rows)
                res.json({ flags, playersActions: rows });
            });
        });
    });
});

// Get quirk effects for all players in a challenge
router.post('/challenges/:id/quirk-effects', (req, res) => {
    console.log("Req: ", req.body.players)
    const playerDicts = req.body.players;
    let players = [];
    Promise.all(playerDicts.map((playerDict, index) => {
        const player = new Player();
        return player.load(playerDict.id).then(() => {
            player.setPriorities(playerDict.offensePriority, playerDict.defensePriority, playerDict.offenseTargetId, playerDict.defenseTargetId)
            players.push(player);
        });
    })).then(() => {
        players = players.filter(player => player.quirk.title !== "Ghost");
        players.sort((a, b) => a.quirk.START_EFFECT_ORDER - b.quirk.START_EFFECT_ORDER);
        players.forEach(player => {
            console.log(player.name, player.quirk.title)
            player.quirk.challengeStatModification(players, player);
        });
        res.json(players);
    });
});

// Get quirk actions for all players in a challenge
router.post('/challenges/quirk-actions/:id', (req, res) => {
    console.log("Getting quirk action")
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

router.get('/challenges/:id/recommend-players', (req, res) => {
    const { id: teamId } = req.params;
    console.log("Getting recommended players for team: ", teamId);
    if (!teamId) {
        return res.status(400).json({ error: 'teamId query parameter is required' });
    }
    db.all("SELECT * FROM players where team_id = ?", [teamId], (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        const selectedPlayers = recommendPlayers(rows);

        res.json(Array.from(selectedPlayers));
    });
});

router.get('/challenges/:id/recommend-actions', (req, res) => {
    const { id: teamId } = req.params;
    console.log("Getting recommended players for team: ", teamId);
    if (!teamId) {
        return res.status(400).json({ error: 'teamId query parameter is required' });
    }
    db.all("SELECT * FROM challenge_players, players where players.team_id = ? AND players.id = player_id", [teamId], (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        
        const actions = recommendActions(rows);
        res.json(actions);
    });
});

export function runMatch(challengeId, friendly) {
    console.log("RUNNINGs")
    let id = challengeId;
    let type;

    if(!friendly) {
        type = 'league';
    } else {
        type = 'friendly';
    }
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
                console.log("Awaiting player load")
                await player.load(player_id);
                player.setPriorities(offense_action, defense_action, offense_target_id, defense_target_id, offense_property, defense_property);
                if(row.team_id == challenger_team_id) {
                    challengerTeam.addPlayer(player);
                } else {
                    challengedTeam.addPlayer(player);
                }
            }
            const match = new Match(challengerTeam, challengedTeam, new Weather(), type);
            await match.startGame(challengeId, type);

        })
    })
}

export function recommendPlayers(teamPlayers) {
    const players = teamPlayers.map(row => ({
        id: row.id,
        finesse: row.finesse,
        height: row.height,
        bulk: row.bulk,
        strength: row.strength
    }));
    console.log("Players for recommending: ", players)

    const highestFinesse = players.reduce((max, player) => player.finesse > max.finesse ? player : max, players[0]);
    const highestHeight = players.reduce((max, player) => player.height > max.height ? player : max, players[0]);
    const highestBulk = players.reduce((max, player) => player.bulk > max.bulk ? player : max, players[0]);
    const highestStrength = players.reduce((max, player) => player.strength > max.strength ? player : max, players[0]);

    const selectedPlayers = new Set([highestFinesse.id, highestHeight.id, highestBulk.id, highestStrength.id]);

    if (selectedPlayers.size < 4) {
        const remainingPlayers = players.filter(player => !selectedPlayers.has(player.id));
        remainingPlayers.sort((a, b) => b.finesse - a.finesse || b.strength - a.strength);
        for (const player of remainingPlayers) {
            if (selectedPlayers.size < 4) {
                selectedPlayers.add(player.id);
            } else {
                break;
            }
        }
    }
    return selectedPlayers;
}

export function recommendActions(challengePlayers) {
    const actions = challengePlayers.map(row => ({
        player_id: row.player_id,
        offense_action: row.offense_action,
        offense_target_id: row.offense_target_id,
        offense_property: row.offense_property,
        defense_action: row.defense_action,
        defense_target_id: row.defense_target_id,
        defense_property: row.defense_property
    }));
    const highestStrength = challengePlayers.reduce((max, player) => player.strength > max.strength ? player : max, challengePlayers[0]);
    const highestFinesse = challengePlayers.reduce((max, player) => {
        if (player.player_id === highestStrength.player_id) {
        return max;
        }
        return player.finesse > max.finesse ? player : max;
    }, challengePlayers[0]);
    const highestBulk = challengePlayers.reduce((max, player) => player.bulk > max.bulk ? player : max, challengePlayers[0]);
    const highestHeight = challengePlayers.reduce((max, player) => {
        if (player.player_id === highestBulk.player_id) {
        return max;
        }
        return player.height > max.height ? player : max;
    }, challengePlayers[0]);

    const offenseMap = new Map();
    const defenseMap = new Map();
    offenseMap.set(highestStrength.player_id, "Advance");
    actions.find(action => action.player_id === highestStrength.player_id).offense_property = "Blitz";
    offenseMap.set(highestFinesse.player_id, "Score");
    actions.find(action => action.player_id === highestFinesse.player_id).offense_property = "Medium";
    defenseMap.set(highestBulk.player_id, "Defend_Advance");
    defenseMap.set(highestHeight.player_id, "Defend_Score");

    challengePlayers.forEach(player => {
        if(!offenseMap.has(player.player_id)) {
            if(Math.random() < 0.3) {
                offenseMap.set(player.player_id, "Rest");
            }
            else if (player.finesse > player.strength) {
                offenseMap.set(player.player_id, "Assist");
                const targetPlayerId = Math.random() > 0.5 ? highestStrength.player_id : highestFinesse.player_id;
                actions.find(action => action.player_id === player.player_id).offense_target_id = targetPlayerId;
            } else {
                offenseMap.set(player.player_id, "Attack");
                actions.find(action => action.player_id === player.player_id).offense_property = "Any";
            }
        }
        if(!defenseMap.has(player.player_id)) {
            if(Math.random() < 0.3 && offenseMap.get(player.player_id) !== "Rest") {
                defenseMap.set(player.player_id, "Rest");
            }
            else if (player.finesse > player.strength) {
                defenseMap.set(player.player_id, "Assist");
                const targetPlayerId = Math.random() > 0.5 ? highestBulk.player_id : highestHeight.player_id;
                actions.find(action => action.player_id === player.player_id).defense_target_id = targetPlayerId;
            } else {
                defenseMap.set(player.player_id, "Attack");
                actions.find(action => action.player_id === player.player_id).defense_property = "Any";
            }
        }
    });
    actions.forEach(action => {
        action.offense_action = offenseMap.get(action.player_id);
        action.defense_action = defenseMap.get(action.player_id);
    });
    console.log("Reccomended: ", actions)
    return actions;
}

function rerunMatch(match_id, friendly) {
    const tables = [
        'advancement_history',
        'player_history',
        'attack_history',
        'match_action_history',
        'match_ticks_history',
        'match_trick_history',
        'scoring_history'
    ];
    console.log("Rerunning match")

    const deletePromises = tables.map(table => {
        return new Promise((resolve, reject) => {
            db.run(`DELETE FROM ${table} WHERE match_id = ?`, [match_id], function(err) {
                if (err) {
                    console.error(`Error deleting from ${table}:`, err.message);
                    reject(err);
                } else {
                    console.log(`Deleted rows from ${table} where match_id = ${match_id}`);
                    resolve();
                }
            });
        });
    });

    Promise.all(deletePromises)
        .then(() => {
            // Retrieve the challenge_id before deleting the match_history row
            db.get(`SELECT challenge_id FROM match_history WHERE id = ?`, [match_id], function(err, row) {
                if (err) {
                    console.error(`Error retrieving challenge_id from match_history:`, err.message);
                } else if (row) {
                    const challenge_id = row.challenge_id;
                    console.log(`Challenge ID of the match to be deleted: ${challenge_id}`);

                    // Delete the row from match_history where id equals match_id
                    db.run(`DELETE FROM match_history WHERE id = ?`, [match_id], function(err) {
                        if (err) {
                            console.error(`Error deleting from match_history:`, err.message);
                        } else {
                            console.log(`Deleted row from match_history where id = ${match_id}`);
                            console.log(`Challenge ID of the deleted match: ${challenge_id}`);
                            runMatch(challenge_id, friendly);
                        }
                    });
                } else {
                    console.error(`No match found with id = ${match_id}`);
                }
            });
        })
        .catch(err => {
            console.error('Error during deletion process:', err);
        });
}

runMatch(23, false);

export default router;