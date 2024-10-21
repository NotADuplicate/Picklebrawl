let possession = null;
let homeTeamId = null;
let homeTeamName = null;
let awayTeamName = null;
let players = {};
let gameOver = false;
let skipTick = false;
let catchUp = false;
let watchingLive = false; // If the user is watching the game live, cannot get behind
let consequetiveStalls = 0;
const TIME_PER_TICK = 1000; // Time in milliseconds per tick
const TIME_PER_SCORE = 1000; // Time in milliseconds per score
const teamPositions = {
    home: {
        centeredX: null,
        uncenteredX: null
    },
    away: {
        centeredX: null,
        uncenteredX: null
    }
};


document.addEventListener('DOMContentLoaded', () => {
    const nextTickButton = document.getElementById('next-tick-button');
    nextTickButton.style.display = 'none';
    nextTickButton.addEventListener('click', () => {
        skipTick = true;
    });

    const liveButton = document.getElementById('catch-up-button');
    liveButton.style.display = 'none';
    liveButton.addEventListener('click', () => {
        catchUp = true;
    });

    const urlParams = new URLSearchParams(window.location.search);
    let matchId = urlParams.get('matchId');
    if (!matchId) {
        const challengeId = urlParams.get('challengeId');
        if (challengeId) {
            console.log("Challenge ID: ", challengeId);
            fetch('/match/match-id?challengeId=' + challengeId)
                .then(response => response.json())
                .then(data => {
                    console.log("Match ID: ", data);
                    matchId = data.id;
                    setupGame(matchId);
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
        setupGame(matchId);
    }
});

async function setupGame(matchId) {
    console.log("Getting teams");
    await getTeams(matchId);
    console.log("Getting players");
    await getPlayers(matchId);
    showGame(matchId);
}

function getPlayers(matchId) {
    return new Promise((resolve, reject) => {
    fetch('/match/players?matchId=' + matchId)
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
                newPlayerElement.querySelector('.player').setAttribute('data-offense-target', player.offensive_target_id);
                newPlayerElement.querySelector('.player').setAttribute('data-defense-target', player.defensive_target_id);
                if (player.team_id == homeTeamId) {
                    newPlayerElement.querySelector('.player-defense-action').style.display = 'none';
                    newPlayerElement.querySelector('.player').classList.add('home-team');
                    homeTeamPlayersElement.appendChild(newPlayerElement);
                    players[player.id] = homeTeamPlayersElement.lastElementChild;
                } else {
                    newPlayerElement.querySelector('.player-offense-action').style.display = 'none';
                    newPlayerElement.querySelector('.player').classList.add('away-team');
                    awayTeamPlayersElement.appendChild(newPlayerElement);
                    players[player.id] = awayTeamPlayersElement.lastElementChild;
                }
            });
            const playerIds = Object.keys(players);
            const randomPlayerId = playerIds[Math.floor(Math.random() * playerIds.length)];
            givePlayerBall(randomPlayerId);
            captureTeamPositions();
            resolve();
        })
        .catch(error => {
            console.error('Error fetching players:', error);
            reject(error);
        });
    });
}

function getTeams(matchId) {
    return new Promise((resolve, reject) => {
    fetch('/match/teams?matchId=' + matchId)
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
            resolve();
        })
        .catch(error => {
            console.error('Error fetching teams:', error);
            reject(error);
        });
    });
}

