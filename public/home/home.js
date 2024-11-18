document.addEventListener('DOMContentLoaded', () => {
    const messageDiv = document.getElementById('message');
    const leaguesList = document.getElementById('leagues-list');
    const createLeagueForm = document.getElementById('create-league-form');
    const joinLeagueForm = document.getElementById('join-league-form');
    const logoutButton = document.getElementById('logout-button');
    const showCreateLeagueButton = document.getElementById('show-create-league');
    const showJoinLeagueButton = document.getElementById('show-join-league');

    const loggedInUser = localStorage.getItem('loggedInUser');
    const token = localStorage.getItem('token');
    if (!loggedInUser) {
        window.location.href = '../login/login.html';
    }

    messageDiv.innerText = `Welcome back, ${loggedInUser}!`;

    showCreateLeagueButton.addEventListener('click', () => {
        createLeagueForm.classList.toggle('active');
        joinLeagueForm.classList.remove('active');
    });
    
    showJoinLeagueButton.addEventListener('click', () => {
        joinLeagueForm.classList.toggle('active');
        createLeagueForm.classList.remove('active');
    });

    document.getElementById('create-league-form').addEventListener('submit', function (event) {
        event.preventDefault();
        const leagueName = document.getElementById('new-league-name').value;
        const leaguePassword = document.getElementById('new-league-password').value;
        const teamName = document.getElementById('new-team-name').value;
        createLeagueForm.classList.add('hidden');

        createLeague(leagueName, leaguePassword, teamName);
    });

    document.getElementById('join-league-form').addEventListener('submit', function (event) {
        event.preventDefault();
        const leagueName = document.getElementById('join-league-name').value;
        const leaguePassword = document.getElementById('join-league-password').value;
        const teamName = document.getElementById('join-team-name').value;
        joinLeagueForm.classList.add('hidden');

        joinLeague(leagueName, leaguePassword, teamName);
        loadLeagues();
    });

    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('loggedInUser');
        window.location.href = '../login/login.html';
    });

    loadLeagues();

    function createLeague(leagueName, leaguePassword, teamName) {
        const username = localStorage.getItem('loggedInUser');
        console.log("Creating league: ", leagueName, leaguePassword, username, teamName);
        fetch('/create-league', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Add the token here
            },
            body: JSON.stringify({ leagueName, leaguePassword, username, teamName })
        })
        .then(response => response.json())
        .then(data => {
            messageDiv.innerText = data.message;
            if (data.message === 'League and team created successfully!') {
                loadLeagues();
            }
        })
        .catch(error => {
            messageDiv.innerText = 'Error creating league!';
        });
    }

    function joinLeague(leagueName, leaguePassword, teamName) {
        const username = localStorage.getItem('loggedInUser');
        fetch('/join-league', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Add the token here
            },
            body: JSON.stringify({ leagueName, leaguePassword, username, teamName })
        })
            .then(response => response.json())
            .then(data => {
                messageDiv.innerText = data.message;
                if (data.message === 'Joined league and created team successfully!') {
                    loadLeagues();
                }
            })
            .catch(error => {
                messageDiv.innerText = 'Error joining league!';
            });
    }


    function loadLeagues() {
        console.log("Getting leagues");
        fetch(`/leagues`, {
            method: 'GET',
            headers: {
            'Authorization': `Bearer ${token}` // Add the token here
            }
        })
        .then(response => response.json())
        .then(leagues => {
            console.log("Leagues: ", leagues);
            leaguesList.innerHTML = '';
            leagues.forEach(league => {
                const leagueItem = document.createElement('li');

                const leagueName = document.createElement('span');
                leagueName.className = 'league-name';
                leagueName.textContent = league.leagueName;
            
                const leagueStatus = document.createElement('span');
                leagueStatus.className = league.started ? 'league-status started' : 'league-status not-started';
                leagueStatus.textContent = league.started ? 'Started' : 'Not Started';
            
                const leagueActions = document.createElement('div');
                leagueActions.className = 'league-actions';
            
                const viewButton = document.createElement('button');
                viewButton.textContent = 'View';
                viewButton.addEventListener('click', () => {
                    viewLeague(league.leagueName);
                });
            
                leagueActions.appendChild(viewButton);
            
                leagueItem.appendChild(leagueName);
                leagueItem.appendChild(leagueStatus);
                leagueItem.appendChild(leagueActions);
            
                leaguesList.appendChild(leagueItem);
            });
        })
        .catch(error => {
            console.error('Error fetching leagues:', error);
        });
    }

    window.viewLeague = function (leagueName) {
        window.location.href = `../league/league.html?league=${leagueName}`;
    };
});