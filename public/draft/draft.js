import { fetchData } from "../api.js";

let draftPlayers = [];

let teams =[];

let draftId;

// Current draft position
let currentDraftIndex = 0;

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    draftId = urlParams.get('draftId');
    const leagueId = localStorage.getItem('leagueId');
    const token = localStorage.getItem('token');

    // Fetch and display teams
    fetchData(`/teams?leagueId=${1}`, 'GET', { 'Authorization': `Bearer ${token}` }, null, (teamsInfo) => {
        teams = teamsInfo;
        displayDraftOrder();

        fetchData(`/draft/players?draftId=${draftId}`, 'GET', { 'Authorization': `Bearer ${token}` }, null, (res) => {
            const players = res.prospects;
            currentDraftIndex = res.turn % teams.length;
            console.log(res);
            console.log(players);
            draftPlayers = players;
            displayPlayers(players);
        });
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
                <h2>${player.title}<h2>
                <div class="player-stats">
                    <span><strong>Bulk:</strong> ${player.bulk}</span>
                    <span><strong>Focus:</strong> ${player.focus}</span>
                    <span><strong>Trickiness:</strong> ${player.trickiness}</span>
                    <span><strong>Height:</strong> ${player.height}</span>
                    <span><strong>Strength:</strong> ${player.strength}</span>
                    <span><strong>Finesse:</strong> ${player.finesse}</span>
                </div>
            </div>
        `;
        const loggedInUser = localStorage.getItem('loggedInUser');
        const currentTeam = teams[currentDraftIndex];
        console.log(teams, currentDraftIndex)
    
        if (currentTeam.owner == loggedInUser) {
            playerCard.innerHTML += `<button class="draft-button" onclick="draftPlayer('${player.id}')">Draft</button>`
        }
        playerCard.dataset.id = player.id;
        playerCard.dataset.power = player.power;

        playerListElement.appendChild(playerCard);
    });
}

// Function to draft a player
function draftPlayer(playerId, token) {
    const loggedInUser = localStorage.getItem('loggedInUser');
    const currentTeam = teams[currentDraftIndex];

    if (currentTeam.owner !== loggedInUser) {
        alert("It's not your turn to draft!");
        return;
    }
    console.log("Player id: ", playerId)
    const user = localStorage.getItem('loggedInUser');
    fetchData(`/draft/player`, 'POST', { 'Authorization': `Bearer ${token}`}, { playerId, user, draftId }, (res) => {
        if (res.message === 'Player updated successfully!') {
            location.reload();
        }
    });
}

// Function to sort players by selected attribute
function sortPlayers() {
    const sortBy = document.getElementById('sort-select').value;
    draftPlayers.sort((a, b) => b[sortBy] - a[sortBy]);
    displayPlayers(draftPlayers);
}

function displayDraftOrder() {
    const loggedInUser = localStorage.getItem('loggedInUser');
    const draftOrderList = document.getElementById('draft-order-list');
    draftOrderList.innerHTML = ''; // Clear existing content

    teams.forEach((team, index) => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `<strong>${team.name}</strong><br><small>${team.owner}</small>`;

        if (index === currentDraftIndex) {
            listItem.classList.add('current-team');
            listItem.innerHTML += ' (Currently Drafting)';
        }

        if (team.owner === loggedInUser) {
            listItem.innerHTML += ' (Your Team)';
        }

        draftOrderList.appendChild(listItem);
    });

    // Display user's position in the queue
    const userPositionElement = document.getElementById('user-position');
    const positionInQueue = (teams.length + currentDraftIndex - teams.findIndex(team => team.owner === loggedInUser)) % teams.length;
    userPositionElement.textContent = `Your team is ${positionInQueue === 0 ? 'currently drafting!' : 'drafting in ' + positionInQueue + ' turn(s)'}.`;
}