import { fetchData } from "../api.js";
let lastStat = null;
let playerStats = [];
let leagueId;

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    leagueId = urlParams.get('leagueId');
    const backButton = document.getElementById('back-button');
    const totalStatsButton = document.getElementById('total-stats-button');
    const averageStatsButton = document.getElementById('average-stats-button');

    getPlayerStats();

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

    backButton.addEventListener('click', () => {
        window.history.back();
    });
});

function getPlayerStats() {
    fetchData(`/league/league-stats/${leagueId}`, 'GET', {}, null, (data) => {
        console.log(data.rows);
        playerStats = data.rows;
        displayStats("total");
    });
}

function displayStats(type) {
    const statsTableBody = document.getElementById('stats-table').querySelector('tbody');
    statsTableBody.innerHTML = '';
    playerStats.forEach(player => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${player.player_name}</td>
            <td>${player.team}</td>
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
    const up = lastStat == stat;
    lastStat = stat;
    if (up) {
        lastStat = null;
    }
    if (up) {
        playerStats.sort((a, b) => {
            if (typeof a[stat] === 'number' && typeof b[stat] === 'number') {
                return b[stat] - a[stat];
            } else {
                return String(b[stat]).localeCompare(String(a[stat]));
            }
        });
    } else {
        playerStats.sort((a, b) => {
            if (typeof a[stat] === 'number' && typeof b[stat] === 'number') {
                return a[stat] - b[stat];
            } else {
                return String(a[stat]).localeCompare(String(b[stat]));
            }
        });
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
            <td>${player.team}</td>
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
