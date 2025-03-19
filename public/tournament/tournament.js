import { fetchData } from "../api.js";

document.addEventListener('DOMContentLoaded', () => {
    fetchData(`/leagues/tournament/1`, 'GET', {}, null, (data) => {
        const matches = data.rows;
        console.log("Tournament data:", matches);
        const highestRoundMatch = matches.reduce((prev, current) => {
            return (current.tournament_round > prev.tournament_round) ? current : prev;
        });
        const numRounds = highestRoundMatch.tournament_round
        console.log("Num rounds:", numRounds);

        let bracketData = [ 
            {roundName: "Quarterfinals", matches: []},
            {roundName: "Semifinals", matches: []},
            {roundName: "Finals", matches: []}
        ];

        matches.forEach(match => {
            let newMatch
            if(false){//if(!(match.first_team && match.second_team) && match.tournament_round==1) {
                newMatch = {
                    participants: [ {name: match.first_team, isWinner: true}, 
                        {name: "BYE", isWinner: false}],
                    gameScores: []
                }
            }
            else {
                newMatch = {
                    participants: [ {name: match.first_team, isWinner: match.first_team_id == match.winning_team_id}, 
                        {name: match.second_team, isWinner: match.second_team_id == match.winning_team_id}],
                    gameScores: []
                }
            }
            if(!match.winning_team_id) {
                newMatch.result="draw";
            }
            bracketData[match.tournament_round-1].matches.push(newMatch);
        })
        
        renderBracket(bracketData);
    });

    // Dummy bracket data with a draw match added (result property).
    /*const bracketData = [
      {
        roundName: "Quarterfinals",
        matches: [
          { 
            participants: [ { name: "Uno", isWinner: true }, { name: "Ocho", isWinner: false } ],
            gameScores: [ [2, 3, null], [1, 3, 2] ]
          },
          { 
            // This match is a draw.
            participants: [ { name: "Dos", isWinner: false }, { name: "Siete", isWinner: false } ],
            gameScores: [ [1, null, 2], [2, 2, 3] ],
            result: "draw"
          },
          { 
            participants: [ { name: "Uno", isWinner: true }, { name: "Ocho", isWinner: false } ],
            gameScores: [ [null, null, null], [null, null, null] ]
          },
          { 
            participants: [ { name: "Dos", isWinner: false }, { name: "Siete", isWinner: true } ],
            gameScores: [ [2, 1, 3], [1, 2, 3] ]
          }
        ]
      },
      {
        roundName: "Semifinals",
        matches: [
          { 
            participants: [ { name: "Uno", isWinner: true }, { name: "Dos", isWinner: false } ],
            gameScores: [ [3, 1, 2], [2, 2, 2] ]
          },
          { 
            participants: [ { name: "Seis", isWinner: true }, { name: "Cinco", isWinner: false } ],
            gameScores: [ [2, 2, 3], [1, 3, 2] ]
          }
        ]
      },
      {
        roundName: "Finals",
        matches: [
          { 
            participants: [ { name: "Uno", isWinner: true }, { name: "Seis", isWinner: false } ],
            gameScores: [ [3, 3, 2], [2, 2, 3] ]
          }
        ]
      }
    ];
    
    renderBracket(bracketData);*/
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
      if(gameIndex < scores.length - 1) {
        const divider = document.createElement('span');
        divider.className = 'score-divider';
        container.appendChild(divider);
      }
    });
  }
  return container;
}

function renderBracket(data) {
  const container = document.getElementById('bracket-container');
  container.className = 'bracket';
  container.innerHTML = ""; // Clear existing content

  data.forEach(round => {
    const roundSection = document.createElement('section');
    roundSection.classList.add('round');
    roundSection.classList.add(round.roundName.toLowerCase());
    
    // For rounds like quarterfinals with many matches, split into groups for proper connector alignment
    if (round.roundName.toLowerCase() === "quarterfinals" && round.matches.length > 2) {
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
            // Add "draw" class if match.result is draw, else winner/loser
            if(match.result === "draw") {
              participantDiv.classList.add('draw');
            } else {
              participantDiv.classList.add(participant.isWinner ? 'winner' : 'loser');
            }
            // Use flex layout to push scores to the right:
            participantDiv.style.display = 'flex';
            participantDiv.style.justifyContent = 'space-between';
            // Name span
            const nameSpan = document.createElement('span');
            nameSpan.textContent = participant.name;
            participantDiv.appendChild(nameSpan);
            // Append game scores element:
            const scoresEl = createGameScoresElement(match, index);
            participantDiv.appendChild(scoresEl);
            participantsDiv.appendChild(participantDiv);
          });
          matchupDiv.appendChild(participantsDiv);
          matchupsDiv.appendChild(matchupDiv);
        });
        winnersDiv.appendChild(matchupsDiv);
        // Connector element as before
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
      // Single winners container code
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