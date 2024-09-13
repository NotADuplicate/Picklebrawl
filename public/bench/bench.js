const myTeamId = localStorage.getItem('myTeamId');

const urlParams = new URLSearchParams(window.location.search);
const challengedId = urlParams.get('challengedId');
const challengerId = urlParams.get('challengerId');
const challengeId = urlParams.get('challengeId');
const leagueName = localStorage.getItem('leagueName');
const otherTeamId = (challengedId !== myTeamId) ? challengedId : challengerId;
const challenger = (challengerId === myTeamId) ? true : false;
console.log("Challenger: " + challenger);
let playerDict = {};
let startersLocked = false;

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
        if(lockButton.textContent === 'Lock In Starters') {
            lockStarters();
        }
        else if(lockButton.textContent === 'Undo') {
            unlockStarters();
        }
    });


/**
 * Adds a new player to the specified team list.
 * @param {string} teamId - The ID of the team (e.g., 'your-team' or 'other-team').
 * @param {string} playerName - The name of the player.
 * @param {object} stats - An object containing the player's stats.
 */
function addPlayerToTeam(teamId, playerName, stats, playerId) {
    const sanitizedPlayerName = playerName.replace(/\s+/g, '_');
    const teamList = document.getElementById(`${teamId}-list`);
    const template = document.getElementById('player-template');
    const player = template.content.cloneNode(true).querySelector('.player');
    playerDict[playerId] = player;
    playerDict[playerId].dataset.team = teamId;
    const priorityTemplate = document.getElementById('priority-template');

    if (!player) {
        console.error('Player template not found');
        return;
    }

    player.dataset.team = teamId;
    player.querySelector('.player-name').textContent = playerName;
    player.querySelector('.stats').textContent = `Blk: ${stats.Blk}, Fin: ${stats.Fin}, Ht: ${stats.Ht}, Str: ${stats.Str}, Trk: ${stats.Trk}, Fcs: ${stats.Fcs}`;
    player.className = 'player';
    player.dataset.team = teamId;
    player.dataset.locked = 'false';
    player.dataset.location = 'team';
    player.dataset.playerId = playerId;


    player.addEventListener('click', () => {
        if(player.dataset.team === 'your-team') {
            selectPlayer(player);
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
            console.log(targetType);
            targetSelect.innerHTML = '';
            if (targetType === 'neither') {
                console.log("Target neither");
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
            console.log(event.target.value + ": " + offensePriorities[event.target.value]);
            const selectedPriority = event.target.value;
            updateTargetMenu(selectedPriority, offensePriorities[selectedPriority].split(' ')[1], offenseTargetMenu, offenseTargetSelect);
        });

        defensePrioritySelect.addEventListener('change', (event) => {
            const selectedPriority = event.target.value;
            updateTargetMenu(selectedPriority, defensePriorities[selectedPriority].split(' ')[1], defenseTargetMenu, defenseTargetSelect);
        });
    }
}

fetch(`http://localhost:3000/teams/${myTeamId}/players`)
    .then(response => response.json())
    .then(players => {
        if (Array.isArray(players)) {
            players.forEach(player => {
                console.log(player);
                addPlayerToTeam('your-team', player.name, {
                    Blk: player.bulk,
                    Fin: player.finesse,
                    Ht: player.height,
                    Str: player.strength,
                    Trk: player.trickiness,
                    Fcs: player.focus
                }, player.id);
            });
        } else {
            throw new Error('Players data is not an array');
        }
        console.log("Got all my players")
    })

fetch(`http://localhost:3000/teams/${otherTeamId}/players`)
    .then(response => response.json())
    .then(players => {
        if (Array.isArray(players)) {
            players.forEach(player => {
                addPlayerToTeam('other-team', player.name, {
                    Blk: player.bulk,
                    Fin: player.finesse,
                    Ht: player.height,
                    Str: player.strength,
                    Trk: player.trickiness,
                    Fcs: player.focus
                }, player.id);
            });
        } else {
            throw new Error('Players data is not an array');
        }
    })

    console.log("Challenge ID: " + challengeId);
    fetch(`http://localhost:3000/challenges/${challengeId}/players-actions`)
        .then(response => response.json())
        .then(response => {
            console.log("Challenge players: ", response);
            const playerIds = [];
            if (response.playersActions !== null) {
                response.playersActions.forEach(playerAction => {
                    playerIds.push(playerAction.player_id);
                });
            }
            if(response.flags.challengerPlayersSet && response.flags.challengedPlayersSet) {
                console.log("All players are set");
                for(let i = 0; i < playerIds.length; i++) {
                    const id = playerIds[i];
                    selectPlayer(playerDict[id]);
                    playerDict[id].dataset.locked = true;
                    playerDict[id].classList.add('locked');
                    lockButton.textContent = 'Lock in actions';
                }
                const yourTeamPlayers = document.querySelectorAll('.your-team .player');
                yourTeamPlayers.forEach(player => {
                    if (player.dataset.location === 'bench') {
                        const priorityDiv = player.querySelector('.priority');
                        if (priorityDiv) {
                            priorityDiv.style.display = 'flex';
                        }
                    }
                });
            }
            else if(response.flags.challengerPlayersSet && challenger || response.flags.challengedPlayersSet && !challenger) {
                console.log("Setting players");
                console.log(playerIds);
                for(let i = 0; i < playerIds.length; i++) {
                    const id = playerIds[i];
                    selectPlayer(playerDict[id]);
                    playerDict[id].dataset.locked = true;
                    playerDict[id].classList.add('locked');
                }
                lockButton.textContent = 'Undo';
            }
            else if(response.flags.challengerPlayersSet && !challenger || response.flags.challengedPlayersSet && challenger) {
                const readyDiv = document.getElementById('other-team-ready');
                readyDiv.textContent = 'READY';
                readyDiv.style.color = 'darkgreen';
            }
        })
        .catch(error => {
            console.error('Error fetching player actions:', error);
        });
});

