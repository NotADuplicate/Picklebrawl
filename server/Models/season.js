import { db } from '../database.js';
import { scheduleJob } from "node-schedule";
import { runMatch } from "../Routes/challenges.js";
import { run } from 'mocha';

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
      console.log(`Scheduling match for challenge ${challenge_id} at ${happening_at}`);
      // Schedule the job for the exact happening_at time.
      scheduleJob(happening_at, async function() {
        try {
          console.log(`Running match for challenge ${challenge_id}`);
          await runMatch(challenge_id, false);
          await db.run("UPDATE challenges SET status = 'completed' WHERE id = ?", [challenge_id]);
        } catch (err) {
          console.error(`Error processing challenge ${challenge_id}:`, err);
        }
      });
    }
      
}
