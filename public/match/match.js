let possession = null;
let homeTeamId = null;
let homeTeamName = null;
let awayTeamName = null;
let players = {};
let gameOver = false;
document.addEventListener('DOMContentLoaded', () => {
    let tick = 1;
    const urlParams = new URLSearchParams(window.location.search);
    let matchId = urlParams.get('matchId');
    if (!matchId) {
        const challengeId = urlParams.get('challengeId');
        if (challengeId) {
            console.log("Challenge ID: ", challengeId);
            fetch('http://localhost:3000/match/match-id?challengeId=' + challengeId)
                .then(response => response.json())
                .then(data => {
                    console.log("Match ID: ", data);
                    matchId = data.id;
                    getTeams(matchId);
                    getPlayers(matchId);
                    showGame(matchId);
                })
                .catch(error => {
                    console.error('Error fetching matchId from challengeId:', error);
                });
            return; // Exit the function to wait for the fetch request
        } else {
            console.error('No matchId or challengeId provided in URL');
            return; // Exit the function if neither matchId nor challengeId is provided
        }
    } else {
        getTeams(matchId);
        getPlayers(matchId);
        showGame(matchId);
    }
});

function getPlayers(matchId) {
    fetch('http://localhost:3000/match/players?matchId=' + matchId)
        .then(response => response.json())
        .then(data => {
            console.log('Players:', data);
            const homeTeamPlayersElement = document.getElementsByClassName('home-team-players')[0];
            const awayTeamPlayersElement = document.getElementsByClassName('away-team-players')[0];
            const playerTemplate = document.getElementById('player-template').content;
            data.forEach(player => {
                const newPlayerElement = playerTemplate.cloneNode(true);
                newPlayerElement.querySelector('.player-name').textContent = player.name;
                newPlayerElement.querySelector('.quirk-name').textContent = player.title;
                newPlayerElement.querySelector('.health-bar').style.width = '100%';
                newPlayerElement.querySelector('.tooltip').textContent = player.description;
                newPlayerElement.querySelector('.player-offense-action').textContent = player.offensive_role;
                newPlayerElement.querySelector('.player-defense-action').textContent = player.defensive_role;
                newPlayerElement.querySelector('.player').setAttribute('data-team', player.team_id == homeTeamId ? 'home' : 'away');
                newPlayerElement.querySelector('.player').setAttribute('data-player-id', player.id);
                if (player.team_id == homeTeamId) {
                    newPlayerElement.querySelector('.player-defense-action').style.display = 'none';
                    homeTeamPlayersElement.appendChild(newPlayerElement);
                    players[player.id] = homeTeamPlayersElement.lastElementChild;
                } else {
                    newPlayerElement.querySelector('.player-offense-action').style.display = 'none';
                    awayTeamPlayersElement.appendChild(newPlayerElement);
                    players[player.id] = awayTeamPlayersElement.lastElementChild;
                }
            });
        })
        .catch(error => {
            console.error('Error fetching players:', error);
        });
}

function getTeams(matchId) {
    fetch('http://localhost:3000/match/teams?matchId=' + matchId)
        .then(response => response.json())
        .then(data => {
            console.log('Teams:', data);
            //possession = homeTeamId;
            const homeTeamElement = document.getElementById('home-team-name');
            const awayTeamElement = document.getElementById('away-team-name');
            if(data[0].home_team_id == data[0].id) {
                homeTeamElement.textContent = data[0].name;
                awayTeamElement.textContent = data[1].name;
                homeTeamId = data[0].id;
                homeTeamName = data[0].name;
                awayTeamName = data[1].name;
            } else {
                homeTeamElement.textContent = data[1].name;
                awayTeamElement.textContent = data[0].name;
                homeTeamId = data[1].id;
                homeTeamName = data[1].name;
                awayTeamName = data[0].name;
            }
        })
        .catch(error => {
            console.error('Error fetching teams:', error);
        });
}

async function showGame(matchId) {
    tick = 1;
    while(tick <= 101 && !gameOver) {
        await getMatchTick(matchId, tick);
        const timerElement = document.getElementById('game-timer');
        timerElement.textContent = `Tick: ${tick}`;
        tick++;
        await new Promise(resolve => setTimeout(resolve, 600));
    }
}
// Function to move the slider icon
function moveSliderIcon(newPosition) {
    const sliderIcon = document.querySelector('.slider-icon');
    console.log('Moving slider icon to', newPosition);
    position = newPosition;
    sliderIcon.style.left = `${position}%`;
}

