import { fetchData } from "../api.js";
let playerCardTemplate;
let lastStat= null;
let teamId;
let playerStats = [];
document.addEventListener('DOMContentLoaded', async () => {
    const teamNameElement = document.getElementById('team-name');
    const playersContainer = document.getElementById('players-container');
    const backButton = document.getElementById('back-button');
    const teamDetailsElement = document.getElementById('team-details-section');

    const urlParams = new URLSearchParams(window.location.search);
    teamId = urlParams.get('teamId');
    const token = localStorage.getItem('token');

    const response = await fetch('/templates/player.html');
    const templateText = await response.text();
    const templateContainer = document.createElement('div');
    templateContainer.innerHTML = templateText;
    document.body.appendChild(templateContainer);
    playerCardTemplate = document.getElementById('player-card-template').content;

    // Tab switching logic
    const playersTab = document.getElementById('players-tab');
    const statsTab = document.getElementById('stats-tab');
    const playersSection = document.getElementById('players-section');
    const statsSection = document.getElementById('stats-section');
    const totalStatsButton = document.getElementById('total-stats-button');
    const averageStatsButton = document.getElementById('average-stats-button');

    getPlayerStats();

    playersTab.addEventListener('click', () => {
        playersTab.classList.add('active');
        statsTab.classList.remove('active');
        playersSection.style.display = '';
        statsSection.style.display = 'none';
    });

    statsTab.addEventListener('click', () => {
        statsTab.classList.add('active');
        playersTab.classList.remove('active');
        statsSection.style.display = '';
        playersSection.style.display = 'none';
        displayStats('total');
    });

    totalStatsButton.addEventListener('click', () => {
        totalStatsButton.classList.add('active');
        averageStatsButton.classList.remove('active');
        displayStats('total');
    });

    averageStatsButton.addEventListener('click', () => {
        averageStatsButton.classList.add('active');
        totalStatsButton.classList.remove('active');
        displayStats('average');
    });

    document.querySelectorAll('.sortable').forEach(header => {
        header.addEventListener('click', () => {
            const stat = header.getAttribute('data-stat');
            sortStats(stat);
        });
    });

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

function getPlayerStats() {
    fetchData(`/teams/team-stats/${teamId}`, 'GET', {}, null, (data) => {
        console.log(data.rows);
        playerStats = data.rows;
        displayStats("total")
    });
}

function displayStats(type) {
    const statsTableBody = document.getElementById('stats-table').querySelector('tbody');
    statsTableBody.innerHTML = '';
    playerStats.forEach(player => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${player.player_name}</td>
            <td>${player.matches_played}</td>
            <td>${type === 'total' ? player.total_points : player.avg_points.toFixed(1)}</td>
            <td>${type === 'total' ? player.total_FG_makes + "/" + player.total_FG_attempts : player.avg_FG_makes.toFixed(1) + "/" + player.avg_FG_attempts.toFixed(1)}</td>
            <td>${type === 'total' ? player.total_blitz_makes + "/" + player.total_blitz_attempts : player.avg_blitz_makes.toFixed(1) + "/" + player.avg_blitz_attempts.toFixed(1)}</td>
            <td>${type === 'total' ? player.total_blocks : player.avg_blocks.toFixed(1)}</td>
            <td>${type === 'total' ? player.total_advance.toFixed(1) : player.avg_advance.toFixed(1)}</td>
            <td>${type === 'total' ? player.total_defense.toFixed(1) : player.avg_defense.toFixed(1)}</td>
            <td>${type === 'total' ? player.total_dmg.toFixed(1) : player.avg_dmg.toFixed(1)}</td>
            <td>${type === 'total' ? player.total_steals : player.avg_steals.toFixed(1)}</td>
        `;
        statsTableBody.appendChild(row);
    });
}

function sortStats(stat) {
    console.log(stat)
    console.log(playerStats[0][stat])
    const up = lastStat==stat;
    console.log(up)
    lastStat = stat;
    if(up) {
        lastStat = null;
    }
    if(up) {
        playerStats.sort((a, b) => b[stat] - a[stat]);
    } else {
        playerStats.sort((a, b) => a[stat] - b[stat]);
    }
    displaySortedStats(playerStats);
}

function displaySortedStats(sortedStats) {
    const statsTableBody = document.getElementById('stats-table').querySelector('tbody');
    statsTableBody.innerHTML = '';
    const type = document.querySelector('#total-stats-button').classList.contains('active') ? 'total' : 'average';
    sortedStats.forEach(player => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${player.player_name}</td>
            <td>${player.matches_played}</td>
            <td>${type === 'total' ? player.total_points : player.avg_points.toFixed(1)}</td>
            <td>${type === 'total' ? player.total_FG_makes + "/" + player.total_FG_attempts : player.avg_FG_makes.toFixed(1) + "/" + player.avg_FG_attempts.toFixed(1)}</td>
            <td>${type === 'total' ? player.total_blitz_makes + "/" + player.total_blitz_attempts : player.avg_blitz_makes.toFixed(1) + "/" + player.avg_blitz_attempts.toFixed(1)}</td>
            <td>${type === 'total' ? player.total_blocks : player.avg_blocks.toFixed(1)}</td>
            <td>${type === 'total' ? player.total_advance.toFixed(1) : player.avg_advance.toFixed(1)}</td>
            <td>${type === 'total' ? player.total_defense.toFixed(1) : player.avg_defense.toFixed(1)}</td>
            <td>${type === 'total' ? player.total_dmg.toFixed(1) : player.avg_dmg.toFixed(1)}</td>
            <td>${type === 'total' ? player.total_steals : player.avg_steals.toFixed(1)}</td>
        `;
        statsTableBody.appendChild(row);
    });
}

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