async function showGame(matchId) {
    fetch('/match/match-ticks?matchId=' + matchId)
        .then(response => response.json())
        .then(async data => {
            console.log('Match ticks:', data);
            let i = 1;
            let timeOffset = 0;
            const gameTimer = document.getElementById('game-timer');
            while(data.matchCreatedAt > new Date().getTime()) {
                watchingLive = true;
                gameTimer.textContent = 'Game starts in ' + Math.ceil((data.matchCreatedAt - new Date().getTime()) / 1000) + ' seconds';
                await new Promise(r => setTimeout(r, 200));
            }
            while(i <= data.matchTicks.length) {
                skipTick = false;
                const tickData = data.matchTicks[i-1];
                const tick = tickData.tick;
                const scoringHistoryForTick = data.scoringHistory.filter(history => history.tick === tick);
                const trickHistoryForTick = data.trickHistory.filter(history => history.tick === tick);
                const attackHistoryForTick = data.attackHistory.filter(history => history.tick === tick);
                const actionHistoryForTick = data.actionHistory.filter(history => history.tick === tick);
                console.log(tickData)
                const fullTickData = {
                    scoringHistory: scoringHistoryForTick,
                    trickHistory: trickHistoryForTick,
                    attackHistory: attackHistoryForTick, 
                    matchTick: tickData,
                    actionHistory: actionHistoryForTick,
                    time: data.matchCreatedAt + timeOffset 
                };
                timeOffset += TIME_PER_TICK;
                if(scoringHistoryForTick.length > 0) {
                    scoringHistoryForTick.forEach(score => {
                        timeOffset += (score.suspense + 1) * TIME_PER_SCORE;
                    });
                }
                console.log(new Date().getTime());
                await runMatchTick(fullTickData, tick);
                await wait(TIME_PER_TICK-100);
                i++;
            }
            addBoldTextToTextBox('GAME OVER');
        })
        .catch(error => {
            console.error('Error fetching match ticks:', error);
        });
}
// Function to move the slider icon
function moveSliderIcon(newPosition) {
    const sliderIcon = document.querySelector('.slider-icon');
    position = newPosition;
    sliderIcon.style.left = `${position}%`;
}

async function changeTeamPossession(team) {

    const sliderIcon = document.querySelector('.slider-icon');
    const homeTeamPlayers = Object.values(players).filter(player => player.getAttribute('data-team') === 'home');
    const awayTeamPlayers = Object.values(players).filter(player => player.getAttribute('data-team') === 'away');
    let offenseTeamPlayers = [];
    let defenseTeamPlayers = [];
    let advancingPlayers = [];
    let defendingPlayers = [];
    if (team === homeTeamId) {
        sliderIcon.style.backgroundColor = 'blue';
        offenseTeamPlayers = homeTeamPlayers;
        defenseTeamPlayers = awayTeamPlayers;
    } else {
        sliderIcon.style.backgroundColor = 'red';
        offenseTeamPlayers = awayTeamPlayers;
        defenseTeamPlayers = homeTeamPlayers;
    }

    offenseTeamPlayers.forEach(player => {
        player.querySelector('.action-icon').style.display = 'none';
        player.querySelector('.player-defense-action').style.display = 'none';
        player.querySelector('.player-offense-action').style.display = 'block';
        if(player.querySelector('.player-offense-action').textContent === 'Advance') {
            advancingPlayers.push(player);
        }
        else {
            setActionIcon(player,"offense");
        }
    });
    defenseTeamPlayers.forEach(player => {
        player.querySelector('.action-icon').style.display = 'none';
        player.querySelector('.player-offense-action').style.display = 'none';
        player.querySelector('.player-defense-action').style.display = 'block';
        if(player.querySelector('.player-defense-action').textContent === 'Defend_Advance') {
            defendingPlayers.push(player);
        }
        else {
            setActionIcon(player,"defense");
        }
    });

    uncenterAllPlayers();

    advancingPlayers.forEach(player => {
        const healthBar = player.querySelector('.health-bar');  
        const currentHealth = parseFloat(healthBar.style.width.replace('%', ''));
        if(currentHealth > 0.5) {
            toggleCentered(player.getAttribute('data-player-id'));
        }
    });
    defendingPlayers.forEach(player => {
        const healthBar = player.querySelector('.health-bar');  
        const currentHealth = parseFloat(healthBar.style.width.replace('%', ''));
        if(currentHealth > 0.5) {
            toggleCentered(player.getAttribute('data-player-id'));
        }
    });
}

