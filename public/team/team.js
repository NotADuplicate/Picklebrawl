document.addEventListener('DOMContentLoaded', () => {
    const teamNameElement = document.getElementById('team-name');
    const playersContainer = document.getElementById('players-container');
    const backButton = document.getElementById('back-button');
    const teamDetailsElement = document.getElementById('team-details-section');

    const urlParams = new URLSearchParams(window.location.search);
    const teamId = urlParams.get('teamId');

    // Fetch and display team details
    fetch(`/teams/${teamId}`)
    .then(response => response.json())
    .then(team => {
        teamNameElement.textContent = team.name;
        teamDetailsElement.innerHTML = `
            <p>Owner: ${team.owner}</p>
        `;

        fetch(`/teams/${teamId}/players`)
        .then(response => response.json())
        .then(players => {
            if (Array.isArray(players)) {
                players.forEach(player => {
                    const playerCard = document.createElement('div');
                    playerCard.className = 'player-card';
                
                    const playerName = document.createElement('h3');
                    playerName.textContent = player.name;
                    playerCard.appendChild(playerName);
                
                    const playerStatsList = document.createElement('ul');
                    playerStatsList.className = 'player-stats';
                
                    const stats = [
                        { label: 'Bulk', value: player.bulk },
                        { label: 'Finesse', value: player.finesse },
                        { label: 'Height', value: player.height },
                        { label: 'Strength', value: player.strength },
                        { label: 'Trickiness', value: player.trickiness },
                        { label: 'Focus', value: player.focus },
                    ];
                
                    stats.forEach(stat => {
                        const statItem = document.createElement('li');
                        statItem.innerHTML = `<strong>${stat.label}:</strong> ${stat.value}`;
                        playerStatsList.appendChild(statItem);
                    });
                
                    playerCard.appendChild(playerStatsList);
                
                    const playerQuirk = document.createElement('p');
                    playerQuirk.className = 'player-quirk';
                
                    const quirkTooltip = document.createElement('span');
                    quirkTooltip.className = 'tooltip';
                    quirkTooltip.textContent = player.quirk_title;
                    quirkTooltip.setAttribute('data-tooltip', player.quirk_description);
                
                    playerQuirk.appendChild(quirkTooltip);
                    playerCard.appendChild(playerQuirk);
                
                    playersContainer.appendChild(playerCard);
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