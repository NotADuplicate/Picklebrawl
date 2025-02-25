import { fetchData } from "../api.js";

let draftPlayers = [];

let teams =[];

let draftId;

let token;

let playerCardTemplate;

let leagueName = "";

let turn = 0;

let draftQueue = [];

let currentDraftIndex = 0;

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    draftId = urlParams.get('draftId');
    const leagueId = localStorage.getItem('leagueId');
    token = localStorage.getItem('token');
    console.log("Token: ", token);

    // Fetch player card template
    const response = await fetch('/templates/player.html');
    const templateText = await response.text();
    const templateContainer = document.createElement('div');
    templateContainer.innerHTML = templateText;
    document.body.appendChild(templateContainer);
    playerCardTemplate = document.getElementById('player-card-template').content;

    // Fetch and display teams
    fetchData(`/teams?leagueId=${leagueId}`, 'GET', { 'Authorization': `Bearer ${token}` }, null, (teamsInfo) => {
        teams = teamsInfo;
        console.log("Teams: ", teams);
        leagueName = teamsInfo[0].league_name;

        fetchData(`/draft/players?draftId=${draftId}`, 'GET', { 'Authorization': `Bearer ${token}` }, null, (res) => {
            const players = res.prospects;
            const backwards = Math.floor(res.turn/teams.length) % 2;
            turn = res.turn;
            currentDraftIndex = !backwards ? turn % teams.length : teams.length - turn % teams.length - 1;
            displayDraftOrder();
            console.log("Response:", res);
            console.log(players);
            console.log("Teams: ", teams);
            draftPlayers = players;
            fetchData(`/draft/premoves?draftId=${draftId}`, 'GET', { 'Authorization': `Bearer ${token}` }, null, (premoves) => {
                console.log("Premoves: ", premoves);
                premoves.forEach(premove => {
                    draftQueue.push(premove.player_id);
                });
            displayPlayers(players);
            });
        });
    });
});

// Function to display players
function displayPlayers(playerList) {
    const playerListElement = document.getElementById('player-list');
    playerListElement.innerHTML = ''; // Clear existing content

    playerList.forEach(player => {
        const playerCard = document.importNode(playerCardTemplate, true);

        playerCard.querySelector('.player-name').textContent = player.name;
        playerCard.querySelector('.player-bulk').textContent = player.bulk;
        playerCard.querySelector('.player-finesse').textContent = player.finesse;
        playerCard.querySelector('.player-height').textContent = player.height;
        playerCard.querySelector('.player-strength').textContent = player.strength;
        playerCard.querySelector('.player-trickiness').textContent = player.trickiness;
        playerCard.querySelector('.player-focus').textContent = player.focus;
        playerCard.querySelector('.tooltip').textContent = player.title;
        playerCard.querySelector('.tooltip').setAttribute('data-tooltip', player.description);

        const loggedInUser = localStorage.getItem('loggedInUser');
        console.log("Current draft index: ", currentDraftIndex);
        const currentTeam = teams[currentDraftIndex];
    
        const draftButtonContainer = playerCard.querySelector('.draft-button-container');
        if (currentTeam.owner == loggedInUser) {
            draftButtonContainer.innerHTML = `<button class="draft-button" onclick="draftPlayer('${player.id}')">Draft</button>`;
        } else {
            const preMoveIndex = draftQueue.indexOf(player.id);
            if(preMoveIndex === -1) {
                draftButtonContainer.innerHTML = `<button class="draft-button" onclick="premovePlayer('${player.id}')">Queue Draft</button>`;
            }
            else {
                draftButtonContainer.innerHTML = `<button class="draft-button" onclick="undoPremove('${player.id}')">Draft Queue: ${preMoveIndex+1}</button>`;
            }
        }

        playerListElement.appendChild(playerCard);
    });
}

