document.addEventListener('DOMContentLoaded', () => {
    const messageDiv = document.getElementById('message');
    const leaguesList = document.getElementById('leagues-list');
    const backButton = document.getElementById('back-button');
    const teamsContainer = document.getElementById('teams-container');
    const leagueTitle = document.getElementById('league-title');

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
            fetch(`/teams?leagueId=${league.id}`)
            .then(response => response.json())
            .then(teams => {
                teamsContainer.innerHTML = '';
                challengeButtons = {};
                teams.forEach(team => {
                    if(team.owner == loggedInUser) {
                        myTeamId = team.id
                        localStorage.setItem('myTeamId', myTeamId);
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