let draftPlayers = [];

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const draftId = urlParams.get('draftId');
    fetch(`/draft/players?draftId=${draftId}`)
    .then(response => response.json())
    .then(players => {
        console.log(players);
        draftPlayers = players;
        displayPlayers(players);
    });
});

// Function to display players
function displayPlayers(playerList) {
    const playerListElement = document.getElementById('player-list');
    playerListElement.innerHTML = ''; // Clear existing content

    playerList.forEach(player => {
        const playerCard = document.createElement('div');
        playerCard.classList.add('player-card');

        playerCard.innerHTML = `
            <div class="player-info">
                <h2>${player.name}</h2>
                <div class="player-stats">
                    <span><strong>Bulk:</strong> ${player.bulk}</span>
                    <span><strong>Focus:</strong> ${player.focus}</span>
                    <span><strong>Trickiness:</strong> ${player.trickiness}</span>
                    <span><strong>Height:</strong> ${player.height} ft</span>
                    <span><strong>Strength:</strong> ${player.strength}</span>
                    <span><strong>Finesse:</strong> ${player.finesse}</span>
                </div>
            </div>
            <button class="draft-button" onclick="draftPlayer('${player.name}')">Draft</button>
        `;
        playerCard.dataset.id = player.id;
        playerCard.dataset.power = player.power;

        playerListElement.appendChild(playerCard);
    });
}

// Function to draft a player
function draftPlayer(playerName) {
    alert(`You have drafted ${playerName}!`);
}

// Function to sort players by selected attribute
function sortPlayers() {
    const sortBy = document.getElementById('sort-select').value;
    draftPlayers.sort((a, b) => b[sortBy] - a[sortBy]);
    displayPlayers(draftPlayers);
}

// Initial display
//displayPlayers(players);