function changeTeamPossession(team) {
    const sliderIcon = document.querySelector('.slider-icon');
    const homeTeamPlayers = Object.values(players).filter(player => player.getAttribute('data-team') === 'home');
    const awayTeamPlayers = Object.values(players).filter(player => player.getAttribute('data-team') === 'away');
    if (team === homeTeamId) {
        sliderIcon.style.backgroundColor = 'blue';
        homeTeamPlayers.forEach(player => {
            player.querySelector('.player-defense-action').style.display = 'none';
            player.querySelector('.player-offense-action').style.display = 'block';
        });
        awayTeamPlayers.forEach(player => {
            player.querySelector('.player-offense-action').style.display = 'none';
            player.querySelector('.player-defense-action').style.display = 'block';
        });
    } else {
        sliderIcon.style.backgroundColor = 'red';
        homeTeamPlayers.forEach(player => {
            player.querySelector('.player-offense-action').style.display = 'none';
            player.querySelector('.player-defense-action').style.display = 'block';
        });
        awayTeamPlayers.forEach(player => {
            player.querySelector('.player-defense-action').style.display = 'none';
            player.querySelector('.player-offense-action').style.display = 'block';
        });
    }
}

function getMatchTick(matchId, tick) {
    return new Promise((resolve, reject) => {
    fetch('http://localhost:3000/match/match-tick?matchId=' + matchId  + '&tick=' + tick)
            .then(response => response.json())
            .then(async data => {
                console.log('Match tick data:', data);
                console.log("Scoring: ", data.scoringHistory);
                let position;

                if(possession != null) {
                    console.log("Toggle center off");
                    const possessionTeamPlayers = Object.values(players).filter(player => player.getAttribute('data-team') === (possession === homeTeamId ? 'home' : 'away'));
                    possessionTeamPlayers.forEach(player => {
                        if (player.querySelector('.player-offense-action').textContent === 'Advance') {
                            toggleCentered(player.getAttribute('data-player-id'));
                        }
                    });
                    const defendingTeamPlayers = Object.values(players).filter(player => player.getAttribute('data-team') != (possession === homeTeamId ? 'home' : 'away'));
                    defendingTeamPlayers.forEach(player => {
                        if (player.querySelector('.player-defense-action').textContent === 'Defend_Advance') {
                            toggleCentered(player.getAttribute('data-player-id'));
                        }
                    });
                }

                if(data.attackHistory.length > 0) {
                    console.log(data.attackHistory);
                    //data.attackHistory.forEach(attack => {
                        const attack = data.attackHistory[0];
                        const playerElement = players[attack.attacked_player_id];
                        const healthBar = players[attack.attacked_player_id].querySelector('.health-bar');  
                        const currentHealth = parseFloat(healthBar.style.width.replace('%', ''));
                        const newHealth = Math.max(0, currentHealth - attack.damage_done);
                        healthBar.style.width = `${newHealth}%`;
                        if (newHealth < 50) {
                            healthBar.style.backgroundColor = 'red';
                        }
                    //});
                }

                if(data.scoringHistory) { //if a shot was attempted
                    if (possession != homeTeamId) {
                        position = data.scoringHistory.range;
                    } else {
                        position = 100 - data.scoringHistory.range;
                    }
                    moveSliderIcon(position);
                    toggleHighlight(data.scoringHistory.shooter_id);
                    toggleCentered(data.scoringHistory.shooter_id);
                    const oppositeTeamPlayers = Object.values(players).filter(player => player.getAttribute('data-team') !== (data.scoringHistory.team_id === homeTeamId ? 'home' : 'away'));
                    
                    oppositeTeamPlayers.forEach(player => {
                        if (player.querySelector('.player-defense-action').textContent === 'Defend_Score') {
                            toggleCentered(player.getAttribute('data-player-id'));
                        }
                    });
                    
                    addBoldTextToTextBox(`Shot attempted by  ${data.scoringHistory.name}`);
                    for(let i = 0.3; i < Math.random()*3*Math.random(); i++) {
                        await new Promise(resolve => setTimeout(resolve, 1000+Math.random()*1000));
                        addBoldTextToTextBox('...');
                    }
                    await new Promise(resolve => setTimeout(resolve, 2000));

                    toggleHighlight(data.scoringHistory.shooter_id);
                    toggleCentered(data.scoringHistory.shooter_id);
                    oppositeTeamPlayers.forEach(player => {
                        if (player.querySelector('.player-defense-action').textContent === 'Defend_Score') {
                            toggleCentered(player.getAttribute('data-player-id'));
                        }
                    });

                    if(data.scoringHistory.successful_score) {
                        addBoldTextToTextBox(`GOOAAAAALLLLL`);
                        const teamScoreElement = document.getElementById('match-score');
                        let scores = teamScoreElement.textContent.split('-').map(Number);
                        if (data.scoringHistory.team_id === homeTeamId) {
                            scores[0]++;
                        } else {
                            scores[1]++;
                        }
                        teamScoreElement.textContent = scores.join('-');

                    }
                    else {
                        addBoldTextToTextBox(`MISSED!`);
                    }
                }
                else if(!data.matchTick) {
                    addBoldTextToTextBox(`GAME OVER`);
                    gameOver = true;
                }
                else if(possession != data.matchTick.possession_team_id && possession != null) {
                    console.log(possession, data.matchTick.possession_team_id);
                    addBoldTextToTextBox(`TURNOVER`);
                }

                const possessionTeamPlayers = Object.values(players).filter(player => player.getAttribute('data-team') === (data.matchTick.possession_team_id === homeTeamId ? 'home' : 'away'));
                possessionTeamPlayers.forEach(player => {
                    if (player.querySelector('.player-offense-action').textContent === 'Advance') {
                        toggleCentered(player.getAttribute('data-player-id'));
                    }
                });
                const defendingTeamPlayers = Object.values(players).filter(player => player.getAttribute('data-team') != (data.matchTick.possession_team_id === homeTeamId ? 'home' : 'away'));
                defendingTeamPlayers.forEach(player => {
                    if (player.querySelector('.player-defense-action').textContent === 'Defend_Advance') {
                        toggleCentered(player.getAttribute('data-player-id'));
                    }
                });

                if (data.matchTick.possession_team_id == homeTeamId) {
                    position = data.matchTick.ball_position;
                } else {
                    position = 100 - data.matchTick.ball_position;
                }
                moveSliderIcon(position);
                if(possession != data.matchTick.possession_team_id) {
                    changeTeamPossession(data.matchTick.possession_team_id);
                }
                tick++;
                possession = data.matchTick.possession_team_id;
                resolve();
            })
            .catch(error => {
                console.error('Error fetching match tick:', error);
                reject(error);
            });
        });
}

