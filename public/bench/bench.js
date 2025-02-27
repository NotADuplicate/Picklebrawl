import { fetchData } from "../api.js";

const myTeamId = localStorage.getItem('myTeamId');

const urlParams = new URLSearchParams(window.location.search);
const challengedId = urlParams.get('challengedId');
const challengerId = urlParams.get('challengerId');
const challengeId = urlParams.get('challengeId');
const leagueName = localStorage.getItem('leagueName');
const token = localStorage.getItem('token');
const otherTeamId = (challengedId !== myTeamId) ? challengedId : challengerId;
const challenger = (challengerId === myTeamId) ? true : false;
let playerDict = {};
let startersLocked = false;
let actionsLocked = false;
let friendly = false;

let offensePriorities = {
    Rest: "Target neither",
    Advance: "Target finishing",
    Attack: "Target enemy",
    Protect: "Target teammate",
    Assist: "Target teammate",
    Score: "Target distance"
};

let defensePriorities = {
    Defend_Advance: "Target neither",
    Attack: "Target enemy",
    Protect: "Target teammate",
    Assist: "Target teammate",
    Defend_Score: "Target neither",
    Rest: "Target neither"
};

let prioritiesDescriptions = {
    Advance: "Use strength to move the ball forward. Trickiness can help avoid defenders with lower focus.",
    Score: "Use finesse to shoot the ball. Scoring is easier the further down the field you are. Multiple scorers split the defenders between scorers. Trickiness can help avoid defenders with lower focus.",
    Attack: "Use strength to attack an enemy.",
    Protect: "Use height to protect a teammate.",
    Assist: "Temporarily boost an ally's stats. All their stats are increased by the average of your finesse and the stat that you are increasing.",
    Rest: "Do nothing but increase the effectiveness of your other action",
    Defend_Advance: "Use bulk to prevent the enemy from moving the ball forward. Focus can prevent tricky advancers from avoiding you.",
    Defend_Score: "Use height to prevent the enemy from scoring. Focus can prevent tricky scorers from avoiding you."
}

document.addEventListener('DOMContentLoaded', () => {
    const toggleButtons = document.querySelectorAll('.toggle-button');
    const lockButton = document.getElementById('lock-button');
    const recommendButton = document.getElementById('reccomend-button');

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
        else if(lockButton.textContent === 'Lock In Actions') {
            lockActions();
        }
        else if(lockButton.textContent === 'Undo actions') {
            unlockActions();
        }
    });

    recommendButton.addEventListener('click', () => {
        console.log("Recommend button clicked");
        if(recommendButton.textContent === 'Recommend Starters') {
            recommendPlayers(myTeamId);
        }
        else if(recommendButton.textContent === 'Recommend Actions') {
            recommendActions(myTeamId);
        }
    });
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
    player.querySelector('.tooltip').textContent = quirkDescription;
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

        let hoverTimer;
        // Function to show tooltip after 1-second delay
        const showTooltip = (tooltip) => {
            hoverTimer = setTimeout(() => {
                tooltip.style.opacity = '1';
            }, 1000); // Delay in milliseconds (1000ms = 1s)
        };

        // Function to hide tooltip and clear timer
        const hideTooltip = (tooltip) => {
            clearTimeout(hoverTimer);
            tooltip.style.opacity = '0';
        };

        offensePrioritySelect.addEventListener('change', (event) => {
            const selectedPriority = event.target.value;
            updateTargetMenu(selectedPriority, offensePriorities[selectedPriority].split(' ')[1], offenseTargetMenu, offenseTargetSelect);
        });

        offensePrioritySelect.addEventListener('mouseover', () => {
            const priorityMenu = player.querySelector('.priority-menu');
            const tooltip = priorityMenu.querySelector('.tooltip');
            showTooltip(tooltip);
            tooltip.textContent = prioritiesDescriptions[offensePrioritySelect.value];
            //tooltip.style.opacity = '1';
        });
    
        offensePrioritySelect.addEventListener('mouseout', () => {
            const priorityMenu = player.querySelector('.priority-menu');
            hideTooltip(priorityMenu.querySelector('.tooltip'));
        });

        defensePrioritySelect.addEventListener('change', (event) => {
            const selectedPriority = event.target.value;
            updateTargetMenu(selectedPriority, defensePriorities[selectedPriority].split(' ')[1], defenseTargetMenu, defenseTargetSelect);
        });

        defensePrioritySelect.addEventListener('mouseover', () => {
            const priorityMenu = player.querySelector('.priority-menu');
            const tooltip = priorityMenu.querySelector('.tooltip');
            showTooltip(tooltip);
            tooltip.textContent = prioritiesDescriptions[defensePrioritySelect.value];
            //tooltip.style.opacity = '1';
        });
    
        defensePrioritySelect.addEventListener('mouseout', () => {
            const priorityMenu = player.querySelector('.priority-menu');
            hideTooltip(priorityMenu.querySelector('.tooltip'));
        });
    }
}

