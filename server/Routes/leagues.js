import { Team } from '../Models/team.js';
import express from 'express';
import { db } from '../database.js';
import { Draft } from '../Models/draft.js';
import { Season } from '../Models/season.js';
import { authenticator } from '../Models/authenticator.js';
import moment from 'moment-timezone';
import { Player } from '../Models/player.js';

const router = express.Router();

console.log('Loading leagues routes');

const insertTeam = (teamName, leagueId, owner_id, callback) => {
    console.log('Inserting team:', teamName, leagueId, owner_id);
    const team = new Team();
    team.setInfo(teamName, owner_id, leagueId);
    team.save(callback);
};

router.post('/create-league', authenticator.authenticateToken, (req, res) => {
    const { leagueName, leaguePassword, teamName } = req.body;
    console.log('Creating league:', leagueName, leaguePassword, teamName);

    const founderId = req.userId;
    console.log('Founder ID:', founderId);
    db.run(`INSERT INTO leagues (name, password, founder_id, started) VALUES (?, ?, ?, ?)`, [leagueName, leaguePassword, founderId, false], function(err) {
        if (err) {
            return res.status(400).json({ message: 'Error creating league!' });
        }
        const leagueId = this.lastID; 
        db.run(`INSERT INTO league_users (league_id, user_id) VALUES (?, ?)`, [leagueId, founderId], (err) => {
            if (err) {
                return res.status(400).json({ message: 'Error joining league!' });
            }
            console.log('League ID:', leagueId);

            insertTeam(teamName, leagueId, founderId, (err) => {
                if (err) {
                    return res.status(400).json({ message: 'Error creating team!' });
                }
                res.json({ message: 'League and team created successfully!' });
            });
        });
    });
});

router.post('/join-league', authenticator.authenticateToken, (req, res) => {
    const { leagueName, leaguePassword, teamName } = req.body;

    const joinerId = req.userId;
    db.get(`SELECT * FROM leagues WHERE name = ?`, [leagueName], (err, league) => {
        if (err || !league) {
            return res.status(400).json({ message: 'League does not exist!' });
        }

        if (league.password !== leaguePassword) {
            return res.status(400).json({ message: 'Incorrect league password!' });
        }


        insertTeam(teamName, league.id, joinerId, (err) => {
            if (err) {
                console.log("Error creating team: ", err)
                return res.status(400).json({ message: 'Error creating team!' });
            }
            db.run(`INSERT INTO league_users (league_id, user_id) VALUES (?, ?)`, [league.id, joinerId], (err) => {
                if (err) {
                    console.log(err);
                    return res.status(400).json({ message: 'Error joining league!' });
                }
                res.json({ message: 'Joined league and created team successfully!' });
            });
        });
    });
});

router.get('/leagues', authenticator.authenticateToken, (req, res) => {
    console.log("Getting leagues for user id:", req.userId);
    const { leagueName } = req.query;
    let query = `
        SELECT leagues.id, leagues.name AS leagueName, leagues.started, username AS founder
        FROM leagues
        LEFT JOIN league_users ON leagues.id = league_users.league_id
        LEFT JOIN users ON leagues.founder_id = users.id
        WHERE league_users.user_id = ${req.userId}
    `;
    let params = [];

    if (leagueName) {
        query += ' AND leagues.name = ?';
        params.push(leagueName);
    }

    query += ' GROUP BY leagues.id';

    db.all(query, params, (err, rows) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ message: 'Error fetching leagues!' });
        }
        console.log("Leagues:", rows);
        // Transform the players from a comma-separated string to an array
        const leagues = rows.map(row => ({
            ...row,
            players: row.players ? row.players.split(',') : []
        }));
        res.json(leagues);
    });
});

