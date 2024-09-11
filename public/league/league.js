document.addEventListener('DOMContentLoaded', () => {
    const messageDiv = document.getElementById('message');
    const leaguesList = document.getElementById('leagues-list');
    const backButton = document.getElementById('back-button');
    const teamsContainer = document.getElementById('teams-container');
    const leagueTitle = document.getElementById('league-title');

    const urlParams = new URLSearchParams(window.location.search);
    const leagueName = urlParams.get('league');
    const loggedInUser = localStorage.getItem('loggedInUser');

    leagueTitle.textContent = leagueName;

    // Fetch and display league details
    fetch(`http://localhost:3000/leagues?leagueName=${leagueName}`)
    .then(response => response.json())
    .then(leagues => {
        leaguesList.innerHTML = '';
        const league = leagues[0]; // Since we are fetching by league name, there should be only one league
        if (league) {
            const listItem = document.createElement('li');
            listItem.innerHTML = `<strong>${league.leagueName}</strong><br>Founder: ${league.founder}<br>Started: ${league.started ? 'Yes' : 'No'}`;
            leaguesList.appendChild(listItem);

            if (league.founder === loggedInUser && !league.started) {
                const startButton = document.createElement('button');
                startButton.innerText = 'Start League';
                startButton.addEventListener('click', () => startLeague(leagueName));
                leaguesList.appendChild(startButton);
            }

            // Fetch and display teams
            fetch(`http://localhost:3000/teams?leagueId=${league.id}`)
            .then(response => response.json())
            .then(teams => {
                teamsContainer.innerHTML = '';
                challengeButtons = {};
                teams.forEach(team => {
                    if(team.owner == loggedInUser) {
                        myTeamId = team.id
                    }
                    const teamDiv = document.createElement('div');
                    teamDiv.className = 'team';
                    teamDiv.innerHTML = `
                        <div>
                            <div class="team-name">${team.name}</div>
                            <div>Owner: ${team.owner}</div>
                        </div>
                        <button>View</button>
                    `;
                    if (team.owner !== loggedInUser) {
                        const challengeButton = document.createElement('button');
                        challengeButton.className = 'challenge-button';
                        challengeButton.setAttribute('data-team-id', team.id);
                        challengeButton.innerText = 'Challenge';
                        teamDiv.appendChild(challengeButton);
                        challengeButton.addEventListener('click', () => challenge(team.id, myTeamId, challengeButton));
                        challengeButtons[team.id] = challengeButton;
                    }
                    teamDiv.querySelector('button').addEventListener('click', () => {
                        window.location.href = `../team/team.html?teamId=${team.id}`;
                    });
                    teamsContainer.appendChild(teamDiv);
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
    fetch(`http://localhost:3000/challenges?teamId=${myTeamId}`)
        .then(response => response.json())
        .then(challenges => {
            console.log('My team ID:', myTeamId);
            console.log('Challenges:', challenges);
            challenges.forEach(challenge => {
                if(challenge.challenger_team_id == myTeamId) {
                    const challengeButton = challengeButtons[challenge.challenged_team_id];
                    if(challengeButton) {
                        challengeButton.innerText = 'Pending';
                        challengeButton.disabled = true;
                    }
                }
                else {
                    const challengeButton = challengeButtons[challenge.challenger_team_id];
                    if (challengeButton) {
                        challengeButton.innerText = 'Accept Challenge';
                    }
                }
            });
        })
        .catch(error => {
            console.error('Error fetching challenges:', error);
            messageDiv.innerText = 'Error fetching challenges!';
        });
    }   

    backButton.addEventListener('click', () => {
        window.history.back();
    });

    // Add event listeners to challenge buttons
    function challenge(teamId, myTeamId, button) {
        if(button.innerText === 'Challenge') {
            console.log('Challenging team:', teamId);
            // Send challenge request
            fetch(`http://localhost:3000/challenges`, {
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
            fetch(`http://localhost:3000/challenges/${teamId}/accept`, {
                method: 'POST'
            })
            .then(response => response.json())
            .then(data => {
                window.location.href = `../bench/bench.html?teamId=${myTeamId}&otherTeamId=${teamId}`;
            });
        }
    }

    function startLeague(leagueName) {
        fetch('http://localhost:3000/start-league', {
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