// Function to add large bolded text to the text box
function addBoldTextToTextBox(text) {
    const textBox = document.getElementById('match-text-box');
    const newText = document.createElement('div');
    newText.style.fontWeight = 'bold';
    newText.style.fontSize = 'large';
    newText.textContent = text;
    textBox.prepend(newText); // Prepend the new text to push old text up
}

// Function to add normal text to the text box
function addNormalTextToTextBox(text) {
    const textBox = document.getElementById('match-text-box');
    textBox.value = `${textBox.value}\n${text}`;
}

function toggleHighlight(playerId) {
    const playerElement = players[playerId];
    if (playerElement) {
        playerElement.classList.toggle('highlighted');
    } else {
        console.error(`Player with ID ${playerId} not found.`);
    }
}

function toggleCentered(playerId) {
    const playerElement = players[playerId];
    if (playerElement) {
        const team = playerElement.getAttribute('data-team'); // Assuming data-team attribute is set
        console.log("Team:", team);
        const centeredClass = team === 'home' ? 'centered-left' : 'centered-right';
        playerElement.classList.toggle(centeredClass);
    } else {
        console.error(`Player with ID ${playerId} not found.`);
    }
}

function shakePlayer(playerId) {
    const playerElement = players[playerId];
    if (playerElement) {
        const team = playerElement.getAttribute('data-team'); // Assuming data-team attribute is set
        console.log("Team:", team);
        const centeredClass = team === 'home' ? 'centered-left' : 'centered-right';

        // Move the player to the center
        playerElement.classList.add(centeredClass);

        // After a delay, move the player back to its original position
        setTimeout(() => {
            playerElement.classList.remove(centeredClass);
        }, 300); // Adjust the delay as needed
    } else {
        console.error(`Player with ID ${playerId} not found.`);
    }
}