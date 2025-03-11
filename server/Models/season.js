import { db } from '../database.js';
import { scheduleJob } from "node-schedule";
import { runMatch, recommendActions, recommendPlayers } from "../Routes/challenges.js";
import { BracketsManager } from 'brackets-manager';
import { InMemoryDatabase } from 'brackets-memory-db';
import moment from 'moment-timezone';

export class Season {
    leagueId;

    constructor(leagueId) {
        this.leagueId = leagueId;
    }

    /**
     * Schedules challenges such that each team plays exactly 7 games (one per day)
     * across 7 days. The first game is scheduled at firstGameTime. Within each day,
     * scheduled challenges are spaced 5 minutes apart.
     *
     * @param {string|Date} firstGameTime - the date/time for the first game (day 0)
     * @param {function(Error, any):void} callback
     */
    setMatches(firstGameTime, callback) {
        console.log("Setting matches for league id:", this.leagueId);
        if (!this.leagueId) {
            return callback(new Error("leagueId is not set"));
        }

        // Retrieve all teams in the league
        db.all("SELECT id FROM teams WHERE league_id = ?", [this.leagueId], (err, teams) => {
            if (err) {
                return callback(err);
            }

            // Sort team IDs for consistent ordering.
            teams.sort((a, b) => a.id - b.id);
            const teamIds = teams.map(team => team.id);

            const schedule = this.createGameSchedule(teamIds, 7, { startingRound: 1, startDate: firstGameTime });
            
            // Insert the scheduled challenges sequentially.
            let pending = schedule.length;
            const self = this;
            db.serialize(() => {
                schedule.forEach(({ challenger_team_id, challenged_team_id, happening_at }) => {
                    db.run(
                      `INSERT INTO challenges 
                       (challenger_team_id, challenged_team_id, status, happening_at, friendly, league_id) 
                       VALUES (?, ?, 'upcoming', ?, false, ?)`,
                      [challenger_team_id, challenged_team_id, happening_at, this.leagueId],
                      function(insertErr) {
                        if (insertErr) {
                          console.error("Error creating challenge:", insertErr.message);
                          console.log("challenger_team_id:", challenger_team_id);
                        } else {
                          console.log("Challenge created with ID:", this);
                          self.scheduleMatch(happening_at, this.lastID, runMatch);
                        }
                        pending--;
                      }
                    );
                });
            });

            // Poll until all asynchronous db.run calls have finished.
            const checkInterval = setInterval(() => {
                if (pending === 0) {
                    clearInterval(checkInterval);
                    callback(null, "Challenges created");
                }
            }, 50);
        });
    }
    
    createGameSchedule(teamIds, desiredGames, options = {}) {
      // Optional parameters: startingRound and startDate.
      const startingRound = options.startingRound !== undefined ? options.startingRound : 1;
      const startDate = options.startDate ? new Date(options.startDate) : new Date();
    
      // Initialize game counts for each team.
      const teamGameCounts = {};
      teamIds.forEach(id => {
        teamGameCounts[id] = 0;
      });
    
      // Map to track repeated pairings.
      const pairingCounts = {};
      function getPairKey(a, b) {
        return a < b ? `${a}-${b}` : `${b}-${a}`;
      }
    
      // Track the last round each team played.
      // A value of 0 means the team has not yet played.
      const lastRoundPlayed = {};
      teamIds.forEach(id => {
        lastRoundPlayed[id] = 0;
      });
    
      const schedule = [];
      let currentDayStart = new Date(startDate);
      let round = startingRound;
    
      // Continue scheduling while at least two teams still need games.
      while (teamIds.filter(id => teamGameCounts[id] < desiredGames).length >= 2) {
        // All teams that still need games.
        const availableTeams = teamIds.filter(id => teamGameCounts[id] < desiredGames);
        // Set to track teams scheduled for the current round.
        const scheduledThisRound = new Set();
        const roundMatches = [];
    
        // Sort available teams by "idle" value (how many rounds since they last played),
        // so that teams who haven't played in a while get priority.
        const sortedTeams = availableTeams.slice().sort((a, b) => {
          return (round - lastRoundPlayed[b]) - (round - lastRoundPlayed[a]);
        });
    
        // Iterate over teams, trying to pair each with an opponent.
        for (let i = 0; i < sortedTeams.length; i++) {
          const teamA = sortedTeams[i];
          if (scheduledThisRound.has(teamA)) continue;
    
          // Get candidate opponents from the rest of the sorted list that aren't scheduled yet.
          const candidates = sortedTeams.slice(i + 1).filter(team => !scheduledThisRound.has(team));
    
          if (candidates.length === 0) continue;
    
          // Prefer candidates that did not play in the previous round.
          let filteredCandidates = candidates.filter(team => lastRoundPlayed[team] < round - 1);
          // If none qualify, fall back to all available candidates.
          if (filteredCandidates.length === 0) {
            filteredCandidates = candidates;
          }
    
          // Select the candidate with the fewest repeat matchups with teamA.
          let candidate = null;
          let candidatePairingCount = Infinity;
          for (const teamB of filteredCandidates) {
            const key = getPairKey(teamA, teamB);
            const count = pairingCounts[key] || 0;
            if (count < candidatePairingCount) {
              candidate = teamB;
              candidatePairingCount = count;
            }
          }
    
          if (candidate !== null) {
            // Schedule the match.
            roundMatches.push({
              challenger_team_id: teamA,
              challenged_team_id: candidate,
              round: round
            });
            // Update game counts.
            teamGameCounts[teamA]++;
            teamGameCounts[candidate]++;
            // Update pairing counts.
            const key = getPairKey(teamA, candidate);
            pairingCounts[key] = (pairingCounts[key] || 0) + 1;
            // Mark these teams as scheduled this round.
            scheduledThisRound.add(teamA);
            scheduledThisRound.add(candidate);
            // Record that they played in this round.
            lastRoundPlayed[teamA] = round;
            lastRoundPlayed[candidate] = round;
          }
        }
    
        // If no matches were scheduled this round, break to avoid an infinite loop.
        if (roundMatches.length === 0) break;
    
        // Assign game times: first match at currentDayStart; subsequent matches 5 minutes apart.
        let matchTime = new Date(currentDayStart);
        roundMatches.forEach(match => {
          match.happening_at = matchTime.toISOString();
          matchTime = new Date(matchTime.getTime() + 300000); // advance 5 minutes
        });
    
        // Add round matches to overall schedule.
        schedule.push(...roundMatches);
    
        // Prepare for the next round: next day starts exactly 24 hours later.
        currentDayStart = new Date(currentDayStart.getTime() + 24 * 60 * 60 * 1000);
        round++;
      }
    
      console.log("Schedule created:", schedule);
      return schedule;
    }
    
