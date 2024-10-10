let possession = null;
let homeTeamId = null;
let homeTeamName = null;
let awayTeamName = null;
let players = {};
let gameOver = false;
let realTime = true;
let catchUp = false;
let watchingLive = false; // If the user is watching the game live, cannot get behind
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
        realTime = false;
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
    await getTeams(matchId);
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
            givePlayerBall(1);
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
    tick = 1;
    while(tick <= 101 && !gameOver) {
        realTime = true;
        await getMatchTick(matchId, tick);
        console.log("Finished tick: ", tick);
        const timerElement = document.getElementById('game-timer');
        timerElement.textContent = `Tick: ${tick}`;
        tick++;
        await wait(700);
    }
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
    let advancingPlayers = [];
    let defendingPlayers = [];
    if (team === homeTeamId) {
        sliderIcon.style.backgroundColor = 'blue';
        homeTeamPlayers.forEach(player => {
            player.querySelector('.player-defense-action').style.display = 'none';
            player.querySelector('.player-offense-action').style.display = 'block';
            if(player.querySelector('.player-offense-action').textContent === 'Advance') {
                advancingPlayers.push(player);
            }
        });
        awayTeamPlayers.forEach(player => {
            player.querySelector('.player-offense-action').style.display = 'none';
            player.querySelector('.player-defense-action').style.display = 'block';
            if(player.querySelector('.player-defense-action').textContent === 'Defend_Advance') {
                defendingPlayers.push(player);
            }
        });
    } else {
        sliderIcon.style.backgroundColor = 'red';
        homeTeamPlayers.forEach(player => {
            player.querySelector('.player-offense-action').style.display = 'none';
            player.querySelector('.player-defense-action').style.display = 'block';
            if(player.querySelector('.player-defense-action').textContent === 'Defend_Advance') {
                defendingPlayers.push(player);
            }
        });
        awayTeamPlayers.forEach(player => {
            player.querySelector('.player-defense-action').style.display = 'none';
            player.querySelector('.player-offense-action').style.display = 'block';
            if(player.querySelector('.player-offense-action').textContent === 'Advance') {
                advancingPlayers.push(player);
            }
        });
    }

    uncenterAllPlayers();

    advancingPlayers.forEach(player => {
        toggleCentered(player.getAttribute('data-player-id'));
    });
    defendingPlayers.forEach(player => {
        toggleCentered(player.getAttribute('data-player-id'));
    });
}

function getMatchTick(matchId, tick) {
    console.log("Beginning of get tick")
    return new Promise((resolve, reject) => {
    fetch('/match/match-tick?matchId=' + matchId  + '&tick=' + tick)
            .then(response => response.json())
            .then(async data => {
                console.log(data);
                if(data.message == "Match tick not found") {
                    console.error("Match tick not found");
                    return;
                }
                if(data.message == "Match tick not reached yet") {
                    realTime = true;
                    await new Promise(r => setTimeout(r, 500));
                    console.log("Getting a new tick")
                    await getMatchTick(matchId, tick);
                    resolve();
                    return;
                }
                const nextTickButton = document.getElementById('next-tick-button');
                const catchUpButton = document.getElementById('catch-up-button');
                if(data.behindRealTime && !watchingLive) {
                    nextTickButton.style.display = 'block';
                    catchUpButton.style.display = 'block';
                }
                else {
                    console.log("Hiding next tick button");
                    nextTickButton.style.display = 'none';
                    catchUpButton.style.display = 'none';
                    catchUp = false;
                    watchingLive = true;
                }

                // Immediately finish all GSAP animations
                gsap.globalTimeline.progress(1);

                let position;
                let scoringTrick = false; //if there was a scoring attempt that involved a trick

                if(data.trickHistory) {
                    console.log(data.trickHistory);
                    data.trickHistory.forEach(trick => {
                        const trickerElement = players[trick.tricker_id];
                        const trickedElement = players[trick.tricked_id];
                        if(trick.trick_type === 'Score') {
                            scoringTrick = true;
                        }
                        else {
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
                        const newHealth = Math.max(0, currentHealth - attack.damage_done);
                        healthBar.style.width = `${newHealth}%`;
                        if (newHealth < 50) {
                            healthBar.style.backgroundColor = 'red';
                        }
                    });
                }

                if(data.scoringHistory) { //if a shot was attempted
                    if (possession != homeTeamId) {
                        position = data.scoringHistory.range;
                    } else {
                        position = 100 - data.scoringHistory.range;
                    }
                    moveSliderIcon(position);
                    uncenterAllPlayers();
                    toggleHighlight(data.scoringHistory.shooter_id);
                    toggleCentered(data.scoringHistory.shooter_id);
                    moveBallIconToPlayer(data.matchTick.player_possession_id);
                    console.log("Doing visuals")
                    //givePlayerBall(data.scoringHistory.shooter_id);
                    
                    const oppositeTeamPlayers = Object.values(players).filter(player => player.getAttribute('data-team') !== (data.scoringHistory.team_id === homeTeamId ? 'home' : 'away'));
                    
                    oppositeTeamPlayers.forEach(player => {
                        if (player.querySelector('.player-defense-action').textContent === 'Defend_Score') {
                            toggleCentered(player.getAttribute('data-player-id'));
                        }
                    });
                    
                    addBoldTextToTextBox(`Shot attempted by  ${data.scoringHistory.name}`);
                    if(realTime) {
                        for(let i = 0.3; i < Math.random()*3*Math.random(); i++) {
                            await wait(1000+Math.random()*1000);
                            addBoldTextToTextBox('...');
                        }
                        //await wait(1000);
                        if(scoringTrick) {
                            addBoldTextToTextBox(`Trick shot!`);
                            const ballIcon = players[data.scoringHistory.shooter_id].querySelector('.ball-icon');
                            //console.log(players[data.scoringHistory.shooter_id])
                            //console.log(ballIcon);
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
                        await wait(1000);
                    }

                    toggleHighlight(data.scoringHistory.shooter_id);
                    uncenterAllPlayers();

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
                    const playerStealing = players[data.matchTick.player_possession_id];
                    addBoldTextToTextBox(`${playerStealing.querySelector('.player-name').textContent} steals the ball!`);
                }

                if (data.matchTick.possession_team_id == homeTeamId) {
                    position = data.matchTick.ball_position;
                } else {
                    position = 100 - data.matchTick.ball_position;
                }
                moveSliderIcon(position);
                if(possession != data.matchTick.possession_team_id) {
                    changeTeamPossession(data.matchTick.possession_team_id);
                }
                moveBallIconToPlayer(data.matchTick.player_possession_id);
                console.log("Ball given")
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
        //console.log("Playerelement: ", playerElement);
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
        if(ballIcon.parentElement.parentElement.parentElement.getAttribute('data-player-id') == playerId) {
            console.log("Ball already with player");
            resolve();
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

async function wait(ms) {
    return new Promise(async (resolve) => {
        while(ms > 0) {
            ms -= 100;
            if(realTime && catchUp == false) {
                await new Promise(r => setTimeout(r, 100));
            }
        }
    resolve();
    });
}