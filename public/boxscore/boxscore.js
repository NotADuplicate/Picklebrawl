// Dummy data for Team 1
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const matchId = urlParams.get('matchId');
    fetch('/match/teams?matchId=' + matchId)
    .then(response => response.json())
    .then(data => {
        console.log("Teams: ", data);
        const team1NameElement = document.getElementsByClassName('team-header-1')[0];
        team1NameElement.textContent = data[0].name;
        const team2NameElement = document.getElementsByClassName('team-header-2')[0];
        team2NameElement.textContent = data[1].name;
        let team1Data = [];
        let team2Data = [];
        fetch('/match/match-stats?matchId=' + matchId)
        .then(response => response.json())
        .then(stats => {
            stats.forEach(stat => {
                console.log(stat);
                const player = {
                    player: stat.name,
                    pointsScored: stat.points_scored,
                    blitzes: stat.blitzes,
                    fieldGoalsMade: stat.field_goals_successful,
                    fieldGoalsAttempted: stat.field_goals_attempted,
                    blitzGoalsMade: stat.blitz_goals_successful,
                    blitzGoalsAttempted: stat.blitz_goals_attempted,
                    tricks: stat.tricks,
                    metersAdvanced: Math.round(stat.advancements),
                    damage: Math.round(stat.damage*10)/10
                }
                if (stat.team_id === data[0].id) {
                    team1Data.push(player);
                } else {
                    team2Data.push(player);
                }
            });
            populateTable(team1Data, 'team1-body');
            populateTable(team2Data, 'team2-body');

        });
    });
});

// Function to populate table data
function populateTable(teamData, tbodyId) {
    const tbody = document.getElementById(tbodyId);
    teamData.forEach(playerData => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${playerData.player}</td>
            <td>${playerData.pointsScored}</td>
            <td>${playerData.blitzes}</td>
            <td>${playerData.metersAdvanced}</td>
            <td>${playerData.blitzGoalsMade} / ${playerData.blitzGoalsAttempted}</td>
            <td>${playerData.fieldGoalsMade} / ${playerData.fieldGoalsAttempted}</td>
            <td>${playerData.damage}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Populate tables with dummy data