// Fetch and display team details
fetchData(`/teams/${myTeamId}`, 'GET', { 'Authorization': `Bearer ${token}` }, null, (team) => {
    const teamNameElement = document.getElementById('your-team-name');
    teamNameElement.textContent = team.name;
    const teamDetailsElement = document.getElementById('your-team-owner');
    teamDetailsElement.innerHTML = `
        <p>Owner: ${team.owner}</p>
    `;
});

fetchData(`/teams/${otherTeamId}`, 'GET', { 'Authorization': `Bearer ${token}` }, null, (team) => {
    const otherTeamNameElement = document.getElementById('other-team-name');
    otherTeamNameElement.textContent = team.name;
    const otherTeamDetailsElement = document.getElementById('other-team-owner');
    otherTeamDetailsElement.innerHTML = `
        <p>Owner: ${team.owner}</p>
    `;
});

fetchData(`/teams/${myTeamId}/players`, 'GET', { 'Authorization': `Bearer ${token}` }, null, (players) => {
    if (Array.isArray(players)) {
        players.forEach(player => {
            addPlayerToTeam('your-team', player.name, {
                Blk: player.bulk,
                Fin: player.finesse,
                Ht: player.height,
                Str: player.strength,
                Trk: player.trickiness,
                Fcs: player.focus
            }, player.id, player.quirk_title, player.quirk_description);
        });
        fetchData(`/teams/${otherTeamId}/players`, 'GET', { 'Authorization': `Bearer ${token}` }, null, (players) => {
            if (Array.isArray(players)) {
                players.forEach(player => {
                    addPlayerToTeam('other-team', player.name, {
                        Blk: player.bulk,
                        Fin: player.finesse,
                        Ht: player.height,
                        Str: player.strength,
                        Trk: player.trickiness,
                        Fcs: player.focus
                    }, player.id, player.quirk_title, player.quirk_description);
                });
                checkChallengeFlags();
            } else {
                console.log('Players data is not an array');
                throw new Error('Players data is not an array');
            }
        });
    }
    else {
        console.log("Players data is not an array");
        throw new Error('Players data is not an array');
    }
});

document.getElementById('backButton').addEventListener('click', function() {
    window.location.href = `../league/league.html?league=${leagueName}`;
});

function checkChallengeFlags() {
    fetchData(`/challenges/${challengeId}/players-actions`, 'GET', { 'Authorization': `Bearer ${token}` }, null, (response) => {
        const lockButton = document.getElementById('lock-button');
        console.log("Challenge players: ", response);
        const playerIds = [];
        if (response.playersActions !== null) {
            response.playersActions.forEach(playerAction => {
                playerIds.push(playerAction.player_id);
            });
        }
        friendly = response.flags.friendly;
        //If all players set
        if(response.flags.challengerPlayersSet && response.flags.challengedPlayersSet) {
            if(response.flags.challengedActionsSet && response.flags.challengerActionsSet) {
                console.log("All actions set, starting match");
                goToMatch(challengeId);
            }
            bothTeamsReady(playerIds, lockButton);
            getActions(response);
        }
        else if(response.flags.challengerPlayersSet && challenger || response.flags.challengedPlayersSet && !challenger) { //if your players are set
            for(let i = 0; i < playerIds.length; i++) {
                const id = playerIds[i];
                selectPlayer(playerDict[id]);
                playerDict[id].dataset.locked = true;
                playerDict[id].classList.add('locked');
            }
            lockButton.textContent = 'Undo';
            startersLocked = true;
        }
        else if(response.flags.challengerPlayersSet && !challenger || response.flags.challengedPlayersSet && challenger) {
            const readyDiv = document.getElementById('other-team-ready');
            readyDiv.textContent = 'STARTERS LOCKED';
            readyDiv.style.color = 'darkgreen';
        }
    }
    , (error) => {
        console.error('Error fetching player actions:', error);
    }
    );
}