// Function to draft a player
function draftPlayer(playerId) {
    const loggedInUser = localStorage.getItem('loggedInUser');
    const currentTeam = teams[currentDraftIndex];

    if (currentTeam.owner !== loggedInUser) {
        alert("It's not your turn to draft!");
        return;
    }
    console.log("Player id: ", playerId)
    const user = localStorage.getItem('loggedInUser');
    fetchData(`/draft/player`, 'POST', { 'Authorization': `Bearer ${token}`}, { playerId, user, draftId }, (res) => {
        console.log("Response: ", res);
        if (res.message === 'Player updated successfully!') {
            location.reload();
        }
        else if(res.message === 'Team is at its max size!') {
            alert("Your team is at its max size! Go into your team screen to remove a player before drafting another.");
        }
    });
}

function premovePlayer(playerId) {
    console.log("Player id: ", playerId)
    const user = localStorage.getItem('loggedInUser');
    fetchData(`/draft/premove`, 'POST', { 'Authorization': `Bearer ${token}`}, { playerId, draftId, order: draftQueue.length }, (res) => {
        console.log("Response: ", res);
        if (res.message === 'Draft queued successfully!') {
            console.log("Player added to queue");
            draftQueue.push(parseInt(playerId, 10));
            console.log("Queue: ", draftQueue);
            displayPlayers(draftPlayers);
        }
        else if(res.message === 'Team is at its max size!') {
            alert("Your team is at its max size! Go into your team screen to remove a player before drafting another.");
        }
    });
}

function undoPremove(playerId) {
    console.log("Player id: ", playerId)
    const user = localStorage.getItem('loggedInUser');
    fetchData(`/draft/undo-premove`, 'POST', { 'Authorization': `Bearer ${token}`}, { playerId, draftId, order: draftQueue.length }, (res) => {
        console.log("Response: ", res);
        if (res.message === 'Draft removed successfully!') {
            draftQueue = draftQueue.filter(id => id !== parseInt(playerId, 10));
            displayPlayers(draftPlayers);
        }
        else {
            alert("Error removing player from queue.");
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
        console.log("Team: ", team);
        console.log("Index: ", index);
        const listItem = document.createElement('li');
        listItem.innerHTML = `<strong>${team.name}</strong><br><small>${team.owner}</small>`;
        listItem.classList.add('clickable-team'); // Add the clickable class

        if (index === currentDraftIndex) {
            listItem.classList.add('current-team');
            listItem.innerHTML += ' (Currently Drafting)';
        }

        if (team.owner === loggedInUser) {
            listItem.innerHTML += ' (Your Team)';
        }

        // Add event listener to the card
        listItem.addEventListener('click', () => window.location.href = `/team/team.html?teamId=${team.id}`);

        draftOrderList.appendChild(listItem);
    });

    // Display user's position in the queue
    const userPositionElement = document.getElementById('user-position');
    const backward = Math.floor(turn/teams.length) % 2;
    const yourIndex = teams.findIndex(team => team.owner === loggedInUser);
    let positionInQueue;
    if(backward == 0) {
        if(yourIndex < currentDraftIndex) {
            positionInQueue = teams.length - currentDraftIndex + (teams.length-yourIndex) -1;
        }
        else {
            positionInQueue = yourIndex - currentDraftIndex;
        }
    }
    else {
        if(yourIndex > currentDraftIndex) {
            positionInQueue = yourIndex + currentDraftIndex + 1;
        }
        else {
            positionInQueue = currentDraftIndex - yourIndex;
        }
    }

    console.log("Current draft index: ", currentDraftIndex, " , Team index: ", teams.findIndex(team => team.owner === loggedInUser), " , Teams: ", teams);
    userPositionElement.textContent = `Your team is ${positionInQueue === 0 ? 'currently drafting!' : 'drafting in ' + positionInQueue + ' turn(s)'}.`;
}

function goToLeague() {
    window.location.href = `/league/league.html?league=${leagueName}`;
}

window.goToLeague = goToLeague;
window.sortPlayers = sortPlayers;
window.draftPlayer = draftPlayer;
window.premovePlayer = premovePlayer;
window.undoPremove = undoPremove;