    scheduleMatch(happening_at, challenge_id, runMatch) {
      const estCurrentTime = moment().tz("America/New_York").format("YYYY-MM-DD HH:mm:ss");
      console.log(`Current time (EST): ${estCurrentTime}`);
      const estTime = moment.tz(happening_at, "America/New_York").toDate();
      const now = new Date();
      console.log(`Scheduling match for challenge ${challenge_id} at ${estTime}`);
      console.log(`Time until run match: ${Math.floor((estTime-now) / 1000 / 60)} minutes`);
      if(estTime < now) {
        console.log("Match passed \n")
        return;
      }
      
      // Schedule the job for the exact happening_at time.
      const self = this;
      scheduleJob(estTime, async function() {
        try {
          console.log(`Running match for challenge ${challenge_id}`);
          self.verifyMatch(challenge_id, async () => {
            await runMatch(challenge_id, false);
          });
        } catch (err) {
          console.error(`Error processing challenge ${challenge_id}:`, err);
        }
      });

      const happeningAtEST = moment.tz(happening_at, "America/New_York").toDate();
      const verifyPlayersTime = new Date(happeningAtEST.getTime() - 90 * 60 * 1000);
      console.log("Going to verify players at time (EST): ", verifyPlayersTime);

      const timeUntilVerify = verifyPlayersTime - now;
      console.log(`Time until verify players: ${Math.floor(timeUntilVerify / 1000 / 60)} minutes`);
      scheduleJob(verifyPlayersTime, async function() {
        try {
          console.log(`Verifying players set for challenge ${challenge_id}`);
          self.verifyPlayersSet(challenge_id);
        } catch (err) {
          console.error(`Error verifying players for challenge ${challenge_id}:`, err);
        }
      });
      
    }

    verifyMatch(challenge_id, callback) {
      db.get(`SELECT * FROM challenges WHERE id = ?`, [challenge_id], async (err, challenge) => {
        if (err) {
          console.error(`Error fetching challenge ${challenge_id}:`, err);
          return;
        }
        if(!challenge) {
          console.error(`Challenge ${challenge_id} not found.`);
          return;
        }
        if (challenge.status !== "upcoming") {
          console.log(`Challenge ${challenge_id} is not upcoming; skipping.`);
          return;
        }
        let problems = 0;
        if(challenge.challenger_actions_set === 0) {
          problems++;
          this.setActions(challenge_id, challenge.challenger_team_id, () => {
            problems--;
            db.run(`UPDATE challenges SET challenger_actions_set=TRUE WHERE id=${challenge_id}`, (err) => {
              if(err) {
                console.log("Error updating challenger players set:", err);
              }
              else {
                console.log("Updated challenger players set!")
              }
            });
          });
        }
        if(challenge.challenged_actions_set === 0) {
          problems++;
          this.setActions(challenge_id, challenge.challenged_team_id, () => {
            problems--;
            db.run(`UPDATE challenges SET challenger_actions_set=TRUE WHERE id=${challenge_id}`, (err) => {
              if(err) {
                console.log("Error updating challenger players set:", err);
              }
              else {
                console.log("Updated challenger players set!")
              }
            });
          });
        }
        const checkInterval = setInterval(() => {
          if (problems === 0) {
            clearInterval(checkInterval);
            callback();
          }
        }, 50);  });
    }