async function lockStarters() {
    console.log("Lock starters")
    if(startersLocked == false) {
        const lockButton = document.getElementById('lock-button');
        const yourTeamPlayers = document.querySelectorAll('.your-team .player');
        let starterIds = [];
        yourTeamPlayers.forEach(player => {
            player.dataset.locked = 'true';
            player.classList.add('locked');
            if (player.dataset.location === 'bench') {
                starterIds.push(player.dataset.playerId);
            }
        });

        if(starterIds.length < 4) {
            const result = await showConfirmModal();
            if (!result) {
                yourTeamPlayers.forEach(player => {
                    if (player.dataset.locked === 'true') {
                        player.dataset.locked = 'false';
                        player.classList.remove('locked');
                    }
                });
                return;
            }
        }
        lockButton.textContent = 'Undo';
        const teamId = myTeamId;
        const players = starterIds;
        fetchData(`/challenges/${challengeId}/add-players`, 'POST', { 'Authorization': `Bearer ${token}` }, { teamId, players }, (data) => {
            console.log('Players added successfully:', data);
            startersLocked = true;
            checkChallengeFlags();
        }, (error) => {
            console.error('Error adding players:', error);
        });
    }
}

function unlockStarters() {
    console.log("Starters locked: ", startersLocked);
    if(startersLocked == true) {
    console.log("Unlocking starters")
    startersLocked = false;
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

    fetchData(`/challenges/${challengeId}/remove-players`, 'POST', { 'Authorization': `Bearer ${token}` }, { teamId, players }, (data) => {
        if(data.message === 'Players already removed') {
            console.log("Players have already been removed!");
            return;
        }
        else if(data.message === 'Players already locked in') {
            console.log("Actions have already been set!");
            checkChallengeFlags();
            return;
        }
        console.log('Players removed successfully:', data);
        yourTeamPlayers.forEach(player => {
            if (player.dataset.locked === 'true') {
                player.dataset.locked = 'false';
                player.classList.remove('locked');
            }
        });
        const lockButton = document.getElementById('lock-button');
        lockButton.textContent = 'Lock In Starters';
    }, (error) => {
        console.log('Error adding players:', error);
    });
    }
}

function selectPlayer(player) {
    const currentTeam = player.dataset.team;
    if (player.dataset.locked === 'false') {
        const benchList = document.getElementById(`${currentTeam}-bench`);
        const teamList = document.getElementById(`${currentTeam}-list`);

        if (player.dataset.location === 'team') {
            if (benchList.children.length < 4) {
                // Move player to the bench
                teamList.removeChild(player);
                benchList.appendChild(player);
                player.dataset.location = 'bench';
                player.classList.add('selected');
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
            player.classList.remove('selected');
            player.style.width = '';       // Reset inline width
            player.style.display = '';     // Reset inline display
            player.style.backgroundColor = ''; // Reset inline background-color
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
    if(actionsLocked == false) {
    const yourTeamPlayers = document.querySelectorAll('.your-team .player');
    let playerIds = [];
    let offenseActions = [];
    let defenseActions = [];
    let offenseTargets = [];
    let defenseTargets = [];
    let offenseProperties = [];
    let defenseProperties = [];
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
            if (offenseTargetSelect.value.includes('Property')) {
                const [property, ...rest] = offenseTargetSelect.value.split(' ');
                offenseProperties.push(rest.join(' '));
                offenseTargets.push(null);
            }
            else if (offenseTargetSelect.textContent !== '') {
                console.log("Offense target: ", offenseTargetSelect);
                offenseProperties.push(null);
                offenseTargets.push(offenseTargetSelect.value);
            }
            else {
                offenseProperties.push(null);
                offenseTargets.push(null);
            }
            console.log("Defense target: ", defenseTargetSelect);
            console.log("Defense target value: ", defenseTargetSelect.value);
            console.log("Defense target text: ", defenseTargetSelect.textContent); 
            if (defenseTargetSelect.value.includes('Property')) {
                console.log("Pushing property: ", defenseTargetSelect.value); 
                const [property, ...rest] = defenseTargetSelect.value.split(' ');
                defenseProperties.push(rest.join(' '));
                defenseTargets.push(null);
            }
            else if (defenseTargetSelect.textContent !== '') {
                defenseProperties.push(null);
                defenseTargets.push(defenseTargetSelect.value);
                console.log("Pushing defense value: ", defenseTargetSelect.value);
            }
            else {
                defenseProperties.push(null);
                defenseTargets.push(null);
                console.log("Pushing null");
            }
        }
    });
    const teamId = myTeamId;
    const players = playerIds;
    console.log("Defnese targets: ", defenseTargets);
    fetchData(`/challenges/${challengeId}/add-actions`, 'POST', { 'Authorization': `Bearer ${token}` }, { teamId, players, offenseActions, offenseTargets, defenseActions, defenseTargets, offenseProperties, defenseProperties }, (data) => {
        console.log('Actions added successfully:', data);
        actionsLocked = true;
        const lockButton = document.getElementById('lock-button');
        lockButton.textContent = 'Undo actions';
        checkChallengeFlags();
    }, (error) => {
        console.error('Error adding players:', error);
    });
    }
}