router.post('/start-league', authenticator.authenticateToken, (req, res) => {
    console.log("Starting league")
    const { leagueName, startTime, draftTimeValue, friendlyTickValue, competitiveTickValue } = req.body;
    db.get(`SELECT * FROM leagues WHERE name = ?`, [leagueName], (err, league) => {
        if (err || !league) {
            console.log("Error or no league avilable: ", err);
            return res.status(400).json({ message: 'League does not exist!' });
        }

        if (league.founder_id != req.userId) {
            console.log('Only the founder can start the league!', league.founder_id, req.userId);
            return res.status(400).json({ message: 'Only the founder can start the league!' });
        }

        if(league.started) {
            console.log('League already started!');
            return res.status(400).json({ message: 'League already started!' });
        }

        db.run(`UPDATE leagues SET started = ?, draft_timer_mins = ?, friendly_tick_secs = ?, competitive_tick_secs = ? WHERE id = ?`, [true, draftTimeValue, friendlyTickValue, competitiveTickValue, league.id], (err) => {
            if (err) {
                return res.status(400).json({ message: 'Error starting league!' });
            }
            res.json({ message: 'League started successfully!' });
        });

        db.run(`UPDATE teams SET in_season = ? WHERE league_id = ?`, [true, league.id], (err) => {
            if (err) {
                console.log('Error updating teams:', err);
            }

            const season = new Season(league.id);
            console.log("Start time: ", startTime);
            season.setMatches(new Date(startTime), (err) => {
                if (err) {
                    console.log(err);
                }
            });
            const draft = new Draft(league.id);
        });
    });
});

router.get('/matches', (req, res) => {
    console.log("Getting matches for league id:", req.query.leagueId);
    const { leagueId } = req.query;
    // Get the current time in EST
    const nowEST = moment().tz("America/New_York").format("YYYY-MM-DD HH:mm:ss");
    console.log("Now EST: ", nowEST)
    let query = `
        SELECT 
            DISTINCT match_history.id, 
            created_at, 
            home_team.name AS home_team_name, 
            away_team.name AS away_team_name, 
            home_team_score, 
            away_team_score,
            type,
            (strftime('%s', 'now') - strftime('%s', created_at)) > 101*friendly_tick_secs AS is_over,
            SUM(CASE WHEN scoring_history.team_id = home_team.id THEN scoring_history.successful_score * (scoring_history.points_worth) ELSE 0 END) AS home_team_live_score,
            SUM(CASE WHEN scoring_history.team_id = away_team.id THEN scoring_history.successful_score * (scoring_history.points_worth) ELSE 0 END) AS away_team_live_score
        FROM 
            match_history
        JOIN 
            teams AS home_team ON home_team_id = home_team.id
        JOIN 
            teams AS away_team ON away_team_id = away_team.id
        JOIN
            leagues ON match_history.league_id = leagues.id
        LEFT JOIN
            scoring_history ON match_history.id = scoring_history.match_id AND scoring_history.tick*friendly_tick_secs < (strftime('%s', 'now') - strftime('%s', created_at))
        WHERE 
            match_history.league_id = ?
        GROUP BY 
            match_history.id
        ORDER BY
            created_at DESC
    `;

    db.all(query, [leagueId], (err, matches) => {
        if ("Error getting matches:",err) {
            console.log(err);
            return res.status(500).json({ message: 'Error fetching matches!' });
        }
        res.json(matches);
    });
});

router.get('/league/drafts', (req, res) => {
    const { leagueId } = req.query;
    console.log("Checking for active draft in league id:", leagueId);

    db.all(`SELECT * FROM drafts WHERE league_id = ? AND active = 1`, [leagueId], (err, draft) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ message: 'Error checking for active draft!' });
        }

        if (!draft) {
            return res.json([]);
        }

        res.json(draft);
    });
});

router.get('/league/upcoming', authenticator.authenticateToken, (req, res) => {
    const { leagueId } = req.query;
    console.log("Getting upcoming matches for league id:", leagueId);

    // Get the current time in EST
    const nowEST = moment().tz("America/New_York").format("YYYY-MM-DD HH:mm:ss");
    console.log("Now EST: ", nowEST)
    db.all(`SELECT my_team.id AS my_team_id, happening_at, challenger_team_id, challenged_team_id, challenges.id AS challenge_id, challenger.name AS challenger_name, challenged.name AS challenged_name
        FROM challenges, teams AS challenger, teams AS challenged, teams AS my_team WHERE challenger_team_id = challenger.id AND challenged_team_id = challenged.id
        AND my_team.owner_id = ? AND challenges.league_id = ? AND challenges.status = 'upcoming'
        AND (strftime('%s', happening_at) - strftime('%s', ?)) > 0`, [req.userId, leagueId, nowEST], (err, matches) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ message: 'Error fetching upcoming matches!' });
        }

        console.log("Matches:",matches)
        res.json(matches);
    });
});