document.getElementById('backButton').addEventListener('click', function() {
    window.location.href = `../league/league.html?league=${leagueName}`;
});

function lockStarters() {
    if(startersLocked == false) {
        const lockButton = document.getElementById('lock-button');
        lockButton.textContent = 'Undo';
        console.log("Lock")
        const yourTeamPlayers = document.querySelectorAll('.your-team .player');
        let starterIds = [];
        yourTeamPlayers.forEach(player => {
            player.dataset.locked = 'true';
            player.classList.add('locked');
            if (player.dataset.location === 'bench') {
                starterIds.push(player.dataset.playerId);
            }
        });

        const teamId = myTeamId;
        const players = starterIds;
        console.log(players)
        fetch(`http://localhost:3000/challenges/${challengeId}/add-players`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ teamId, players })
        })
            .then(response => response.json())
            .then(data => {
                console.log('Players added successfully:', data);
                startersLocked = true;
                const readyDiv = document.getElementById('other-team-ready');
                if(readyDiv.textContent === 'READY') {
                    window.location.reload();
                }
            })
            .catch(error => {
                console.error('Error adding players:', error);
            });

    }
}

function unlockStarters() {
    const yourTeamPlayers = document.querySelectorAll('.your-team .player');
    let starterIds = [];
    yourTeamPlayers.forEach(player => {
        player.dataset.locked = 'true';
        player.classList.add('locked');
        if (player.dataset.location === 'bench') {
            starterIds.push(player.dataset.playerId);
        }
    });
    const teamId = myTeamId;
    const players = starterIds;

    fetch(`http://localhost:3000/challenges/${challengeId}/remove-players`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ teamId, players })
    })
        .then(response => response.json())
        .then(data => {
            console.log('Players removed successfully:', data);
            yourTeamPlayers.forEach(player => {
                if (player.dataset.locked === 'true') {
                    player.dataset.locked = 'false';
                    player.classList.remove('locked');
                }
            });
            lockButton.textContent = 'Lock In Starters';
        })
        .catch(error => {
            console.error('Error adding players:', error);
        });
}

function selectPlayer(player) {
    console.log("Selecting player: ", player);
    const currentTeam = player.dataset.team;
    console.log("Current team: ", currentTeam);
    if (player.dataset.locked === 'false') {
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
}