function unlockActions() {
    if(actionsLocked == true) {
    const yourTeamPlayers = document.querySelectorAll('.your-team .player');
    const teamId = myTeamId;

    fetchData(`/challenges/${challengeId}/players-actions`, 'POST', { 'Authorization': `Bearer ${token}` }, {teamId}, (response) => {
        const playerIds = [];
        if (response.playersActions !== null) {
            response.playersActions.forEach(playerAction => {
                playerIds.push(playerAction.player_id);
            });
        }
        if(response.flags.challengerActionsSet && response.flags.challengedActionsSet) {
            console.log("All actions set, starting match");
            goToMatch(challengeId);
        }
        else if(response.flags.challengerActionsSet && challenger || response.flags.challengedActionsSet && !challenger) { //if your actions are set
            for(let i = 0; i < playerIds.length; i++) {
                if(playerIds[i].team_id == myTeamId) {
                    const action = playerIds[i];
                    setAction(action, false);
                }
            }
            const lockButton = document.getElementById('lock-button');
            lockButton.textContent = 'Lock In Actions';
        }
        else if(response.flags.challengerActionsSet && !challenger || response.flags.challengedActionsSet && challenger) {
            const readyDiv = document.getElementById('other-team-ready');
            readyDiv.textContent = 'ACTIONS LOCKED';
            readyDiv.style.color = 'darkgreen';
        }
    }, (error) => {
        console.log('Error fetching player actions:', error);
    });
    }
}

function bothTeamsReady(playerIds, lockButton) {
    console.log("All players are set");
    let teamPlayerIds = [];
    for(let i = 0; i < playerIds.length; i++) {
        const id = playerIds[i];
        selectPlayer(playerDict[id]);
        playerDict[id].dataset.locked = true;
        playerDict[id].classList.add('locked');
        if(playerDict[id].dataset.team === 'your-team') {
            teamPlayerIds.push(id);
        }
        lockButton.textContent = 'Lock In Actions';
        const recommendButton = document.getElementById('reccomend-button');
        recommendButton.textContent = 'Recommend Actions';
    }

    applyQuirkStats();

    //Add quirk actions
    fetchData(`/challenges/${challengeId}/quirk-actions`, 'POST', { 'Authorization': `Bearer ${token}` }, { ids: teamPlayerIds }, (data) => {
        console.log('Quirk actions added successfully:', data);
        data.forEach(action => {
            console.log(action);
            const player = playerDict[action.playerId];
            Object.entries(action.action).forEach(([key]) => {
                prioritiesDescriptions[key] = action.action[key].description;
                if(action.action[key].offense) {
                    const option = document.createElement('option');
                    option.value = key;
                    option.textContent = key;
                    console.log("Offense: ", action.action[key].target);
                    offensePriorities[key] = action.action[key].target;
                    player.querySelector('.offense-priority-select').appendChild(option);

                }
                if(action.action[key].defense) {
                    const option = document.createElement('option');
                    option.value = key;
                    option.textContent = key;
                    defensePriorities[key] = action.action[key].target;
                    player.querySelector('.defense-priority-select').appendChild(option);
                }
            });
        });
    }, (error) => {
        console.log('Error adding quirk actions:', error);
    });

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
    else if(response.flags.challengerActionsSet && challenger || response.flags.challengedActionsSet && !challenger) { //if your actions are set
        console.log("My actions are set");
        const playerActions = response.playersActions;
        actionsLocked = true;
        for(let i = 0; i < playerActions.length; i++) {
            if(playerActions[i].team_id == myTeamId) {
                const action = playerActions[i];
                setAction(action, true);
            }
        }
        const lockButton = document.getElementById('lock-button');
        lockButton.textContent = 'Undo actions';
    }
    else if(response.flags.challengerActionsSet && !challenger || response.flags.challengedActionsSet && challenger) {
        const readyDiv = document.getElementById('other-team-ready');
        readyDiv.textContent = 'ACTIONS LOCKED';
        readyDiv.style.color = 'darkgreen';
    }
}

