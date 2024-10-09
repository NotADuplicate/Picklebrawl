document.addEventListener('DOMContentLoaded', () => {
    const messageDiv = document.getElementById('message');
    const leaguesList = document.getElementById('leagues-list');
    const backButton = document.getElementById('back-button');
    const teamsContainer = document.getElementById('teams-container');
    const leagueTitle = document.getElementById('league-title');
    const leagueFounderElement = document.getElementById('league-founder');
    const startLeagueButton = document.getElementById('start-league-button');

    const urlParams = new URLSearchParams(window.location.search);
    const leagueName = urlParams.get('league');
    localStorage.setItem('leagueName', leagueName);
    const loggedInUser = localStorage.getItem('loggedInUser');

    leagueTitle.textContent = leagueName;
    let challengerIds = {} //associates each challenge button with the challenger and challenged
    let challengedIds = {}

    // Fetch and display league details
    fetch(`/leagues?leagueName=${leagueName}`)
    .then(response => response.json())
    .then(leagues => {
        const league = leagues[0]; // Since we are fetching by league name, there should be only one league
        if (league) {
            //const listItem = document.createElement('li');
            leagueFounderElement.textContent = league.founder;
            // Disable the start league button if the league has already started or if the logged-in user is not the founder
            if (league.started || loggedInUser !== league.founder) {
                startLeagueButton.disabled = true;
                startLeagueButton.textContent = league.hasStarted ? 'League Started' : 'Start League';
            } else {
                startLeagueButton.addEventListener('click', () => {
                    startLeague(leagueName);
                });
            }

            getMatches(league.id);
            // Fetch and display teams
            fetch(`/teams?leagueId=${league.id}`)
            .then(response => response.json())
            .then(teams => {
                teamsContainer.innerHTML = '';
                challengeButtons = {};
                teams.forEach(team => {
                    if(team.owner == loggedInUser) {
                        myTeamId = team.id;
                        localStorage.setItem('myTeamId', myTeamId);
                    }
                    const teamCard = document.createElement('div');
                    teamCard.className = 'team-card';
                
                    const teamInfo = document.createElement('div');
                    teamInfo.className = 'team-info';
                
                    const teamName = document.createElement('h3');
                    teamName.className = 'team-name';
                    teamName.textContent = team.name;
                
                    const teamOwner = document.createElement('p');
                    teamOwner.className = 'team-owner';
                    teamOwner.textContent = `Owner: ${team.owner}`;
                
                    teamInfo.appendChild(teamName);
                    teamInfo.appendChild(teamOwner);
                
                    const teamActions = document.createElement('div');
                    teamActions.className = 'team-actions';
                
                    const viewButton = document.createElement('button');
                    viewButton.className = 'view-button';
                    viewButton.textContent = 'View';
                    viewButton.addEventListener('click', () => {
                        window.location.href = `../team/team.html?teamId=${team.id}`;
                    });
                    teamActions.appendChild(viewButton);
                
                    if (team.owner !== loggedInUser) {
                        const challengeButton = document.createElement('button');
                        challengeButton.className = 'challenge-button';
                        challengeButton.setAttribute('data-team-id', team.id);
                        challengeButton.innerText = 'Challenge';
                        challengeButton.addEventListener('click', () => challenge(team.id, myTeamId, challengeButton));
                        teamActions.appendChild(challengeButton);
                        challengeButtons[team.id] = challengeButton;
                    }
                
                    teamCard.appendChild(teamInfo);
                    teamCard.appendChild(teamActions);
                    teamsContainer.appendChild(teamCard);
                });
                getChallenges(challengeButtons);
            })
            .catch(error => {
                console.error('Error fetching teams:', error);
                messageDiv.innerText = 'Error fetching teams!';
            });
        } else {
            messageDiv.innerText = 'League not found!';
        }
    })
    .catch(error => {
        console.error('Error fetching leagues:', error);
        messageDiv.innerText = 'Error fetching leagues!';
    });

    // Fetch and display challenges
    function getChallenges(challengeButtons) {
    fetch(`/challenges?teamId=${myTeamId}`)
        .then(response => response.json())
        .then(challenges => {
            console.log('Challenges:', challenges);
            challenges.forEach(challenge => {
                console.log('Chalenge:', challenge.id);
                console.log(challengeButtons)
                const otherTeamId = challenge.challenger_team_id !== myTeamId ? challenge.challenger_team_id : challenge.challenged_team_id;
                const challengeButton = challengeButtons[otherTeamId];
                if(challengeButton) { //set challenge buttons depending on challenge status
                    console.log("Challenge button: ", challenge.status)
                    challengeButton.value = challenge.id;
                    console.log(challengedIds)
                    challengedIds[challenge.id] = challenge.challenged_team_id;
                    challengerIds[challenge.id] = challenge.challenger_team_id;
                    if(challenge.status === 'pending') {
                        if(challenge.challenger_team_id == myTeamId) {
                            challengeButton.innerText = 'Pending';
                            challengeButton.disabled = true;
                        }
                        else {
                            challengeButton.innerText = 'Accept Challenge';
                        }
                    }
                    else if(challenge.status === 'accepted' ) {
                        challengeButton.innerText = 'View Challenge';
                    }
                }
            });
        })
        .catch(error => {
            console.error('Error fetching challenges:', error);
            messageDiv.innerText = 'Error fetching challenges!';
        });
    }   

    function getMatches(leagueId) {
        const matchesContainer = document.getElementById('matches-container');
        fetch(`/matches?leagueId=${leagueId}`)
        .then(response => response.json())
        .then(matches => {
            console.log('Matches:', matches);
            matches.forEach(match => {
                const matchCard = document.createElement('div');
                matchCard.className = 'match-card';
            
                const matchInfo = document.createElement('div');
                matchInfo.className = 'match-info';
                matchInfo.innerHTML = `
                    <p class="match-teams">${match.home_team_name} vs ${match.away_team_name}</p>
                    <p class="match-score">Score: ${match.home_team_score} - ${match.away_team_score}</p>
                `;
            
                const matchActions = document.createElement('div');
                matchActions.className = 'match-actions';
                const viewButton = document.createElement('button');
                viewButton.className = 'view-button';
                viewButton.innerText = 'View Match';
                viewButton.addEventListener('click', () => {
                    // Add your logic to view the match
                    window.location.href = '../match/match.html?matchId=' + match.id;
                });
            
                matchActions.appendChild(viewButton);
                matchCard.appendChild(matchInfo);
                matchCard.appendChild(matchActions);
            
                matchesContainer.appendChild(matchCard);
            });
        })
        .catch(error => {
            console.error('Error fetching matches:', error);
            messageDiv.innerText = 'Error fetching matches!';
        });
    }

    backButton.addEventListener('click', () => {
        window.location.href = `../home/home.html`;
    });

    // Add event listeners to challenge buttons
    function challenge(teamId, myTeamId, button) {
        if(button.innerText === 'Challenge') {
            console.log('Challenging team:', teamId);
            // Send challenge request
            fetch(`/challenges`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ teamId, myTeamId })
            })
            .then(response => response.json())
            .then(data => {
                button.innerText = 'Pending';
                button.disabled = true;
            });
        } else if (button.innerText === 'Accept Challenge') {
            // Accept challenge
            fetch(`/challenges/${button.value}/accept`, {
                method: 'POST'
            })
            .then(response => response.json())
            .then(data => {
                const challengeId = button.value;
                window.location.href = `../bench/bench.html?challengedId=${challengedIds[challengeId]}&challengerId=${challengerIds[challengeId]}&challengeId=${challengeId}`;
            });
        }
        else if(button.innerText === 'View Challenge') {
            const challengeId = button.value;
            window.location.href = `../bench/bench.html?challengedId=${challengedIds[challengeId]}&challengerId=${challengerIds[challengeId]}&challengeId=${challengeId}`;
        }
    }

    function startLeague(leagueName) {
        fetch('/start-league', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ leagueName, username: loggedInUser })
        })
        .then(response => response.json())
        .then(data => {
            messageDiv.innerText = data.message;
            if (data.message === 'League started successfully!') {
                window.location.reload();
            }
        })
        .catch(error => {
            messageDiv.innerText = 'Error starting league!';
        });
    }
});