router.get(`/league/league-stats/:leagueId`, (req, res) => {
    const leagueId = req.params.leagueId;

    console.log("Getting stats of league:", leagueId)
    console.log("League ID from params:", leagueId);
    db.all(`SELECT players.name AS player_name, teams.name AS team, 
        COALESCE(SUM(field_goals_attempted),0) AS total_FG_attempts, COALESCE(AVG(field_goals_attempted),0) AS avg_FG_attempts,
        COALESCE(SUM(field_goals_successful),0) AS total_FG_makes, COALESCE(AVG(field_goals_successful),0) AS avg_FG_makes,
        COALESCE(SUM(blitz_goals_attempted),0) AS total_blitz_attempts, COALESCE(AVG(blitz_goals_attempted),0) AS avg_blitz_attempts,
        COALESCE(SUM(blitz_goals_successful),0) AS total_blitz_makes, COALESCE(AVG(blitz_goals_successful),0) AS avg_blitz_makes,
        COALESCE(SUM(points_scored),0) AS total_points, COALESCE(AVG(points_scored),0) AS avg_points,
        COALESCE(SUM(advancements),0) AS total_advance, COALESCE(AVG(advancements),0) AS avg_advance,
        COALESCE(SUM(defense),0) AS total_defense, COALESCE(AVG(defense),0) AS avg_defense,
        COALESCE(SUM(points_blocked),0) AS total_blocks, COALESCE(AVG(points_blocked),0) AS avg_blocks,
        COALESCE(SUM(damage),0) AS total_dmg, COALESCE(AVG(damage),0) AS avg_dmg, COUNT(*) AS matches_played,
        COALESCE(SUM(steals),0) AS total_steals, COALESCE(AVG(steals),0) as avg_steals
        FROM players JOIN teams on players.team_id = teams.id
        LEFT JOIN match_stats ON player_id = players.id
        WHERE teams.league_id = ?
        AND match_stats.match_type != "friendly" AND match_stats.season = (SELECT season FROM leagues WHERE leagues.id = ?)
        GROUP BY players.id
        `, [leagueId, leagueId], (err, rows) => {
            if(err) {
                console.log("Error getting player stats:", err)
            }
            res.json({ rows })
        })
})

router.get(`/leagues/tournament/:leagueId`, async (req, res) => {
    const leagueId = req.params.leagueId;
    db.all(`SELECT first_team.name AS first_team, second_team.name AS second_team, num_games, tournament_match, tournament_round, 
        winning_team_id, first_team.id AS first_team_id, second_team.id AS second_team_id,
        (SELECT json_group_array(json_object(
            'challenge_id', c.id,
            'match_id', match_history.id,
            'status', c.status,
            'match', c.tournament_match,
            'happening_at', c.happening_at,
            'home_team', home_team_id,
            'home_team_score', home_team_score,
            'away_team_score', away_team_score
        )) FROM challenges c LEFT JOIN match_history ON challenge_id= c.id WHERE c.tournament_match = tournament_matches.id) AS challenges
        FROM tournament_matches 
        LEFT JOIN teams AS first_team ON tournament_matches.first_team_id = first_team.id 
        LEFT JOIN teams AS second_team ON tournament_matches.second_team_id = second_team.id 
        WHERE tournament_matches.league_id=? ORDER BY tournament_match`, [leagueId], (err, rows) => {
        //console.log("Tournament match data:", rows);
        if(err) {
            console.log("Error getting tournament:", err)
        }
        res.json({rows});
    })
})

setTimeout(() => {
    const season = new Season(1);
    //season.scheduleOnStartup();
    //season.createTournament(() => {season.scheduleTournamentMatches(1,1)});
}, 1000);



export default router;