import { fetchData } from "../api.js";

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const leagueId = urlParams.get('leagueId');
  fetchData(`/leagues/tournament/${leagueId}`, 'GET', {}, null, (data) => {
      const matches = data.rows;
      console.log("Tournament data:", matches);
      const highestRoundMatch = matches.reduce((prev, current) => {
          return (current.tournament_round > prev.tournament_round) ? current : prev;
      });
      const numRounds = highestRoundMatch.tournament_round
      console.log("Num rounds:", numRounds);
      let bracketData = [];
      for(let i = 0; i < numRounds; i++) {
          bracketData.push({
              roundName: `Round${i+1}`,
              matches: []
        });
      }

      matches.forEach(match => {
          if (typeof match.challenges === 'string') {
            try {
              match.challenges = JSON.parse(match.challenges);
            } catch(e) {
              console.error("Error parsing challenges:", e);
              match.challenges = [];
            }
          }
          console.log("Match challenge:", match.challenges);
          let gameScores = [[], []];

          if(match.challenges.length != 0) { // if there are challenges, display them
            let i = match.num_games;
            match.challenges.forEach(challenge => {
                if(challenge.status == "upcoming") {
                    gameScores[0].push(null);
                    gameScores[1].push(null);
                } else {
                    //let winnerIndex = challenge.winner_id == match.first_team_id ? 0 : 1;
                    gameScores[0].push(challenge.home_team_score);
                    gameScores[1].push(challenge.away_team_score);
                }
                i--;
            });
            while(i > 0) {
                gameScores[0].push(null);
                gameScores[1].push(null);
                i--;
            }
            console.log("Game scores:", gameScores)
          }
          let newMatch = {
              participants: [ {name: match.first_team, isWinner: match.first_team_id == match.winning_team_id}, 
                  {name: match.second_team, isWinner: match.second_team_id == match.winning_team_id}],
              gameScores
          }
          if(!match.winning_team_id) {
              newMatch.result="draw";
          }
          bracketData[match.tournament_round-1].matches.push(newMatch);
      })
      renderBracket(bracketData);
  });
});

function createGameScoresElement(match, participantIndex) {
  const container = document.createElement('div');
  container.className = 'game-scores-container';
  if(match.gameScores && Array.isArray(match.gameScores) && match.gameScores.length === 2 
     && Array.isArray(match.gameScores[participantIndex])) {
    const scores = match.gameScores[participantIndex];
    const otherIndex = participantIndex === 0 ? 1 : 0;
    scores.forEach((score, gameIndex) => {
      const scoreElem = document.createElement('span');
      scoreElem.className = 'game-score';
      const scoreValue = (score === null || score === undefined) ? '-' : score;
      scoreElem.textContent = scoreValue;
      // Only add highlight if this match is not a draw.
      if(match.result !== "draw" && match.gameScores[otherIndex] && gameIndex < match.gameScores[otherIndex].length) {
        const otherScore = match.gameScores[otherIndex][gameIndex];
        if(score !== null && otherScore !== null && score !== undefined && otherScore !== undefined) {
          if(score > otherScore) {
            scoreElem.classList.add('highlight');
          } else {
            scoreElem.classList.add('unhighlight');
          }
        }
      }
      container.appendChild(scoreElem);
      // Add divider if not the last game:
      /*if(gameIndex < scores.length - 1) {
        const divider = document.createElement('span');
        divider.className = 'score-divider';
        container.appendChild(divider);
      }*/
    });
  }
  return container;
}

