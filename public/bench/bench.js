const offensePriorities = {
    Attack: "Target enemy",
    Protect: "Target teammate",
    Advance: "Target neither",
    Assist: "Target teammate",
    Score: "Target neither",
    Rest: "Target neither"
};

const defensePriorities = {
    Attack: "Target enemy",
    Protect: "Target teammate",
    Defend_Advance: "Target neither",
    Assist: "Target teammate",
    Defend_Score: "Target neither",
    Rest: "Target neither"
};

document.addEventListener('DOMContentLoaded', () => {
    const toggleButtons = document.querySelectorAll('.toggle-button');
    const lockButton = document.getElementById('lock-button');

    toggleButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.dataset.target;
            const targetList = document.getElementById(targetId);
            if (targetList.classList.contains('collapsed')) {
                targetList.classList.remove('collapsed');
                button.textContent = '▼';
            } else {
                targetList.classList.add('collapsed');
                button.textContent = '►';
            }
        });
    });

    lockButton.addEventListener('click', () => {
        const yourTeamPlayers = document.querySelectorAll('.your-team .player');
        yourTeamPlayers.forEach(player => {
            player.dataset.locked = 'true';
            if (player.dataset.location === 'bench') {
                const priorityDiv = player.querySelector('.priority');
                if (priorityDiv) {
                    priorityDiv.style.display = 'flex';
                }
            }
        });
    });


/**
 * Adds a new player to the specified team list.
 * @param {string} teamId - The ID of the team (e.g., 'your-team' or 'other-team').
 * @param {string} playerName - The name of the player.
 * @param {object} stats - An object containing the player's stats.
 */
function addPlayerToTeam(teamId, playerName, stats) {
    const sanitizedPlayerName = playerName.replace(/\s+/g, '_');
    const teamList = document.getElementById(`${teamId}-list`);
    const template = document.getElementById('player-template');
    const player = template.content.cloneNode(true).querySelector('.player');
    const priorityTemplate = document.getElementById('priority-template');

    if (!player) {
        console.error('Player template not found');
        return;
    }

    player.dataset.team = teamId;
    player.querySelector('.player-name').textContent = playerName;
    player.querySelector('.stats').textContent = `A: ${stats.A}, B: ${stats.B}, C: ${stats.C}, D: ${stats.D}`;
    player.className = 'player';
    player.dataset.team = teamId;
    player.dataset.locked = 'false';
    player.dataset.location = 'team';


    player.addEventListener('click', () => {
        const currentTeam = player.dataset.team;
        if (currentTeam === 'your-team' && player.dataset.locked === 'false') {
            const benchList = document.getElementById(`${currentTeam}-bench`);
            const teamList = document.getElementById(`${currentTeam}-list`);

            if (player.dataset.location === 'team') {
                if (benchList.children.length < 4) {
                    // Move player to the bench
                    teamList.removeChild(player);
                    benchList.appendChild(player);
                    player.dataset.location = 'bench';
                } else {
                    alert('Bench is full!');
                }
            } else if (player.dataset.location === 'bench') {
                // Move player back to the team
                benchList.removeChild(player);
                teamList.appendChild(player);
                player.dataset.location = 'team';
            }
        }
    });

    teamList.appendChild(player);

    // Add event listeners for priority dropdowns after appending the player to the DOM
    if(player.dataset.team === 'your-team') {
        const priorityDiv = priorityTemplate.content.cloneNode(true).querySelector('.priority');
        player.appendChild(priorityDiv);
        const offensePrioritySelect = priorityDiv.querySelector('.offense-priority-select');
        const defensePrioritySelect = priorityDiv.querySelector('.defense-priority-select');
        const offenseTargetMenu = priorityDiv.querySelector('.offense-target-menu');
        const offenseTargetSelect = priorityDiv.querySelector('.offense-target-select');
        const defenseTargetMenu = priorityDiv.querySelector('.defense-target-menu');
        const defenseTargetSelect = priorityDiv.querySelector('.defense-target-select');

        Object.entries(offensePriorities).forEach(([key]) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = key;
            offensePrioritySelect.appendChild(option);
        });

        Object.entries(defensePriorities).forEach(([key]) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = key;
            defensePrioritySelect.appendChild(option);
        });

        const updateTargetMenu = (priority, targetType, targetMenu, targetSelect) => {
            targetSelect.innerHTML = '';
            if (targetType === 'Target neither') {
                targetMenu.style.display = 'none';
            } else {
                targetMenu.style.display = 'block';
                const targetPlayers = targetType === 'enemy' ? document.querySelectorAll('.other-team .player[data-location="bench"]') : document.querySelectorAll('.your-team .player[data-location="bench"]');
                targetPlayers.forEach(targetPlayer => {
                    const playerName = targetPlayer.querySelector('div').textContent.trim();
                    const option = document.createElement('option');
                    option.value = playerName;
                    option.textContent = playerName;
                    targetSelect.appendChild(option);
                });
            }
        };

        offensePrioritySelect.addEventListener('change', (event) => {
            const selectedPriority = event.target.value;
            updateTargetMenu(selectedPriority, offensePriorities[selectedPriority].split(' ')[1], offenseTargetMenu, offenseTargetSelect);
        });

        defensePrioritySelect.addEventListener('change', (event) => {
            const selectedPriority = event.target.value;
            updateTargetMenu(selectedPriority, defensePriorities[selectedPriority].split(' ')[1], defenseTargetMenu, defenseTargetSelect);
        });
    }
}