function runMatchTick(data, tick) {
    console.log("Beginning of get tick")
    return new Promise(async (resolve, reject) => {
        console.log(data);

        const nextTickButton = document.getElementById('next-tick-button');
        const catchUpButton = document.getElementById('catch-up-button');
        const gameTimer = document.getElementById('game-timer');
        gameTimer.textContent = "Tick: " + tick;
        const currentTime = new Date().getTime();
        console.log("Times: " , data.time, currentTime);
        if(data.time > currentTime) {
            await new Promise(r => setTimeout(r, data.time - currentTime));
            catchUp = false;
        }
        if(data.time < currentTime && !watchingLive) {
            nextTickButton.style.display = 'block';
            catchUpButton.style.display = 'block';
            console.log("Showing next tick button");
        } else {
            console.log("Hiding next tick button");
            nextTickButton.style.display = 'none';
            catchUpButton.style.display = 'none';
            watchingLive = true;
        }
        if(!data.matchTick) {
            addBoldTextToTextBox(`GAME OVER`);
            gameOver = true;
            return;
        }

        let position;

        if(data.trickHistory.length > 0) {
            console.log(data.trickHistory);
            data.trickHistory.forEach(trick => {
                const trickerElement = players[trick.tricker_id];
                const trickedElement = players[trick.tricked_id];
                if(trick.trick_type !== 'Score') {
                    addBoldTextToTextBox(`${trickerElement.querySelector('.player-name').textContent} tricked ${trickedElement.querySelector('.player-name').textContent}!`);
                    // Rotate the ball icon of the player with possession
                    const ballIcon = players[trick.tricker_id].querySelector('.ball-icon');
                    if (ballIcon) {
                        console.log('Rotating ball icon');
                    // Reset any previous animations on the ballIcon
                    gsap.killTweensOf(ballIcon);

                    // Rotate the ball icon using GSAP
                    gsap.fromTo(
                        ballIcon,
                        { rotation: 0 }, // Starting rotation
                        {
                            rotation: 360,      // Ending rotation
                            duration: 1,      // Duration in seconds
                            ease: 'power1.inOut', // Easing function
                            onComplete: () => {
                                // Optional: Reset rotation after animation completes
                                gsap.set(ballIcon, { rotation: 0 });
                            }
                        }
                    );
                    }
                }
            });
        }

        if(data.attackHistory.length > 0) {
            data.attackHistory.forEach(attack => {
                const playerElement = players[attack.attacked_player_id];
                const healthBar = players[attack.attacked_player_id].querySelector('.health-bar');  
                const currentHealth = parseFloat(healthBar.style.width.replace('%', ''));
                const newHealth = Math.max(0, currentHealth - attack.percent_health_done);
                if(attack.percent_health_done > 8) {
                    addNormalTextToTextBox(`${players[attack.attacking_player_id].querySelector('.player-name').textContent} dealt ${attack.damage_done.toFixed(0)} damage to ${playerElement.querySelector('.player-name').textContent}`);
                }
                healthBar.style.width = `${newHealth}%`;
                if (newHealth < 50) {
                    healthBar.style.backgroundColor = 'red';
                }
                if(currentHealth > 0.5 && newHealth <= 0.5) {
                    playerElement.display = 'none';
                    const actionIcon = playerElement.querySelector('.action-icon');
                    actionIcon.style.display = 'block';
                    if (actionIcon) {
                        actionIcon.src = '/Resources/KO.png'; // Change the image URL as needed
                    }
                    addBoldTextToTextBox(`${players[attack.attacking_player_id].querySelector('.player-name').textContent} KNOCKED OUT ${playerElement.querySelector('.player-name').textContent}!`);
                    playerElement.querySelector('.player-offense-action').textContent = "Knocked out";
                    playerElement.querySelector('.player-defense-action').textContent = "Knocked out";
                }
            });
        }

        if(data.scoringHistory.length > 0) { //if a shot was attempted
            if (possession != homeTeamId) {
                position = data.scoringHistory[0].range;
            } else {
                position = 100 - data.scoringHistory[0].range;
            }
            moveSliderIcon(position);
            uncenterAllPlayers();
            let i = 0;
            
            const oppositeTeamPlayers = Object.values(players).filter(player => player.getAttribute('data-team') !== (data.scoringHistory.team_id === homeTeamId ? 'home' : 'away'));
            oppositeTeamPlayers.forEach(player => {
                if (player.querySelector('.player-defense-action').textContent === 'Defend_Score') {
                    const healthBar = player.querySelector('.health-bar');  
                    const currentHealth = parseFloat(healthBar.style.width.replace('%', ''));
                    if(currentHealth > 0.5) {
                        toggleCentered(player.getAttribute('data-player-id'));
                    }
                }
            });

            data.scoringHistory.forEach(score => {
                toggleCentered(score.shooter_id);
            });
            if(data.scoringHistory[0].blitzer_id != null) {
                toggleHighlight(data.scoringHistory[0].blitzer_id);
                addBoldTextToTextBox(`${players[data.scoringHistory[0].blitzer_id].querySelector('.player-name').textContent} blitzes!`);
                await wait(1000);
                toggleHighlight(data.scoringHistory[0].blitzer_id);
            }
            while(i < data.scoringHistory.length) {
                const scoringTrick = !!data.trickHistory.find(trick => trick.tricker_id === data.scoringHistory[i].shooter_id && trick.trick_type === 'Score' && trick.tick === tick);
                await doShooting(data.scoringHistory[i], scoringTrick);
                i++;
            }
            uncenterAllPlayers();
        }
        else if(possession != data.matchTick.possession_team_id && possession != null) {
            const playerStealing = players[data.matchTick.player_possession_id];
            addBoldTextToTextBox(`${playerStealing.querySelector('.player-name').textContent} steals the ball!`);
        }

        if (data.matchTick.possession_team_id == homeTeamId) {
            position = data.matchTick.ball_position;
        } else {
            position = 100 - data.matchTick.ball_position;
        }

        if(possession != data.matchTick.possession_team_id) {
            changeTeamPossession(data.matchTick.possession_team_id);
            consequetiveStalls = 0;
        }
        else { //if no turnover 
            if(data.actionHistory.length > 0) {
                data.actionHistory.forEach(action => {
                    if(action.action !== 'Score') {
                        const playerElement = players[action.player_id];
                        addNormalTextToTextBox(`${playerElement.querySelector('.player-name').textContent} decided to ${action.action}`);
                    }
                });
            }
            if(!data.scoringHistory){
                const advancement = Math.abs(parseFloat(document.querySelector('.slider-icon').style.left) - position);
                const playerWithPossession = players[data.matchTick.player_possession_id];
                const playerName = playerWithPossession.querySelector('.player-name').textContent;
                if(advancement > 2) {
                    addNormalTextToTextBox(`${playerName} advanced by ${advancement.toFixed(0)} meters`);
                    consequetiveStalls = 0;
                }
                else if(advancement < 0.5){
                    addNormalTextToTextBox(`${playerName} unable to advance the ball`);
                    consequetiveStalls++;
                    if(consequetiveStalls > 2) {
                        addBoldTextToTextBox(`${playerName} is LOCKED DOWN!`);
                    }
                }
                else {
                    consequetiveStalls = 0;
                }
            }
        }

        moveSliderIcon(position);
        moveBallIconToPlayer(data.matchTick.player_possession_id);
        console.log("Ball given")
        tick++;
        possession = data.matchTick.possession_team_id;
        resolve();
    })
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
    const newText = document.createElement('div');
    newText.textContent = text;
    textBox.prepend(newText); // Prepend the new text to push old text u
}