function renderBracket(data) {
  const container = document.getElementById('bracket-container');
  container.className = 'bracket';
  container.innerHTML = ""; // Clear existing content
  console.log("Bracket data:", data);

  data.forEach(round => {
    const roundSection = document.createElement('section');
    roundSection.classList.add('round');
    // Use provided roundName or fallback to round index
    roundSection.classList.add((round.roundName || 'round').toLowerCase());

    if (round.matches.length > 2) {
      // Split matches into two groups for proper connector alignment.
      const half = Math.ceil(round.matches.length / 2);
      const groups = [round.matches.slice(0, half), round.matches.slice(half)];
      groups.forEach(group => {
        const winnersDiv = document.createElement('div');
        winnersDiv.classList.add('winners');
        const matchupsDiv = document.createElement('div');
        matchupsDiv.classList.add('matchups');
        group.forEach(match => {
          const matchupDiv = document.createElement('div');
          matchupDiv.classList.add('matchup');
          const participantsDiv = document.createElement('div');
          participantsDiv.classList.add('participants');
          match.participants.forEach((participant, index) => {
            const participantDiv = document.createElement('div');
            participantDiv.classList.add('participant');
            if(match.result === "draw") {
              participantDiv.classList.add('draw');
            } else {
              participantDiv.classList.add(participant.isWinner ? 'winner' : 'loser');
            }
            participantDiv.style.display = 'flex';
            participantDiv.style.justifyContent = 'space-between';
            const nameSpan = document.createElement('span');
            nameSpan.textContent = participant.name;
            participantDiv.appendChild(nameSpan);
            const scoresEl = createGameScoresElement(match, index);
            participantDiv.appendChild(scoresEl);
            participantsDiv.appendChild(participantDiv);
          });
          matchupDiv.appendChild(participantsDiv);
          matchupsDiv.appendChild(matchupDiv);
        });
        winnersDiv.appendChild(matchupsDiv);
        // Add connector region after the matchups
        const connectorDiv = document.createElement('div');
        connectorDiv.classList.add('connector');
        const mergerDiv = document.createElement('div');
        mergerDiv.classList.add('merger');
        const lineDiv = document.createElement('div');
        lineDiv.classList.add('line');
        connectorDiv.appendChild(mergerDiv);
        connectorDiv.appendChild(lineDiv);
        winnersDiv.appendChild(connectorDiv);
        roundSection.appendChild(winnersDiv);
      });
    } else {
      // Single winners container for rounds with 1 or 2 matches.
      const winnersDiv = document.createElement('div');
      winnersDiv.classList.add('winners');
      const matchupsDiv = document.createElement('div');
      matchupsDiv.classList.add('matchups');
      round.matches.forEach(match => {
        const matchupDiv = document.createElement('div');
        matchupDiv.classList.add('matchup');
        const participantsDiv = document.createElement('div');
        participantsDiv.classList.add('participants');
        match.participants.forEach((participant, index) => {
          const participantDiv = document.createElement('div');
          participantDiv.classList.add('participant');
          if(match.result === "draw") {
            participantDiv.classList.add('draw');
          } else {
            participantDiv.classList.add(participant.isWinner ? 'winner' : 'loser');
          }
          participantDiv.style.display = 'flex';
          participantDiv.style.justifyContent = 'space-between';
          const nameSpan = document.createElement('span');
          nameSpan.textContent = participant.name;
          participantDiv.appendChild(nameSpan);
          const scoresEl = createGameScoresElement(match, index);
          participantDiv.appendChild(scoresEl);
          participantsDiv.appendChild(participantDiv);
        });
        matchupDiv.appendChild(participantsDiv);
        matchupsDiv.appendChild(matchupDiv);
      });
      winnersDiv.appendChild(matchupsDiv);
      const connectorDiv = document.createElement('div');
      connectorDiv.classList.add('connector');
      const mergerDiv = document.createElement('div');
      mergerDiv.classList.add('merger');
      const lineDiv = document.createElement('div');
      lineDiv.classList.add('line');
      connectorDiv.appendChild(mergerDiv);
      connectorDiv.appendChild(lineDiv);
      winnersDiv.appendChild(connectorDiv);
      roundSection.appendChild(winnersDiv);
    }
    container.appendChild(roundSection);
  });
}