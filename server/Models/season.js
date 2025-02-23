import { db } from '../database.js';

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

            const schedule = this.createGameSchedule(teamIds, 7, { startingRound: 0, startDate: firstGameTime });
            
            // Insert the scheduled challenges sequentially.
            let pending = schedule.length;
            db.serialize(() => {
                schedule.forEach(({ challenger_team_id, challenged_team_id, happening_at }) => {
                    db.run(
                        `INSERT INTO challenges 
                         (challenger_team_id, challenged_team_id, status, happening_at, friendly, league_id) 
                         VALUES (?, ?, 'upcoming', ?, false, ?)`,
                        [challenger_team_id, challenged_team_id, happening_at, this.leagueId],
                        (insertErr) => {
                            if (insertErr) {
                                console.error("Error creating challenge:", insertErr.message);
                                console.log("challenger_team_id:", challenger_team_id);
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
      
        // A map to keep track of how many times each pairing has been used.
        // The key is a string "minId-maxId" so that the order doesn’t matter.
        const pairingCounts = {};
        function getPairKey(a, b) {
          return a < b ? `${a}-${b}` : `${b}-${a}`;
        }
      
        // This will hold our final schedule.
        const schedule = [];
        let currentDayStart = new Date(startDate);
        let round = startingRound;
      
        // Helper to get teams that still need games.
        function getAvailableTeams() {
          return teamIds.filter(id => teamGameCounts[id] < desiredGames);
        }
      
        // Continue scheduling until fewer than two teams can play.
        while (getAvailableTeams().length >= 2) {
          const availableTeams = getAvailableTeams();
          // To ensure each team plays at most once per day, we track those already scheduled today.
          const scheduledToday = new Set();
          const dayMatches = [];
      
          // Try to pair up teams for today's matches.
          for (let i = 0; i < availableTeams.length; i++) {
            const teamA = availableTeams[i];
            if (scheduledToday.has(teamA) || teamGameCounts[teamA] >= desiredGames) {
              continue;
            }
            // Look for an opponent among the remaining available teams.
            let candidate = null;
            let candidatePairingCount = Infinity;
            for (let j = i + 1; j < availableTeams.length; j++) {
              const teamB = availableTeams[j];
              if (scheduledToday.has(teamB) || teamGameCounts[teamB] >= desiredGames) {
                continue;
              }
              const key = getPairKey(teamA, teamB);
              const count = pairingCounts[key] || 0;
              // Pick the opponent with the fewest repeat matchups.
              if (count < candidatePairingCount) {
                candidate = teamB;
                candidatePairingCount = count;
              }
            }
            if (candidate !== null) {
              // Create a match between teamA and the chosen candidate.
              dayMatches.push({
                challenger_team_id: teamA,
                challenged_team_id: candidate,
                // The game time will be set below.
                round: round
              });
              // Update game counts.
              teamGameCounts[teamA]++;
              teamGameCounts[candidate]++;
              // Update the pairing count.
              const key = getPairKey(teamA, candidate);
              pairingCounts[key] = (pairingCounts[key] || 0) + 1;
              // Mark these teams as having played today.
              scheduledToday.add(teamA);
              scheduledToday.add(candidate);
            }
          }
      
          // If no matches were scheduled on this day, exit to avoid an infinite loop.
          if (dayMatches.length === 0) break;
      
          // Assign times to each match on this day.
          // The first match starts at currentDayStart; subsequent matches are 5 minutes apart.
          let matchTime = new Date(currentDayStart);
          dayMatches.forEach(match => {
            match.happening_at = matchTime.toISOString();
            // Move time forward by 5 minutes (300,000 ms).
            matchTime = new Date(matchTime.getTime() + 300000);
          });
      
          // Add today's matches to the overall schedule.
          schedule.push(...dayMatches);
      
          // Prepare for the next day:
          // The earliest game next day is exactly 24 hours after today's first game.
          currentDayStart = new Date(currentDayStart.getTime() + 24 * 60 * 60 * 1000);
          round++;
        }


      console.log("Schedule: ", schedule)
        return schedule;
      }
      
}