async function doShooting(score, scoringTrick) {
    return new Promise(async (resolve) => {
    
    const shooterId = score.shooter_id;
    toggleHighlight(shooterId);
    moveBallIconToPlayer(shooterId);

    const shooterElement = players[shooterId];
    const shooterPriority = shooterElement.querySelector('.player-offense-action').textContent;
    if(score.blitzer_id != null) {
        addBoldTextToTextBox(`${shooterElement.querySelector('.player-name').textContent} shoots`);
    }
    else if(shooterPriority !== 'Score') { //they decided to shoot randomly
        addBoldTextToTextBox(`${shooterElement.querySelector('.player-name').textContent} decided to shoot!`);
        console.log("Shooter priority: ", shooterPriority)
    }
    else {
        addBoldTextToTextBox(`Shot attempted by  ${score.name}`);
    }
    for(let i = 0; i < score; i++) {
        await wait(TIME_PER_SCORE);
        addBoldTextToTextBox('...');
    }
    if(scoringTrick) {
        addBoldTextToTextBox(`Trick shot!`);
        const ballIcon = players[shooterId].querySelector('.ball-icon');
        if (ballIcon) {
            console.log('Rotating ball icon');
            // Reset any previous animations on the ballIcon
            gsap.killTweensOf(ballIcon);

            // Rotate the ball icon using GSAP
            gsap.fromTo(
                ballIcon,
                { rotation: 0 }, // Starting rotation
                {
                    rotation: 360,      // Ending rotation
                    duration: 1,      // Duration in seconds
                    ease: 'power1.inOut', // Easing function
                    onComplete: () => {
                        // Optional: Reset rotation after animation completes
                        gsap.set(ballIcon, { rotation: 0 });
                    }
                }
            );
        }
    }
    await wait(TIME_PER_SCORE);
    toggleHighlight(shooterId);
    if(score.successful_score) {
        let scoreWorth = 2;
        if(score.blitzer_id == null) {
            addBoldTextToTextBox(`GOOAAAAALLLLL`);
        }
        else {
            addBoldTextToTextBox(`${players[score.shooter_id].querySelector('.player-name').textContent} scores!`);
            scoreWorth = 1;
        }
        const teamScoreElement = document.getElementById('match-score');
        let scores = teamScoreElement.textContent.split('-').map(Number);
        if (score.team_id === homeTeamId) {
            scores[0]+=scoreWorth;
        } else {
            scores[1]+=scoreWorth;
        }
        teamScoreElement.textContent = scores.join('-');

    }
    else {
        addBoldTextToTextBox(`MISSED!`);
    }
    resolve();
    });
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
        const centeredClass = team === 'home' ? 'centered-left' : 'centered-right';
        playerElement.classList.toggle(centeredClass);
    } else {
        console.error(`Player with ID ${playerId} not found.`);
    }
}

