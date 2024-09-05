document.addEventListener('DOMContentLoaded', () => {
    const teamNameElement = document.getElementById('team-name');
    const teamDetailsElement = document.getElementById('team-details');
    const playersListElement = document.getElementById('players-list');
    const backButton = document.getElementById('back-button');

    const urlParams = new URLSearchParams(window.location.search);
    const teamId = urlParams.get('teamId');

    // Fetch and display team details
    fetch(`http://localhost:3000/teams/${teamId}`)
    .then(response => response.json())
    .then(team => {
        teamNameElement.textContent = team.teamName;
        teamDetailsElement.innerHTML = `
            <p>Owner: ${team.owner}</p>
        `;

        fetch(`http://localhost:3000/teams/${teamId}/players`)
        .then(response => response.json())
        .then(players => {
            if (Array.isArray(players)) {
                playersListElement.innerHTML = '';
                players.forEach(player => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${player.name}</td>
                        <td>${player.bulk}</td>
                        <td>${player.scoring}</td>
                        <td>${player.assist}</td>
                        <td>${player.offense}</td>
                        <td>${player.medicine}</td>
                    `;
                    playersListElement.appendChild(row);
                });
            } else {
                throw new Error('Players data is not an array');
            }
        })
        .catch(error => {
            console.error('Error fetching players:', error);
            playersListElement.innerHTML = '<p>Error fetching players!</p>';
        });
    })
    .catch(error => {
        console.error('Error fetching team:', error);
    });

    backButton.addEventListener('click', () => {
        window.history.back();
    });
});