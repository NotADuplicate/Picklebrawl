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
    Advance: "Target neither",
    Attack: "Target enemy",
    Protect: "Target teammate",
    Assist: "Target teammate",
    Score: "Target neither",
    Rest: "Target neither"
};

const defensePriorities = {
    Defend_Advance: "Target neither",
    Attack: "Target enemy",
    Protect: "Target teammate",
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
        else if(lockButton.textContent === 'Lock in actions') {
            lockActions();
        }
    });


/**
 * Adds a new player to the specified team list.
 * @param {string} teamId - The ID of the team (e.g., 'your-team' or 'other-team').
 * @param {string} playerName - The name of the player.
 * @param {object} stats - An object containing the player's stats.
 */
function addPlayerToTeam(teamId, playerName, stats, playerId, playerQuirk, quirkDescription) {
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
    player.querySelector('.quirk .quirk-name').textContent = playerQuirk;
    player.querySelector('.quirk .tooltip').textContent = quirkDescription;
    const playerStats = {
        Blk: stats.Blk,
        Fin: stats.Fin,
        Ht: stats.Ht,
        Str: stats.Str,
        Trk: stats.Trk,
        Fcs: stats.Fcs
    };
    
    Object.keys(playerStats).forEach(stat => {
        const statElement = player.querySelector(`.stat[data-stat="${stat}"] .stat-value`);
        statElement.textContent = stats[stat];
    });
    
    player.className = 'player';
    player.dataset.team = teamId;
    player.dataset.locked = 'false';
    player.dataset.location = 'team';

    player.dataset.playerId = playerId;
    player.dataset.bulk = stats.Blk;
    player.dataset.finesse = stats.Fin;
    player.dataset.height = stats.Ht;
    player.dataset.strength = stats.Str;
    player.dataset.trickiness = stats.Trk;
    player.dataset.focus = stats.Fcs;
    player.dataset.quirkTitle = playerQuirk;
    player.dataset.stats = JSON.stringify(stats);
    
    console.log(stats);


    player.addEventListener('click', () => {
        if(player.dataset.team === 'your-team') {
            selectPlayer(player);
        }
    });

    teamList.appendChild(player);

    // Add event listeners for priority dropdowns after appending the player to the DOM
    if(player.dataset.team === 'your-team') {
        //const priorityDiv = priorityTemplate.content.cloneNode(true).querySelector('.priority');
        //player.appendChild(priorityDiv);
        const offensePrioritySelect = player.querySelector('.offense-priority-select');
        const defensePrioritySelect = player.querySelector('.defense-priority-select');
        const offenseTargetMenu = player.querySelector('.offense-target-menu');
        const offenseTargetSelect = player.querySelector('.offense-target-select');
        const defenseTargetMenu = player.querySelector('.defense-target-menu');
        const defenseTargetSelect = player.querySelector('.defense-target-select');

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
                    const playerName = targetPlayer.querySelector('.player-name').textContent.trim();
                    const option = document.createElement('option');
                    option.value = targetPlayer.dataset.playerId;
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
                }, player.id, player.quirk_title, player.quirk_description);
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
                bothTeamsReady(playerIds, lockButton);
                getActions(response);
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
    //console.log("Selecting player: ", player);
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
                applyQuirkStats();
            } else {
                alert('Bench is full!');
            }
        } else if (player.dataset.location === 'bench') {
            // Move player back to the team
            benchList.removeChild(player);
            teamList.appendChild(player);
            player.dataset.location = 'team';
            stats = JSON.parse(player.dataset.stats);
            Object.keys(stats).forEach(stat => {
                const statElement = player.querySelector(`.stat[data-stat="${stat}"] .stat-value`);
                statElement.textContent = stats[stat];
                statElement.style.color = 'black';
                statElement.style.fontWeight = 'normal';
            });
            applyQuirkStats();
        }
    }
}