function uncenterAllPlayers() {
    const centeredPlayers = document.querySelectorAll('.centered-left, .centered-right');
    centeredPlayers.forEach(player => {
        player.classList.remove('centered-left', 'centered-right');
    });
}

function givePlayerBall(playerId) {
    console.log("Giving player ball:", playerId);
    const ballIcons = document.querySelectorAll('.ball-icon');
    ballIcons.forEach(icon => {
        const playerElement = icon.parentElement.parentElement.parentElement;
        //console.log(playerElement.getAttribute('data-player-id'));
        if (playerElement.getAttribute('data-player-id') == playerId) {
            icon.style.display = 'block';
            console.log("Ball given to player");
        } else {
            icon.style.display = 'none';
        }
    });
}

function moveBallIconToPlayer(playerId) {
    return new Promise((resolve, reject) => {
        console.log('Moving ball icon to player:', playerId);

        // Find the current ball icon
        const ballIcon = document.querySelector('.ball-icon:not([style*="display: none"])');
        if (!ballIcon) {
            console.error('Ball icon not found.');
            reject('Ball icon not found.');
            return;
        }

        //console.log(ballIcon);
        if(ballIcon.parentElement.parentElement.parentElement) {
            if(ballIcon.parentElement.parentElement.parentElement.getAttribute('data-player-id') == playerId) {
                console.log("Ball already with player");
                resolve();
                return;
            }
        }
        else {
            console.error("Ball icon parent not found");
            console.log(ballIcon);
            console.log(ballIcon.parentElement);
            console.log(ballIcon.parentElement.parentElement);
            reject("Ball icon parent not found");
            return;
        }

        // Find the target player element with the specified ID
        const targetPlayerElement = document.querySelector(`.player[data-player-id="${playerId}"]`);
        if (!targetPlayerElement) {
            console.error(`Player with ID ${playerId} not found.`);
            reject(`Player with ID ${playerId} not found.`);
            return;
        }

        const targetIconContainer = targetPlayerElement.querySelector('.player-icon');
        if (!targetIconContainer) {
            console.error('Target icon container not found.');
            reject('Target icon container not found.');
            return;
        }

        // Get the start position of the ball icon
        const ballIconRect = ballIcon.getBoundingClientRect();
        const ballIconX = ballIconRect.left + window.pageXOffset;
        const ballIconY = ballIconRect.top + window.pageYOffset;

        // Determine the player's team
        let team = '';
        //console.log("Classlist: ", targetPlayerElement.classList);
        let targetIconX;
        if (targetPlayerElement.classList.contains('home-team')) {
            team = 'home';
            if(targetPlayerElement.classList.contains('centered-left')) {
                targetIconX = teamPositions.home.centeredX;
            } else {
                targetIconX = teamPositions.home.uncenteredX;
            }
        } else if (targetPlayerElement.classList.contains('away-team')) {
            team = 'away';
            if(targetPlayerElement.classList.contains('centered-right')) {
                targetIconX = teamPositions.away.centeredX;
            } else {
                targetIconX = teamPositions.away.uncenteredX;
            }
        } else {
            console.error('Player team not identified.');
            reject('Player team not identified.');
            return;
        }
        //console.log("Team: ", team);

        // Get the target X position based on team and centered state
        //console.log("CenteredX: ", targetIconX);
        if (targetIconX === undefined) {
            console.error(`Position for team ${team} not found.`);
            reject(`Position for team ${team} not found.`);
            return;
        }

        // Get the target Y position dynamically
        const targetIconRect = targetIconContainer.getBoundingClientRect();
        const targetIconY = targetIconRect.top + window.pageYOffset;

        //console.log('ballIconX:', ballIconX, 'ballIconY:', ballIconY);
        //console.log('targetIconX:', targetIconX, 'targetIconY:', targetIconY);

        // Create a temporary ball icon
        const tempBallIcon = ballIcon.cloneNode(true);
        document.body.appendChild(tempBallIcon);

        // Set initial styles
        tempBallIcon.style.position = 'absolute';
        tempBallIcon.style.left = `${ballIconX}px`;
        tempBallIcon.style.top = `${ballIconY}px`;
        tempBallIcon.style.width = `${ballIconRect.width}px`;
        tempBallIcon.style.height = `${ballIconRect.height}px`;
        tempBallIcon.style.margin = '0';
        tempBallIcon.style.padding = '0';
        tempBallIcon.style.border = 'none';
        tempBallIcon.style.background = 'none';
        tempBallIcon.style.transform = 'none';
        tempBallIcon.style.zIndex = '1000';
        ballIcon.style.display = 'none';

        // Hide the original ball icon
        //ballIcon.style.display = 'none';

        // Animate the temporary ball icon
        gsap.to(tempBallIcon, {
            duration: 0.5, // Adjust duration as needed
            left: `${targetIconX}px`,
            top: `${targetIconY}px`,
            ease: "power1.inOut",
            overwrite: true,
            onComplete: () => {
                //targetIconContainer.appendChild(ballIcon);
                targetIconContainer.querySelector('.ball-icon').style.display = 'block';
                document.body.removeChild(tempBallIcon);
                //console.log('Animation complete');
                resolve(); // Resolve the promise when the animation completes
            }
        });
    });
}