    verifyPlayersSet(challenge_id) {
      db.get(`SELECT * FROM challenges WHERE id = ?`, [challenge_id], async (err, challenge) => {
        if (err) {
          console.error(`Error fetching challenge ${challenge_id}:`, err);
          return;
        }
        if(!challenge) {
          console.error(`Challenge ${challenge_id} not found.`);
          return;
        }
        if (challenge.status !== "upcoming") {
          console.log(`Challenge ${challenge_id} is not upcoming; skipping.`);
          return;
        }
        if(challenge.challenger_players_set === 0) {
          this.setPlayers(challenge_id, challenge.challenger_team_id, () => {
            console.log("Set players")
            db.run(`UPDATE challenges SET challenger_players_set=TRUE WHERE id=${challenge_id}`, (err) => {
              if(err) {
                console.log("Error updating challenger players set:", err);
              }
              else {
                console.log("Updated challenger players set!")
              }
            });
          });
        }
        if(challenge.challenged_players_set === 0) {
          this.setPlayers(challenge_id, challenge.challenged_team_id, () => {
            console.log("Set players")
            db.run(`UPDATE challenges SET challenged_players_set=TRUE WHERE id=${challenge_id}`, (err) => {
              if(err) {
                console.log("Error updating challenged players set:", err);
              }
              else {
                console.log("Updated challenged players set!")
              }
            });
          });
        }
      });
    }

    setActions(challenge_id, team_id, callback) {
      db.all("SELECT * FROM challenge_players, players where challenge_players.team_id = ? AND players.id = challenge_players.player_id AND challenge_id=?", [team_id, challenge_id], (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        const actions = recommendActions(rows);
        const actionArray = [...actions];
        let pending = actionArray.length;
        db.serialize(() => {
          actions.forEach((action) => {
            console.log("Inserting action:", action);
            db.run(
            `UPDATE challenge_players SET offense_action = ?, offense_target_id = ?, offense_property = ?, defense_action = ?, defense_target_id = ?, defense_property = ? 
              WHERE player_id = ? AND challenge_id = ? AND team_id=?`,
            [action.offense_action, action.offense_target_id, action.offense_property, action.defense_action, action.defense_target_id, action.defense_property, action.player_id, challenge_id, team_id], (err) => {
              pending--;
              if (err) {
                console.error("Error creating action:", err);
              }
              if(pending == 0) {
                callback();
              } 
            });
          });
        });
      });
    }

    setPlayers(challenge_id, team_id, callback) {
      db.all("SELECT * FROM players where team_id = ?", [team_id], (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        const players = recommendPlayers(rows);
        const playersArray = [...players];
        let pending = playersArray.length;
        console.log("Pending start:", pending)
        db.serialize(() => {
          playersArray.forEach((player) => {
            console.log("Inserting player:", player);
            db.run(
            'INSERT INTO challenge_players (challenge_id, team_id, player_id) VALUES (?, ?, ?)', [challenge_id, team_id, player], function (err) {
              pending--;
              console.log("Pending:", pending)
              if (err) {
                console.error("Error creating player:", err);
              }
              if (pending === 0) {
                console.log("No more pending")
                callback();
              }
            });
          });
        });
      });
    }

    scheduleOnStartup() {
      db.all(`SELECT * from challenges where status = "upcoming"`, (err, rows) => {
        if(err) {
          console.log("Error scheduling on startup, row: ",rows, " err: ", err)
        }
        else {
          rows.forEach(row => {
            this.scheduleMatch(row.happening_at, row.id, runMatch);
          });
        }
      })
    }

    getNearestPowerOfTwo(input) {
      return Math.pow(2, Math.ceil(Math.log2(input)));
    }

