import { db } from '../database.js';
import { scheduleJob } from "node-schedule";
import { runMatch, recommendActions, recommendPlayers } from "../Routes/challenges.js";
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
    setMatches(firstGameTime, numMatches, matchSpacing, samePlayerSpacing, callback) {
        console.log("Setting matches for league id:", this.leagueId);
        if (!this.leagueId) {
            return callback(new Error("leagueId is not set"));
        }

        // Retrieve all teams in the league
        db.all("SELECT t.id, l.players_set_time_minutes FROM teams t JOIN leagues l ON t.league_id=l.id WHERE t.league_id = ?", [this.leagueId], (err, teams) => {
            if (err) {
                return callback(err);
            }

            // Sort team IDs for consistent ordering.
            teams.sort((a, b) => a.id - b.id);
            const teamIds = teams.map(team => team.id);
            const players_set_time_minutes = teams[0].players_set_time_minutes;

            console.log("First game time:", firstGameTime, typeof firstGameTime);

            const schedule = this.createGameSchedule(teamIds, numMatches, { startingRound: 1, startDate: new Date(firstGameTime), matchSpacing, samePlayerSpacing });
            
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
                          self.scheduleMatch(happening_at, this.lastID, runMatch, players_set_time_minutes);
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
      const startDate = options.startDate;
      console.log("Start date:", startDate)
      const matchSpacing = options.matchSpacing || 5; // minutes between matches
      const samePlayerSpacing = options.samePlayerSpacing || 1440; // minutes between same player matches
    
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
      let currentDayStart = startDate;
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
            matchTime = new Date(matchTime.getTime() + matchSpacing * 60 * 1000); // space out the matches
        });
    
        // Add round matches to overall schedule.
        schedule.push(...roundMatches);
    
        // Prepare for the next round: next day starts exactly 24 hours later.
        console.log(currentDayStart, typeof currentDayStart)
        currentDayStart = new Date(currentDayStart.getTime() + samePlayerSpacing * 60 * 1000);
        round++;
      }
    
      console.log("Schedule created:", schedule);
      return schedule;
    }
    
    scheduleMatch(happening_at, challenge_id, runMatch, players_time, tourny = false) {
      /*const utcCurrentTime = moment.utc().format("YYYY-MM-DD HH:mm:ss");
      console.log(`Current time (UTC): ${utcCurrentTime}`);
      console.log(happening_at);
      const match_time = moment.utc(happening_at);
      const now = moment.utc();
      console.log(now, match_time);
      console.log(`Scheduling match for challenge ${challenge_id} at ${match_time}`);
      console.log(`Time until run match: ${match_time.diff(now)/60000} minutes`);
      if(match_time < now) {
        console.log("Match passed \n")
        return;
      }*/
      
      // Schedule the job for the exact happening_at time.
      const self = this;
      console.log(happening_at, typeof happening_at)
      const happening_time = new Date(happening_at);
      scheduleJob(happening_time, async function() {
        try {
          console.log(`Running match for challenge ${challenge_id}`);
          self.verifyMatch(challenge_id, async () => {
            await runMatch(challenge_id, false, tourny);
          });
        } catch (err) {
          console.error(`Error processing challenge ${challenge_id}:`, err);
        }
      });

      //const happeningAtEST = moment.tz(happening_at, "America/New_York").toDate();
      const verifyPlayersTime = new Date(happening_time.getTime() - players_time * 60 * 1000);
      console.log("Going to verify players at time (UTC): ", verifyPlayersTime);

      //const timeUntilVerify = verifyPlayersTime - now;
      //console.log(`Time until verify players: ${Math.floor(timeUntilVerify / 1000 / 60)} minutes`);
      scheduleJob(verifyPlayersTime, async function() {
        try {
          console.log(`Verifying players set for challenge ${challenge_id}`);
          self.verifyPlayersSet(challenge_id);
        } catch (err) {
          console.error(`Error verifying players for challenge ${challenge_id}:`, err);
        }
      });
      
    }

    async verifyMatch(challenge_id, callback) {
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
        if(challenge.challenger_players_set === 0 || challenge.challenged_players_set === 0) { //last minute set players
          await this.verifyPlayersSet(challenge_id);
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

    async verifyPlayersSet(challenge_id) {
      return new Promise((resolve, reject) => {
      db.get(`SELECT * FROM challenges WHERE id = ?`, [challenge_id], (err, challenge) => {
        if (err) {
        console.error(`Error fetching challenge ${challenge_id}:`, err);
        return reject(err);
        }
        if (!challenge) {
        console.error(`Challenge ${challenge_id} not found.`);
        return resolve();
        }
        if (challenge.status !== "upcoming") {
        console.log(`Challenge ${challenge_id} is not upcoming; skipping.`);
        return resolve();
        }
    
        const tasks = [];
    
        if (challenge.challenger_players_set === 0) {
        tasks.push(new Promise((res, rej) => {
          this.setPlayers(challenge_id, challenge.challenger_team_id, () => {
          console.log("Set players for challenger");
          db.run(
            `UPDATE challenges SET challenger_players_set=TRUE WHERE id=?`,
            [challenge_id],
            (err) => {
            if (err) {
              console.log("Error updating challenger players set:", err);
              return rej(err);
            }
            console.log("Updated challenger players set!");
            res();
            }
          );
          });
        }));
        } else {
        tasks.push(Promise.resolve());
        }
    
        if (challenge.challenged_players_set === 0) {
        tasks.push(new Promise((res, rej) => {
          this.setPlayers(challenge_id, challenge.challenged_team_id, () => {
          console.log("Set players for challenged");
          db.run(
            `UPDATE challenges SET challenged_players_set=TRUE WHERE id=?`,
            [challenge_id],
            (err) => {
            if (err) {
              console.log("Error updating challenged players set:", err);
              return rej(err);
            }
            console.log("Updated challenged players set!");
            res();
            }
          );
          });
        }));
        } else {
        tasks.push(Promise.resolve());
        }
    
        Promise.all(tasks)
        .then(() => resolve())
        .catch((error) => reject(error));
      });
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
      db.all(`SELECT c.*, l.players_set_time_minutes from challenges c JOIN leagues l ON c.league_id = l.id where c.status = "upcoming"`, (err, rows) => {
        if(err) {
          console.log("Error scheduling on startup, row: ",rows, " err: ", err)
        }
        else {
          rows.forEach(row => {
            const tourny = row.tournament_match ? true : false;
            this.scheduleMatch(row.happening_at, row.id, runMatch, row.players_set_time_minutes, tourny);
          });
        }
      })
    }

    getNearestPowerOfTwo(input) {
      return Math.pow(2, Math.ceil(Math.log2(input)));
    }

    generateBracket(numPlayers){
      var rounds = Math.log(numPlayers)/Math.log(2)-1;
      var pls = [1,2];
      for(var i=0;i<rounds;i++){
        pls = nextLayer(pls);
      }
      return pls;
      function nextLayer(pls){
        var out=[];
        var length = pls.length*2+1;
        pls.forEach(function(d){
          out.push(d);
          out.push(length-d);
        });
        return out;
      }
    }

    /**
     * Generates a tournament bracket based on the match history.
     * Seeds teams based on their wins and losses.
     *
     * @param {function(Error, any):void} callback
     */
    createTournament(season, callback) {
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
          WHERE teams.league_id = ? AND teams.in_season = TRUE AND match_history.type = 'league' AND match_history.season = ?
          GROUP BY teams.id
          ORDER BY (wins * 1.0) / (wins + losses + 1) DESC
      `, [this.leagueId, season], async (err, teams) => {
        if (err) {
          console.log("Error getting team wins n such:".err)
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
        const bracket = this.generateBracket(seededTeams.length);
        const newBracket = bracket.map(seed => seededTeams.find(team => team.seed === seed));
        let promises = 0;

        let autoWinners = {};

        for(let i = 0; i < newBracket.length; i+=2) {
          let first_team_id;
          let second_team_id;
          let winner_team_id;

          if(newBracket[i] && newBracket[i+1]) {
            console.log(newBracket[i].teamName, " VS ", newBracket[i+1].teamName)
            first_team_id = newBracket[i].teamId;
            second_team_id = newBracket[i+1].teamId;
          }
          else if(newBracket[i]){
            console.log(newBracket[i].teamName, " gets a BYE")
            first_team_id = newBracket[i].teamId;
            second_team_id = null;
            winner_team_id = first_team_id;
            autoWinners[(i + newBracket.length)] = winner_team_id;
          }
          else if(newBracket[i+1]) {
            console.log(newBracket[i+1].teamName, " gets a BYE")
            first_team_id = null;
            second_team_id = newBracket[i+1].teamId;
            winner_team_id = second_team_id;
            autoWinners[(i + newBracket.length)] = winner_team_id;
          }
          promises++;
          //Add first round
          db.run(`INSERT INTO tournament_matches (first_team_id, second_team_id, league_id, tournament_match, num_games, winning_team_id, season) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`, [first_team_id, second_team_id, this.leagueId, i/2, 1, winner_team_id, season], (err) => {
              if(err) {
                console.log("Error inserting tournament game:", err)
              }
              promises--;
            })
        }
        console.log("Auto winners:",autoWinners)
        //Add next rounds
        let round = 2;
        let i = newBracket.length/2-1;
        let matchesInRound = 0;
        while(2 ** round <= newBracket.length) {
          i++;
          matchesInRound++;
          let first_team_id = null;
          let second_team_id = null;
          if(autoWinners[i*2]) {
            first_team_id = autoWinners[i*2];
          }
          if(autoWinners[1+i*2]) {
            second_team_id = autoWinners[1+i*2];
          }

          promises++;
          console.log("Round:", round, " Match:", i, " Match in round:", matchesInRound)
          db.run(`INSERT INTO tournament_matches (league_id, tournament_match, num_games, tournament_round, first_team_id, second_team_id, season) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`, [this.leagueId, i, 3, round, first_team_id, second_team_id, season], (err) => {
              if(err) {
                round = 100;
                console.log("Error inserting tournament game:", err)
              }
              promises--;
            })
            if(matchesInRound >= newBracket.length/(2**round)) {
              matchesInRound = 0;
              round++;
            }
        }
        const interval = setInterval(() => {
          if (promises === 0) {
            clearInterval(interval);
            callback();
          }
        }, 50);
      });
    }

    scheduleTournamentMatches(round, startTime = null) {
      const self = this;
      db.run(`UPDATE players 
          SET health=100 
          WHERE team_id IN (SELECT id FROM teams WHERE league_id = ?)`, [this.leagueId], (err) => {
            if(err) {
              console.log("Error resetting players health:", err)
            }
      });

      db.get(`SELECT season, match_spacing_minutes, match_player_spacing_minutes FROM leagues WHERE id=?`, [this.leagueId], (err, row) => {
        const season = row.season;
        const matchSpacing = row.match_spacing_minutes;
        const playerSpacing = row.match_player_spacing_minutes;
        if(err) {
          console.log("Error getting league info:", err)
        }
      
        db.all(`SELECT t.*, leagues.players_set_time_minutes FROM tournament_matches t JOIN leagues ON t.league_id=leagues.id WHERE tournament_round = ? AND league_id = ? AND t.season = ?`,
          [round, this.leagueId, season], (err, rows) => {
            if(err) {
              console.log("Error getting torny matches:", err)
            }
            console.log("Torny:", rows)
            if(rows.length == 0) {
              console.log("NO TORNY ROUNDS\n\n\n")
              return;
            }
            let minuteOffset = 0;
            const players_set_time_minutes = rows[0].players_set_time_minutes;
            if(!startTime) {
              startTime = new Date(Date.now() + (playerSpacing + minuteOffset) * 60000);
            } else {
              startTime = new Date(startTime);
              console.log(startTime, typeof startTime)
            }

            rows.forEach(match => {
              if(match.first_team_id && match.second_team_id) {
                let tournamentMatchTime = new Date(startTime.getTime() + minuteOffset * 60 * 1000);;
                for(let i = 0; i<1+Math.floor(match.num_games/2); i++) { //put 2 games for each one
                  const time = moment(tournamentMatchTime).toDate();
                  db.run(`INSERT INTO challenges (challenger_team_id, challenged_team_id, status, happening_at, friendly, league_id, tournament_match) 
                    VALUES (?, ?, 'upcoming', ?, false, ?, ?)`,
                    [match.first_team_id, match.second_team_id, tournamentMatchTime.toISOString(), this.leagueId, match.id], function(err) {
                      if(err) {
                        console.log("Err creating torny challenge:", err)
                      }
                      const challengeId = this.lastID;
                      self.scheduleMatch(time, challengeId, runMatch, players_set_time_minutes, true);
                    });
                  tournamentMatchTime = new Date(tournamentMatchTime.getTime() + playerSpacing * 60 * 1000);
                }
                minuteOffset += matchSpacing;
              }
            });
          })
        });
    }

    updateTournamentMatch(match_id, winner_id) {
      const self = this;
      db.get(
        `SELECT tm.*, l.players_set_time_minutes, m.id AS mhid, m.created_at, m.home_team_id, m.away_team_id, (
        SELECT COUNT(*)
        FROM challenges c
        JOIN match_history mh ON c.id = mh.challenge_id
        WHERE c.tournament_match = tm.id
         ) AS numMatches, (
        SELECT COUNT(*)
        FROM challenges c
        JOIN match_history mh ON c.id = mh.challenge_id
        WHERE c.tournament_match = tm.id AND mh.home_team_score > mh.away_team_score
         ) AS homeWins, (
          SELECT COUNT(*) FROM tournament_matches t, match_history mh
          WHERE t.league_id=mh.league_id AND t.season=mh.season AND t.tournament_round = tm.tournament_round AND mh.id = ?) 
          AS num_matches_in_round
         FROM tournament_matches tm, match_history m, leagues l WHERE tm.league_id = l.id AND m.id = ? AND tm.league_id = ?
         AND tm.id = (
        SELECT c.tournament_match
        FROM challenges c
        JOIN match_history mh ON c.id = mh.challenge_id
        WHERE mh.id = ?
         ) AND m.id=?`,
        [match_id, match_id, self.leagueId, match_id, match_id],
        (err, row) => {
          console.log("Row:", row)
          if (err) {
            console.log("Error getting tournament match for update:", err);
            return
          }
          const num_games = row.num_games;
          const numMatches = row.numMatches;
          const homeWins = row.homeWins;
          const awayWins = numMatches - homeWins;
          const players_set_time_minutes = row.players_set_time_minutes;
          let matchWinner = null;
          if(homeWins > num_games/2) {
            matchWinner = winner_id;
          } else if(awayWins > num_games/2) {
            matchWinner = winner_id;
          }

          if(matchWinner) {
            const leagueId = this.leagueId;
            console.log("Match winner:", matchWinner)
            db.run(`UPDATE tournament_matches SET winning_team_id = ? WHERE id = ?`, [winner_id, row.id], (err) => {
              if(err) {
                console.log("Error updating tournament match:", err);
              }
              const autoWinner = row.tournament_match + 8; //fix this to work for other tourny sizes!
              console.log("Autowinner:", autoWinner)
              const teamColumn = autoWinner%2 == 0 ? "first_team_id" : "second_team_id";

              db.run(`UPDATE tournament_matches SET ${teamColumn} = ? WHERE tournament_match = ? AND league_id = ? AND season = ?`, [winner_id, Math.floor(autoWinner/2), leagueId, row.season], (err) => {
                if(err) {
                  console.log("Error adding autowinner to match:", err);
                }
                //Check if all matches in the round have finished
                db.all(
                  `SELECT * FROM tournament_matches WHERE tournament_round = ? AND league_id = ? AND season = ?`,
                  [row.tournament_round, leagueId, row.season],
                  (err, matches) => {
                  if (err) {
                    console.log("Error fetching tournament matches:", err);
                    return;
                  }
                  const allWinnersSet = matches.every(match => match.winning_team_id !== null);
                  if (allWinnersSet) {
                    if(row.num_matches_in_round == 1) { //season is over
                      this.endSeason();
                      return;
                    }
                    self.scheduleTournamentMatches(row.tournament_round+1, 1);
                  }
                  }
                );
              });
            });
          } else if(row.num_games/2 < row.numMatches) { //theyve played more than half of the games, schedule another one
            console.log("Making a new match:", row.num_games, row.numMatches)
            db.get(`SELECT match_player_spacing_minutes FROM leagues WHERE id=?`, [this.leagueId], (err, row2) => {
              if(err) {
                console.log("Error getting league info2:", err)
                return;
              }


              const nextTime = moment(row.created_at).add(row2.match_player_spacing_minutes, 'minutes').toISOString();
              db.run(`INSERT INTO challenges (challenger_team_id, challenged_team_id, status, happening_at, friendly, league_id, tournament_match) 
                VALUES (?, ?, 'upcoming', ?, false, ?, ?)`,
              [row.first_team_id, row.second_team_id, nextTime, this.leagueId, row.id], function(err) {
                if(err) {
                  console.log("Err creating torny challenge:", err)
                }
                const challengeId = this.lastID;
                self.scheduleMatch(nextTime, challengeId, runMatch, players_set_time_minutes, true);
              });
            });
          }
        });
    }

    updateLeagueMatch(match_id) {
      const self = this;
      db.all(`SELECT * FROM challenges WHERE status = "upcoming" AND league_id = ?`, [this.leagueId], (err, rows) => {
        if(err) {
          console.log("Error getting upcoming matches after league match:", err)
        }
        if(rows.length === 0) {
          console.log("That was the last match")
          db.get(`SELECT season, tournament_start_time FROM leagues WHERE id = ?`, [this.leagueId], (err, row) => {
            if(err) {
              console.log("Error getting league info:", err)
            }
            const season = row.season;
            const tournamentStartTime = row.tournament_start_time;
            db.run(`UPDATE leagues SET state = "tournament" WHERE id = ?`, [this.leagueId], (err) => {
              if(err) {
                console.log("Updating league state to tournament:", err)
              }
            });
            self.createTournament(season, () => {self.scheduleTournamentMatches(1, tournamentStartTime)});
          })
        }
      });
    }

    endSeason() {
      db.run(`UPDATE leagues SET season = season + 1, state = "offseason" WHERE id = ?`, [this.leagueId], (err) => {
        if(err) {
          console.log("Error ending season:", err)
        }
      })
    }
}