function captureTeamPositions() {
    console.log("Capturing team positions...");
    // Get one player from the home team
    const homePlayer = document.querySelector('.player.home-team');
    console.log("Home player: ", homePlayer);
    if (homePlayer) {
        const playerIcon = homePlayer.querySelector('.player-icon');
        if (playerIcon) {

            // Capture centered position
            homePlayer.offsetHeight; // Force reflow
            const centeredRect = playerIcon.getBoundingClientRect();
            teamPositions.home.centeredX = centeredRect.left+vwToPx(20)-40;
            teamPositions.home.uncenteredX = centeredRect.left

            // Reset classes
            homePlayer.offsetHeight; // Force reflow
        }
    }

    // Get one player from the away team
    const awayPlayer = document.querySelector('.player.away-team');
    console.log("Away player: ", awayPlayer);
    if (awayPlayer) {
        const playerIcon = awayPlayer.querySelector('.player-icon');
        if (playerIcon) {

            awayPlayer.offsetHeight; // Force reflow
            const centeredRect = playerIcon.getBoundingClientRect();
            teamPositions.away.centeredX = centeredRect.left-vwToPx(20)+4;
            teamPositions.away.uncenteredX = centeredRect.left;

            // Reset classes
            awayPlayer.offsetHeight; // Force reflow
        }
    }
    console.log('Team positions captured:', teamPositions);
}

