document.addEventListener('DOMContentLoaded', () => {
    const messageDiv = document.getElementById('message');
    const leaguesList = document.getElementById('leagues-list');
    const createLeagueForm = document.getElementById('create-league-form');
    const joinLeagueForm = document.getElementById('join-league-form');
    const logoutButton = document.getElementById('logout-button');
    const showCreateLeagueButton = document.getElementById('show-create-league');
    const showJoinLeagueButton = document.getElementById('show-join-league');

    const loggedInUser = localStorage.getItem('loggedInUser');
    if (!loggedInUser) {
        window.location.href = '../login/login.html';
    }

    messageDiv.innerText = `Welcome back, ${loggedInUser}!`;

    showCreateLeagueButton.addEventListener('click', () => {
        createLeagueForm.classList.remove('hidden');
        joinLeagueForm.classList.add('hidden');
    });

    showJoinLeagueButton.addEventListener('click', () => {
        joinLeagueForm.classList.remove('hidden');
        createLeagueForm.classList.add('hidden');
    });

    document.getElementById('create-league-form').addEventListener('submit', function (event) {
        event.preventDefault();
        const leagueName = document.getElementById('new-league-name').value;
        const leaguePassword = document.getElementById('new-league-password').value;
        const teamName = document.getElementById('new-team-name').value;
        createLeagueForm.classList.add('hidden');

        createLeague(leagueName, leaguePassword, teamName);
        loadLeagues();
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
        fetch('http://localhost:3000/create-league', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ leagueName, leaguePassword, username, teamName })
        })
            .then(response => response.json())
            .then(data => {
                messageDiv.innerText = data.message;
                if (data.message === 'League created successfully!') {
                    sleep(100);
                    loadLeagues();
                }
            })
            .catch(error => {
                messageDiv.innerText = 'Error creating league!';
            });
    }

    function joinLeague(leagueName, leaguePassword, teamName) {
        const username = localStorage.getItem('loggedInUser');
        fetch('http://localhost:3000/join-league', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ leagueName, leaguePassword, username, teamName })
        })
            .then(response => response.json())
            .then(data => {
                messageDiv.innerText = data.message;
                if (data.message === 'Joined league successfully!') {
                    loadLeagues();
                }
            })
            .catch(error => {
                messageDiv.innerText = 'Error joining league!';
            });
    }


    function loadLeagues() {
        console.log("Getting leagues");
        fetch(`http://localhost:3000/leagues?user=${loggedInUser}`)
        .then(response => response.json())
        .then(leagues => {
            console.log("Leagues: ", leagues);
            leaguesList.innerHTML = '';
            leagues.forEach(league => {
                const listItem = document.createElement('li');
                listItem.innerHTML = `
                    <strong>${league.leagueName}</strong><br>
                    Founder: ${league.founder}<br>
                    Started: ${league.started ? 'Yes' : 'No'}<br>
                `;
                const viewButton = document.createElement('button');
                viewButton.innerText = 'View';
                viewButton.addEventListener('click', () => viewLeague(league.leagueName));
                listItem.appendChild(viewButton);
                leaguesList.appendChild(listItem);
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