import { fetchData } from "../api.js";
let playerCardTemplate;
document.addEventListener('DOMContentLoaded', async () => {
    const teamNameElement = document.getElementById('team-name');
    const playersContainer = document.getElementById('players-container');
    const backButton = document.getElementById('back-button');
    const teamDetailsElement = document.getElementById('team-details-section');

    const urlParams = new URLSearchParams(window.location.search);
    const teamId = urlParams.get('teamId');
    const token = localStorage.getItem('token');

    const response = await fetch('/templates/player.html');
    const templateText = await response.text();
    const templateContainer = document.createElement('div');
    templateContainer.innerHTML = templateText;
    document.body.appendChild(templateContainer);
    playerCardTemplate = document.getElementById('player-card-template').content;

    // Fetch and display team details
    fetchData(`/teams/${teamId}`, 'GET', { 'Authorization': `Bearer ${token}` }, null, (team) => {
        teamNameElement.textContent = team.name;
        teamDetailsElement.innerHTML = `
            <p>Owner: ${team.owner}</p>
        `;

        fetchData(`/teams/${teamId}/players`, 'GET', { 'Authorization': `Bearer ${token}` }, null, (players) => {
            console.log(players)
            players.forEach(player => {
                const playerCard = document.importNode(playerCardTemplate, true);

                const playerNameElement = playerCard.querySelector('.player-name');
                const nameLink = document.createElement('a');
                nameLink.href = `/player/player.html?playerId=${player.id}`;
                nameLink.textContent = player.name;
                // Remove default blue hyperlink styling
                nameLink.style.color = 'inherit';
                nameLink.style.textDecoration = 'none';
                playerNameElement.innerHTML = '';
                playerNameElement.appendChild(nameLink);
                playerCard.querySelector('.player-bulk').textContent = player.bulk;
                playerCard.querySelector('.player-finesse').textContent = player.finesse;
                playerCard.querySelector('.player-height').textContent = player.height;
                playerCard.querySelector('.player-strength').textContent = player.strength;
                playerCard.querySelector('.player-trickiness').textContent = player.trickiness;
                playerCard.querySelector('.player-focus').textContent = player.focus;
                playerCard.querySelector('.tooltip').textContent = player.quirk_title;
                playerCard.querySelector('.tooltip').setAttribute('data-tooltip', player.quirk_description);
            
                //Add remove button
                if(team.owner === localStorage.getItem('loggedInUser')) {
                    const removeButtonContainer = playerCard.querySelector('.remove-button-container');
                    removeButtonContainer.innerHTML = `<button class="remove-player-button" onclick="removePlayer('${player.id}')">Fire</button>`;
                }
                playersContainer.appendChild(playerCard);
            });
        }, (error) => {
            console.error('Error fetching players:', error);
        });
    }, (error) => {
        console.error('Error fetching team:', error);
    });
    backButton.addEventListener('click', () => {
        window.history.back();
    });
});

async function removePlayer(playerId) {
    const token = localStorage.getItem('token');
    const result = await showConfirmModal();
    if (result) {
        fetchData(`/teams/playerDelete/${playerId}`, 'POST', { 'Authorization': `Bearer ${token}` }, null, (response) => {
            console.log('Player removed:', response);
        }, (error) => {
            console.error('Error removing player:', error);
        });
        window.location.reload();
    }
}

async function showConfirmModal() {
    return new Promise((resolve) => {
        const modalOverlay = document.getElementById('modal-overlay');
        const yesButton = document.getElementById('yes-button');
        const noButton = document.getElementById('no-button');

        modalOverlay.style.display = 'block';

        yesButton.onclick = function () {
            modalOverlay.style.display = 'none';
            resolve(true);
        };

        noButton.onclick = function () {
            modalOverlay.style.display = 'none';
            resolve(false);
        };
    });
}

window.removePlayer = removePlayer;