// Example usage:
/*addPlayerToTeam('your-team', 'Player 7', { A: 10, B: 20, C: 30, D: 40 });
addPlayerToTeam('other-team', 'Player 8', { A: 15, B: 25, C: 35, D: 45 });
addPlayerToTeam('your-team', 'Player 1', { A: 10, B: 20, C: 30, D: 40 });
addPlayerToTeam('other-team', 'Player 2', { A: 15, B: 25, C: 35, D: 45 });
addPlayerToTeam('your-team', 'Player 3', { A: 10, B: 20, C: 30, D: 40 });
addPlayerToTeam('other-team', 'Player 4', { A: 15, B: 25, C: 35, D: 45 });
addPlayerToTeam('your-team', 'Player 5', { A: 10, B: 20, C: 30, D: 40 });
addPlayerToTeam('other-team', 'Player 6', { A: 15, B: 25, C: 35, D: 45 });
addPlayerToTeam('your-team', 'Player 10', { A: 10, B: 20, C: 30, D: 40 });
addPlayerToTeam('other-team', 'Player 11', { A: 15, B: 25, C: 35, D: 45 });
addPlayerToTeam('your-team', 'Player 9', { A: 10, B: 20, C: 30, D: 40 });*/

const urlParams = new URLSearchParams(window.location.search);
const teamId = urlParams.get('teamId');
const otherTeamId = urlParams.get('otherTeamId');

fetch(`http://localhost:3000/teams/${teamId}/players`)
    .then(response => response.json())
    .then(players => {
        if (Array.isArray(players)) {
            players.forEach(player => {
                addPlayerToTeam('your-team', player.name, {
                    A: player.bulk,
                    B: player.agility,
                    C: player.height,
                    D: player.strength
                });
            });
        } else {
            throw new Error('Players data is not an array');
        }
    })

fetch(`http://localhost:3000/teams/${otherTeamId}/players`)
    .then(response => response.json())
    .then(players => {
        if (Array.isArray(players)) {
            players.forEach(player => {
                addPlayerToTeam('other-team', player.name, {
                    A: player.bulk,
                    B: player.agility,
                    C: player.height,
                    D: player.strength
                });
            });
        } else {
            throw new Error('Players data is not an array');
        }
    })

});