    /**
     * Generates a tournament bracket based on the match history.
     * Seeds teams based on their wins and losses.
     *
     * @param {function(Error, any):void} callback
     */
    generateTournamentBracket(callback) {
        console.log("Generating tournament bracket for league id:", this.leagueId);
        if (!this.leagueId) {
            return callback(new Error("leagueId is not set"));
        }

        // Retrieve all teams in the league along with their win/loss records
        db.all(`
            SELECT teams.id, teams.name, 
             SUM(CASE WHEN (match_history.home_team_id = teams.id AND match_history.home_team_score > match_history.away_team_score)
            OR (match_history.away_team_id = teams.id AND match_history.home_team_score < match_history.away_team_score) THEN 1 ELSE 0 END) AS wins,
             SUM(CASE WHEN (match_history.home_team_id = teams.id AND match_history.home_team_score > match_history.away_team_score)
            OR (match_history.away_team_id = teams.id AND match_history.home_team_score < match_history.away_team_score) THEN 0 ELSE 1 END) AS losses
            FROM teams
            LEFT JOIN match_history ON teams.id IN (match_history.home_team_id, match_history.away_team_id)
            WHERE teams.league_id = ?
            GROUP BY teams.id
            ORDER BY (wins * 1.0) / (wins + losses + 1) DESC
        `, [this.leagueId], async (err, teams) => {
            if (err) {
              console.log(err)
                return callback(err);
            }
            

            // Seed teams based on their win/loss records
            const seededTeams = teams.map((team, index) => ({
                seed: index + 1,
                teamId: team.id,
                teamName: team.name,
                wins: team.wins,
                losses: team.losses,
                ratio: team.wins/(team.wins+team.losses+1)
            }));
            console.log("Seeded teams:", seededTeams)

            const jDb = new InMemoryDatabase()
            const manager = new BracketsManager(jDb);

            // Generate the bracket structure
            await manager.create.stage({
              tournamentId: 1,
              name: 'Season 1 Playoffs',
              type: 'single_elimination',
              seeding: teams.map((team) => team.name),
              settings: {
                seedOrdering: ['inner_outer'],
                size: this.getNearestPowerOfTwo(teams.length),
              },
            });
            
            await manager.update.match({
              id: 1,
              opponent1: { score: 5 , result:"win"},
              opponent2: { score: 1, result:"loss" },
            });
            await manager.update.match({
              id: 2,
              opponent1: { score: 3, result:"loss" },
              opponent2: { score: 9, result:"win" },
            });

            const data = await manager.get.stageData(0);
            console.log("Tournament data:",data);
            const realDats = {
              stages: data.stage,
              matches: data.match,
              matchGames: data.match_game,
              participants: data.participant,
            };
            console.log("Real dat:",realDats)
            callback(realDats)
            return realDats;

            // Insert the bracket into the database
            let pending = bracket.length;
            db.serialize(() => {
                bracket.forEach(({ round, matchNumber, teamA, teamB }) => {
                    db.run(
                        `INSERT INTO tournament_challenges 
                         (league_id, round, challenge_id, team_a_id, team_b_id) 
                         VALUES (?, ?, ?, ?, ?)`,
                        [this.leagueId, round, matchNumber, teamA.teamId, teamB.teamId],
                        function(insertErr) {
                            if (insertErr) {
                                console.error("Error creating tournament match:", insertErr.message);
                            } else {
                                console.log("Tournament match created with ID:", this.lastID);
                            }
                            pending--;
                        }
                    );
                });
            });

            // Poll until all asynchronous db.run calls have finished.
            const checkInterval = setInterval(() => {
                if (pending === 0) {
                    clearInterval(checkInterval);
                    //callback(null, "Tournament bracket created");
                }
            }, 50);
        });
    }

    /**
     * Creates a bracket structure based on seeded teams.
     * If there is an odd number of teams, the highest-seeded teams get a bye in the first round.
     *
     * @param {Array} seededTeams - Array of seeded teams
     * @returns {Array} - Array of matches in the bracket
     */
    createBracket(seededTeams) {
        const bracket = [];
        let round = 1;
        let matchNumber = 1;

        while (seededTeams.length > 1) {
            const roundMatches = [];
            const numTeams = seededTeams.length;
            const numMatches = Math.floor(numTeams / 2);
            const numByes = numTeams % 2;

            // Give byes to the highest-seeded teams if necessary
            const byes = seededTeams.slice(0, numByes).map(team => ({
                round,
                matchNumber: matchNumber++,
                teamA: team,
                teamB: null // No opponent, this team gets a bye
            }));

            // Create matches for the remaining teams
            for (let i = numByes; i < numTeams; i += 2) {
                const teamA = seededTeams[i];
                const teamB = seededTeams[i + 1];
                roundMatches.push({
                    round,
                    matchNumber: matchNumber++,
                    teamA,
                    teamB
                });
            }

            bracket.push(...byes, ...roundMatches);
            round++;

            // Prepare for the next round: winners of this round advance
            seededTeams = roundMatches.map(match => ({
                seed: Math.min(match.teamA.seed, match.teamB ? match.teamB.seed : Infinity),
                teamId: null, // Placeholder for the winner
                teamName: null, // Placeholder for the winner
                wins: 0,
                losses: 0
            })).concat(byes.map(match => match.teamA));
        }

        return bracket;
    }
}