function applyQuirkStats() {
    const playerElements = document.querySelectorAll('.player');
    const benchPlayers = Array.from(playerElements).filter(playerElement => playerElement.dataset.location === 'bench');
    let ids = [];
    let teamIds = [];
    benchPlayers.forEach(player => {
        ids.push(player.dataset.playerId);
        teamIds.push(player.dataset.team);
    });

    console.log(ids)
    fetchData(`/challenges/${challengeId}/quirk-effects`, 'POST', { 'Authorization': `Bearer ${token}` }, { ids }, (data) => {
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
                const stats = JSON.parse(playerElement.dataset.stats);
                const originalStatValue = stats[stat];
                const newStatValue = playerStats[stat];

                statElement.textContent = newStatValue;

                if (newStatValue > originalStatValue) {
                    statElement.style.fontWeight = 'bold';
                    statElement.style.color = 'green';
                } else if(newStatValue < originalStatValue) {
                    statElement.style.fontWeight = 'bold';
                    statElement.style.color = 'red';
                } else {
                    statElement.style.color = 'black';
                    statElement.style.fontWeight = 'normal';
                }
            });
        });
    }, (error) => {
        console.error('Error applying quirk stats:', error);
    });
}

function updateTargetMenu(priority, targetType, targetMenu, targetSelect) {
    console.log(targetType);
    targetSelect.innerHTML = '';
    if (targetType === 'neither') {
        console.log("Target neither");
        targetMenu.style.display = 'none';
    } else if(targetType === 'distance' || targetType === 'finishing') {
        targetMenu.style.display = 'block';
        let options = [];
        if(targetType === 'distance') {
            options = ['Close', 'Medium', 'Far', 'Half Field', 'Full Field'];
        }
        else if(targetType === 'finishing') {
            options = ['Attempt Score', 'Blitz'];
        }
        options.forEach(optionText => {
            const option = document.createElement('option');
            option.value = "Property " + optionText;
            option.textContent = optionText;
            targetSelect.appendChild(option);
        });
    }
    else {
        targetMenu.style.display = 'block';
        let targetPlayers = [];
        if(targetType === 'either') {
            targetPlayers = document.querySelectorAll('.player[data-location="bench"]')
        }
        else if(targetType === 'teammate') {
            targetPlayers = document.querySelectorAll('.your-team .player[data-location="bench"]')
        }
        else if(targetType === 'enemy') {
            targetPlayers = document.querySelectorAll('.other-team .player[data-location="bench"]');
        }
        targetPlayers.forEach(targetPlayer => {
            const playerName = targetPlayer.querySelector('.player-name').textContent.trim();
            const option = document.createElement('option');
            option.value = targetPlayer.dataset.playerId;
            option.textContent = playerName;
            targetSelect.appendChild(option);
        });
        const option = document.createElement('option');
        option.value = "Property Any";
        option.textContent = "Any";
        targetSelect.appendChild(option);
    }
}

