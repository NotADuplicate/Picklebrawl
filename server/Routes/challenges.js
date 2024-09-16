import { Team } from '../Models/team.js';
import { Match } from '../Models/match.js';
import express from 'express';
import { db } from '../database.js';
import { Player } from '../Models/player.js';
import { Weather } from '../Models/Weather/weather.js';

const router = express.Router();

// Fetch all challenges
router.get('/challenges', (req, res) => {
    console.log('Getting challenges');
    const team_id = req.query.teamId;
    if (!team_id) {
        return res.status(400).json({ error: 'team_id query parameter is required' });
    }

    db.all(
        'SELECT * FROM challenges WHERE (challenger_team_id = ? OR challenged_team_id = ?) AND status = ? OR status = ?',
        [team_id, team_id, 'pending', 'accepted'],
        (err, rows) => {
            if (err) {
                console.error(err);
                res.status(500).json({ error: 'Internal server error' });
            } else {
                console.log('Challenges:', rows);
                res.json(rows);
            }
        }
    );
});

// Create a new challenge
router.post('/challenges', (req, res) => {
    const { teamId, myTeamId } = req.body;
    console.log('Creating challenge: ', myTeamId, teamId);
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
    for(let i = 0; i < players.length; i++) {
        const player = players[i];
        console.log("Challengeid: ", id, "TeamId: ", teamId, "Player: ", player)
        db.run(
            'INSERT INTO challenge_players (challenge_id, team_id, player_id) VALUES (?, ?, ?)', [id, teamId, player], function (err) {
                if (err) {
                    console.error(err);
                    res.status(500).json({ error: 'Internal server error' });
                }
            }
        );
    }
    console.log("Done adding players to challenge players")
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
            columnToUpdate = 'challenger_players_set';
        } else if (row.challenged_team_id == teamId) {
            columnToUpdate = 'challenged_players_set';
        } else {
            console.log('No matching team ID found');
            console.log('Team ID:', teamId);
            console.log('Row:', row);
            return;
        }
        console.log("Updating challenges set: ", columnToUpdate)

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
    for(let i = 0; i < players.length; i++) {
        const player = players[i];
        console.log("Challengeid: ", id, "TeamId: ", teamId, "Player: ", player)
        db.run(
            'DELETE FROM challenge_players WHERE challenge_id = ? AND team_id = ? AND player_id = ?', [id, teamId, player], function (err) {
            if (err) {
                console.error(err);
                res.status(500).json({ error: 'Internal server error' });
            }
            }
        );
    }
    console.log("Done adding players to challenge players")
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
            columnToUpdate = 'challenger_players_set';
        } else if (row.challenged_team_id == teamId) {
            columnToUpdate = 'challenged_players_set';
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
                    res.json({ id });
                }
                console.log("Updated challenge players set of team: ", columnToUpdate)
        });
    });
});

//Add actions to one side of a challenge
router.post('/challenges/:id/add-actions', (req, res) => {
    console.log("Add actions")
    const { id } = req.params;
    const { teamId, players, offenseActions, offenseTargets, defenseActions, defenseTargets } = req.body;
    console.log("Req body players: ", req.body.players)
    for(let i = 0; i < players.length; i++) {
        const player = players[i];
        console.log("Challengeid: ", id, "TeamId: ", teamId, "Player: ", player, "OffenseActions: ", offenseActions[i], "OffenseTargets: ", offenseTargets[i], "DefenseActions: ", defenseActions[i], "DefenseTargets: ", defenseTargets[i])
        db.run(
            'UPDATE challenge_players SET offense_action = ?, defense_action = ?, offense_target_id = ?, defense_target_id = ? WHERE challenge_id = ? AND player_id = ?'
            , [offenseActions[i], defenseActions[i], offenseTargets[i], defenseTargets[i], id, player], function (err) {
                if (err) {
                    console.error(err);
                    res.status(500).json({ error: 'Internal server error' });
                }
            }
        );
        db.get(
            'SELECT * FROM challenge_players WHERE challenge_id = ? AND player_id = ?',
            [id, player],
            (err, row) => {
                if (err) {
                    console.error(err);
                    res.status(500).json({ error: 'Internal server error' });
                } else {
                    console.log('Updated row:', row);
                }
            }
        );
    }
    console.log("Done adding actions to challenge players")
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
        db.get('SELECT * FROM challenges WHERE id = ?', [id], (err, row) => {
            if (err) {
                console.error('Error fetching row:', err);
                return;
            }
            if(row.challenger_players_set && row.challenged_players_set && row.challenger_actions_set && row.challenged_actions_set) {
                runMatch(row.id);
            }
        });
    });
});

router.get('/challenges/:id/players-actions', (req, res) => {
    console.log("AAAA\n\n")
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

function runMatch(id) {
    console.log("Running match ", id)
    db.all('SELECT * FROM challenges WHERE id = ?', [id], (err, row) => {
        console.log("Row: ", row)
        if(err) {
            console.error(err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        const { challenger_team_id, challenged_team_id } = row[0];
        const challengerTeam = new Team(null, null, null, challenger_team_id, false);
        const challengedTeam = new Team(null, null, null, challenged_team_id, false);
        db.all('SELECT * FROM challenge_players WHERE challenge_id = ?', [id], async (err, rows) => {
            if(err) {
                console.error(err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            //console.log("Rows: ", rows)
            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                const { player_id, offense_action, defense_action, offense_target_id, defense_target_id } = row;
                console.log(row)
                console.log(offense_target_id, defense_target_id)
                const player = new Player();
                await player.load(player_id);
                console.log(player.id, player.name, player.bulk, player.finesse, player.height, player.strength, player.trickiness, player.focus, player.quirk)
                player.setPriorities(offense_action, defense_action, offense_target_id, defense_target_id);
                console.log(player.offensePriority, player.defensePriority, player.offenseTarget, player.defenseTarget)
                if(row.team_id == challenger_team_id) {
                    console.log("Adding player to challenger team: ", player.id , '\n')
                    challengerTeam.addPlayer(player);
                } else {
                    console.log("Adding player to challenged team: ", player.id, '\n')
                    challengedTeam.addPlayer(player);
                }
            }
            const match = new Match(challengerTeam, challengedTeam, new Weather());

            for(let i = 0; i < 40; i++) {
                match.tick();
                await new Promise(r => setTimeout(r, 1000));
            }
        })
    })
}

//runMatch(1);
export default router;