function lockActions() {
    const yourTeamPlayers = document.querySelectorAll('.your-team .player');
            let playerIds = [];
            let offenseActions = [];
            let defenseActions = [];
            let offenseTargets = [];
            let defenseTargets = [];
            yourTeamPlayers.forEach(player => {
                if (player.dataset.location === 'bench') {
                    playerIds.push(player.dataset.playerId);
                    const priorityDiv = player.querySelector('.priority');
                    const offensePrioritySelect = priorityDiv.querySelector('.offense-priority-select');
                    const defensePrioritySelect = priorityDiv.querySelector('.defense-priority-select');
                    const offenseTargetSelect = priorityDiv.querySelector('.offense-target-select');
                    const defenseTargetSelect = priorityDiv.querySelector('.defense-target-select');
                    offenseActions.push(offensePrioritySelect.value);
                    defenseActions.push(defensePrioritySelect.value);
                    offenseTargets.push(offenseTargetSelect.value);
                    defenseTargets.push(defenseTargetSelect.value);
                }
            });
            const teamId = myTeamId;
            const players = playerIds;
            console.log(players);
            fetch(`http://localhost:3000/challenges/${challengeId}/add-actions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ teamId, players, offenseActions, offenseTargets, defenseActions, defenseTargets })
            })
                .then(response => response.json())
                .then(data => {
                    console.log('Actions added successfully:', data);
                    lockButton.textContent = 'Undo';
                    window.location.reload();
                })
                .catch(error => {
                    console.error('Error adding players:', error);
                });
}

function bothTeamsReady(playerIds, lockButton) {
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
                player.classList.add('show-priority');
            }
        }
    });
}

function getActions(response) {
    console.log("Getting actions");
    console.log(response);
    if(response.flags.challengerActionsSet && response.flags.challengedActionsSet) {
        console.log("All actions set, starting match");
    }
    else if(response.flags.challengerActionsSet && challenger || response.flags.challengedActionsSet && !challenger) {
        console.log("Setting actions");
        const playerActions = response.playersActions;
        for(let i = 0; i < playerActions.length; i++) {
            if(playerActions[i].team_id == myTeamId) {
                const action = playerActions[i];
                console.log("Action: ", action);
                const player = playerDict[action.player_id];
                console.log("Player: ", player);
                const priorityDiv = player.querySelector('.priority');
                console.log(priorityDiv);
                const offensePrioritySelect = priorityDiv.querySelector('.offense-priority-select');
                const defensePrioritySelect = priorityDiv.querySelector('.defense-priority-select');
                const offenseTargetSelect = priorityDiv.querySelector('.offense-target-select');
                const defenseTargetSelect = priorityDiv.querySelector('.defense-target-select');
                offensePrioritySelect.value = action.offense_action;
                defensePrioritySelect.value = action.defense_action;
                offenseTargetSelect.value = action.offense_target_id;
                defenseTargetSelect.value = action.defense_target_id;

                offenseTargetSelect.textContent = playerDict[action.offense_target_id].querySelector('.player-name').textContent;
                defenseTargetSelect.textContent = playerDict[action.defense_target_id].querySelector('.player-name').textContent;
                offensePrioritySelect.disabled = true;
                defensePrioritySelect.disabled = true;
                offenseTargetSelect.disabled = true;
                defenseTargetSelect.disabled = true;
            }
        }
        const readyDiv = document.getElementById('other-team-ready');
        readyDiv.textContent = 'READY';
        readyDiv.style.color = 'darkgreen';
    }
}

function applyQuirkStats() {
    const playerElements = document.querySelectorAll('.player');
    const benchPlayers = Array.from(playerElements).filter(playerElement => playerElement.dataset.location === 'bench');
    let ids = [];
    benchPlayers.forEach(player => {
        ids.push(player.dataset.playerId);
    });

    fetch(`http://localhost:3000/challenges/${challengeId}/quirk-effects`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids })
    })
    .then(response => response.json())
    .then(data => {
        console.log(data)
        data.forEach(player => {
            const playerElement = playerDict[player.id];
            const playerStats = {
                Blk: player.bulk,
                Fin: player.finesse,
                Ht: player.height,
                Str: player.strength,
                Trk: player.trickiness,
                Fcs: player.focus
            };
            Object.keys(playerStats).forEach(stat => {
                const statElement = playerElement.querySelector(`.stat[data-stat="${stat}"] .stat-value`);
                console.log(stat)
                const stats = JSON.parse(playerElement.dataset.stats);
                const originalStatValue = stats[stat];
                const newStatValue = playerStats[stat];

                statElement.textContent = newStatValue;
                console.log("Original: " + originalStatValue + " New: " + newStatValue);

                if (newStatValue > originalStatValue) {
                    console.log("Green")
                    statElement.style.fontWeight = 'bold';
                    statElement.style.color = 'darkgreen';
                } else if(newStatValue < originalStatValue) {
                    console.log("Red")
                    statElement.style.fontWeight = 'bold';
                    statElement.style.color = 'darkred';
                } else {
                    statElement.style.color = 'black';
                    statElement.style.fontWeight = 'normal';
                }
            });
        });
    });
}