// Dummy data for Team 1
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const matchId = urlParams.get('matchId');
    fetch('/match/teams?matchId=' + matchId)
    .then(response => response.json())
    .then(data => {
        console.log("Teams: ", data);
        const team1NameElement = document.getElementById("team1-button");
        team1NameElement.textContent = data[0].name;
        const team2NameElement = document.getElementById("team2-button");
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
                    offense: stat.offensive_role,
                    defense: stat.defensive_role,
                    offenseTaregt: stat.offensive_target,
                    defenseTarget: stat.defensive_target,
                    offenseProperty: stat.offense_action_property,
                    defenseProperty: stat.defensive_action_property,
                    pointsScored: stat.points_scored,
                    blitzes: stat.blitzes,
                    fieldGoalsMade: stat.field_goals_successful,
                    fieldGoalsAttempted: stat.field_goals_attempted,
                    blitzGoalsMade: stat.blitz_goals_successful,
                    blitzGoalsAttempted: stat.blitz_goals_attempted,
                    tricks: stat.tricks,
                    metersAdvanced: Math.round(stat.advancements),
                    damage: Math.round(stat.damage),
                    pointsBlocked: stat.points_blocked,
                    steals: stat.steals,
                    metersDefended: Math.round(stat.defense)
                }
                console.log(player)
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
            <td>${playerData.offense}</td>
            <td>${playerData.defense}</td>
            <td>${playerData.pointsScored}</td>
            <td>${playerData.blitzes}</td>
            <td>${playerData.metersAdvanced}</td>
            <td>${playerData.metersDefended}</td>
            <td>${playerData.blitzGoalsMade} / ${playerData.blitzGoalsAttempted}</td>
            <td>${playerData.fieldGoalsMade} / ${playerData.fieldGoalsAttempted}</td>
            <td>${playerData.damage}</td>
            <td>${playerData.pointsBlocked}</td>
            <td>${playerData.steals}</td>
            <td>${playerData.tricks}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Function to switch between teams
function showTeamStats(teamId) {
    // Hide both teams
    document.getElementById('team1').style.display = 'none';
    document.getElementById('team2').style.display = 'none';

    // Remove 'active' class from both buttons
    document.getElementById('team1-button').classList.remove('active');
    document.getElementById('team2-button').classList.remove('active');

    // Show selected team and activate the corresponding button
    document.getElementById(teamId).style.display = 'block';
    document.getElementById(`${teamId}-button`).classList.add('active');
}