function vwToPx(vw) {
    return window.innerWidth * (vw / 100);
}

function setActionIcon(player, offense) { //offense is set to either "offense" or "defense"
    const action = player.querySelector('.player-'+offense+'-action').textContent;

    if(action === "Knocked out") {
        const actionIcon = player.querySelector('.action-icon');
        if (actionIcon) {
            actionIcon.src = '/Resources/KO.png'; // Change the image URL as needed
            const actionIconContainer = player.querySelector('.action-icon-container');
            tooltip = actionIconContainer.getElementsByClassName('tooltip')[0];
            if (tooltip) {
                tooltip.textContent = "KO'd";
            }
        }
    }
    else if(action === 'Assist' || action === 'Attack' || action === 'Protect' || action === "Rest") {
        player.querySelector('.action-icon').style.display = 'block';
        let targetPlayer;
        if(action !== "Rest") {
            const targetId = player.getAttribute('data-'+offense+'-target');
            targetPlayer = players[targetId];
        }
        const actionIconContainer = player.querySelector('.action-icon-container');
        let tooltip;
        if (actionIconContainer) {
            tooltip = actionIconContainer.getElementsByClassName('tooltip')[0];
            if (tooltip) {
                console.log('Tooltip:', tooltip.textContent);
            } else {
                console.error('Tooltip not found in action-icon-container.');
            }
        } else {
            console.error('Action icon container not found.');
        }
        if (tooltip) {
            if(action === "Rest") {
                tooltip.textContent = "Resting";
            }
            else {
                tooltip.textContent = `${action}ing ${targetPlayer.querySelector('.player-name').textContent}`;
            }
        }
        if(action === 'Assist') {
            const actionIcon = player.querySelector('.action-icon');
            console.log("Assist first step");
            if (actionIcon) {
                actionIcon.src = '/Resources/assist.png'; // Change the image URL as needed
            }
        }
        else if(action === "Attack") {
            const actionIcon = player.querySelector('.action-icon');
            console.log("Attack first step");
            if (actionIcon) {
                actionIcon.src = '/Resources/attack.png'; // Change the image URL as needed
            }
        }
        else if(action === "Protect") {
            const actionIcon = player.querySelector('.action-icon');
            console.log("Attack first step");
            if (actionIcon) {
                actionIcon.src = '/Resources/protect.png'; // Change the image URL as needed
            }    
        }
        else if(action === "Rest") {
            const actionIcon = player.querySelector('.action-icon');
            console.log("Resting first step");
            if (actionIcon) {
                actionIcon.src = '/Resources/rest.png'; // Change the image URL as needed
            }
        }
    }
}

async function wait(ms) {
    return new Promise(async (resolve) => {
        while(ms > 0) {
            ms -= 100;
            if(!skipTick && catchUp == false) {
                await new Promise(r => setTimeout(r, 100));
            }
            else {
                await new Promise(r => setTimeout(r, 5));
                // Immediately finish all GSAP animations
                gsap.globalTimeline.progress(1);
            }
        }
    resolve();
    });
}