function setAction(action, disabled) {
    console.log("Action: ", action);
    const player = playerDict[action.player_id];
    console.log("Player: ", player);
    const priorityDiv = player.querySelector('.priority');
    const offensePrioritySelect = priorityDiv.querySelector('.offense-priority-select');
    const defensePrioritySelect = priorityDiv.querySelector('.defense-priority-select');
    const offenseTargetSelect = priorityDiv.querySelector('.offense-target-select');
    const defenseTargetSelect = priorityDiv.querySelector('.defense-target-select');
    offensePrioritySelect.value = action.offense_action;
    defensePrioritySelect.value = action.defense_action;
    updateTargetMenu(action.offense_action, offensePriorities[action.offense_action].split(' ')[1], offenseTargetSelect.parentElement, offenseTargetSelect);
    updateTargetMenu(action.defense_action, defensePriorities[action.defense_action].split(' ')[1], defenseTargetSelect.parentElement, defenseTargetSelect);
    console.log("Target menus");
    if(action.offense_target_id != "" && action.offense_target_id != null) {
        const offenseTargetOption = Array.from(offenseTargetSelect.options).find(option => option.value == action.offense_target_id);
        console.log(offenseTargetOption);
        if (offenseTargetOption) {
            offenseTargetOption.selected = true;
            console.log("Offense target: ", offenseTargetOption.textContent);
        }
    }
    else if(action.offense_property != "" && action.offense_property != null) {
        console.log("Offense property: ", action.offense_property);
        const offenseTargetOption = Array.from(offenseTargetSelect.options).find(option => option.value === "Property " + action.offense_property);
        if (offenseTargetOption) {
            offenseTargetOption.selected = true;
            console.log("Offense target: ", offenseTargetOption.textContent);
        }  
    }
    if(action.defense_target_id != "" && action.defense_target_id != null) {
        const defenseTargetOption = Array.from(defenseTargetSelect.options).find(option => option.value == action.defense_target_id);
        if (defenseTargetOption) {
            defenseTargetOption.selected = true;
        }
    }
    else if(action.defense_property != "" && action.defense_property != null) {
        console.log("Defense property: ", action.defense_property);
        const defenseTargetOption = Array.from(defenseTargetSelect.options).find(option => option.value === "Property " + action.defense_property);
        if (defenseTargetOption) {
            defenseTargetOption.selected = true;
        }
    }
    offensePrioritySelect.disabled = disabled;
    defensePrioritySelect.disabled = disabled;
    offenseTargetSelect.disabled = disabled;
    defenseTargetSelect.disabled = disabled;
}

function recommendPlayers(teamId) {
    console.log("Recommending")
    fetchData(`/challenges/${teamId}/recommend-players`, 'GET', { 'Authorization': `Bearer ${token}` }, null, (data) => {
        console.log('Recommended players:', data);
        const yourTeamPlayers = document.querySelectorAll('.your-team .player');
        yourTeamPlayers.forEach(player => {
            if (player.dataset.location === 'bench') {
                selectPlayer(player);
            }
        });
        data.forEach(playerId => {
            const player = playerDict[playerId];
            selectPlayer(player);
        });
    }, (error) => {
        console.error('Error recommending players:', error);
    });
    /*fetch(`/challenges/${teamId}/recommend-players`)
    .then(response => response.json())
    .then(data => {
        console.log('Recommended players:', data);
        const yourTeamPlayers = document.querySelectorAll('.your-team .player');
        yourTeamPlayers.forEach(player => {
            if (player.dataset.location === 'bench') {
                selectPlayer(player);
            }
        });
        data.forEach(playerId => {
            const player = playerDict[playerId];
            selectPlayer(player);
        });
    });*/
}

function recommendActions(teamId) {
    fetchData(`/challenges/${teamId}/recommend-actions`, 'GET', { 'Authorization': `Bearer ${token}` }, null, (data) => {
        console.log('Recommended actions:', data);
        data.forEach(action => {
            setAction(action, false);
        });
    }, (error) => {
        console.error('Error recommending actions:', error);
    });
    /*fetch(`/challenges/${teamId}/recommend-actions`)
    .then(response => response.json())
    .then(data => {
        console.log('Recommended actions:', data);
        data.forEach(action => {
            setAction(action, false);
        });
    });*/
}

async function goToMatch(challengeId) {
    await new Promise(resolve => setTimeout(resolve, 100));
    window.location.href = '../match/match.html?challengeId=' + challengeId;
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