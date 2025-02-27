import { fetchData } from "../api.js";
let myTeamId = null;
let token = null;
let messageDiv = null;
let challengerIds = {} //associates each challenge button with the challenger and challenged
let challengedIds = {}

document.addEventListener('DOMContentLoaded', () => {
    messageDiv = document.getElementById('message');
    const backButton = document.getElementById('back-button');
    const teamsContainer = document.getElementById('teams-container');
    const leagueTitle = document.getElementById('league-title');
    const leagueFounderElement = document.getElementById('league-founder');
    const startLeagueButton = document.getElementById('start-league-button');

    const urlParams = new URLSearchParams(window.location.search);
    const leagueName = urlParams.get('league');
    localStorage.setItem('leagueName', leagueName);
    token = localStorage.getItem('token');
    console.log("Token: ", token);
    const loggedInUser = localStorage.getItem('loggedInUser');

    leagueTitle.textContent = leagueName;

    //Add friendly match toggle
    const toggleBtn = document.getElementById('toggle-friendly');

    toggleBtn.addEventListener('click', function () {
        const hideFriendly = toggleBtn.getAttribute("data-hide-friendly") === "true";
        if (hideFriendly) {
            // Show all matches.
            toggleBtn.setAttribute("data-hide-friendly", "false");
            toggleBtn.textContent = "Hide Friendly Matches";
            document.querySelectorAll('.match-card').forEach(card => {
                card.style.display = "";
            });
        } else {
            // Hide friendly matches (those without official-match class).
            toggleBtn.setAttribute("data-hide-friendly", "true");
            toggleBtn.textContent = "Show All Matches";
            document.querySelectorAll('.match-card').forEach(card => {
                if (!card.classList.contains('official-match')) {
                    card.style.display = "none";
                }
            });
        }
    });

    // Fetch and display league details
    console.log("Here")
    fetchData(`/leagues?leagueName=${leagueName}`, 'GET', { 'Authorization': `Bearer ${token}` }, null, (leagues) => {
        const league = leagues[0]; // Since we are fetching by league name, there should be only one league
        if (league) {
            localStorage.setItem("leagueId", league.id);
            const calendarButton = document.getElementById('calendar-button');
            calendarButton.addEventListener('click', () => {
                window.location.href = `../calendar/calendar.html?leagueId=${league.id}`;
            });
            leagueFounderElement.textContent = league.founder;
            // Disable the start league button if the league has already started or if the logged-in user is not the founder
            if (league.started || loggedInUser !== league.founder) {
                console.log("League unstartable")
                startLeagueButton.style.display = "none";
                startLeagueButton.disabled = true;
                startLeagueButton.textContent = league.hasStarted ? 'League Started' : 'Start League';
            } else {
                startLeagueButton.addEventListener('click', () => {
                    startLeague(leagueName);
                });
            }

            getDraft(league.id);
            getMatches(league.id);
            // Fetch and display teams
            fetchData(`/teams?leagueId=${league.id}`, 'GET', { 'Authorization': `Bearer ${token}` }, null, (teams) => {
                console.log('Teams:', teams);
                teamsContainer.innerHTML = '';
                let challengeButtons = {};
                teams.forEach(team => {
                    if(team.owner == loggedInUser) {
                        myTeamId = team.id;
                        localStorage.setItem('myTeamId', myTeamId);
                        getUpcoming(league.id);
                    }
                    const teamCard = document.createElement('div');
                    teamCard.className = 'team-card';
                
                    const teamInfo = document.createElement('div');
                    teamInfo.className = 'team-info';
                
                    const teamName = document.createElement('h3');
                    teamName.className = 'team-name';
                    teamName.textContent = team.name;
                
                    const teamOwner = document.createElement('p');
                    teamOwner.className = 'team-owner';
                    teamOwner.textContent = `Owner: ${team.owner}`;
                
                    teamInfo.appendChild(teamName);
                    teamInfo.appendChild(teamOwner);
                
                    const teamActions = document.createElement('div');
                    teamActions.className = 'team-actions';
                
                    const viewButton = document.createElement('button');
                    viewButton.className = 'view-button';
                    viewButton.textContent = 'View';
                    viewButton.addEventListener('click', () => {
                        window.location.href = `../team/team.html?teamId=${team.id}`;
                    });
                    teamActions.appendChild(viewButton);
                
                    if (team.owner !== loggedInUser) {
                        const challengeButton = document.createElement('button');
                        challengeButton.className = 'challenge-button';
                        challengeButton.setAttribute('data-team-id', team.id);
                        challengeButton.innerText = 'Challenge';
                        challengeButton.addEventListener('click', () => challenge(team.id, myTeamId, challengeButton));
                        teamActions.appendChild(challengeButton);
                        challengeButtons[team.id] = challengeButton;
                    }

                    teamCard.appendChild(teamInfo);
                    teamCard.appendChild(teamActions);
                    teamsContainer.appendChild(teamCard);
                });
                getChallenges(challengeButtons);
            }, (error) => {
                console.error('Error fetching teams:', error);
                messageDiv.innerText = 'Error fetching teams!';
            });
        } else {
            messageDiv.innerText = 'League not found!';
        }
    }
    , (error) => {
        console.error('Error fetching leagues:', error);
        messageDiv.innerText = 'Error fetching leagues!';
    });
    console.log("Here2")


    backButton.addEventListener('click', () => {
        window.location.href = `../home/home.html`;
    });
});

function timeAgo(date) {
    const now = new Date();
    const secondsPast = (now.getTime() - new Date(date).getTime()) / 1000;

    if (secondsPast < 60) {
        return `${Math.floor(secondsPast)} seconds ago`;
    } else if (secondsPast < 3600) {
        return `${Math.floor(secondsPast / 60)} minutes ago`;
    } else if (secondsPast < 86400) {
        return `${Math.floor(secondsPast / 3600)} hours ago`;
    } else if (secondsPast < 604800) {
        return `${Math.floor(secondsPast / 86400)} days ago`;
    }
    else {
        return (new Date(date).toLocaleDateString());
    }
}

function createCurrentEvent(title, description, buttonTitle = "", buttonCallback = null) {
    const template = document.getElementById('current-event-template');
    const clone = template.content.cloneNode(true);
    const currentEvent = clone.querySelector('.current-event');
    clone.querySelector('.current-event-title').textContent = title;
    clone.querySelector('.current-event-description').textContent = description;

    if(buttonTitle !== "") {
        const button = clone.querySelector('.current-event-button');
        button.textContent = buttonTitle;
        if(buttonCallback) {
            button.addEventListener('click', buttonCallback);
        }
    }
    else {
        clone.querySelector('.current-event-button').style.display = 'none';
    }

    // Add toggle functionality
    const toggleButton = clone.querySelector('.toggle-button');
    toggleButton.addEventListener('click', () => {
        if (currentEvent.classList.contains('collapsed')) {
            currentEvent.classList.remove('collapsed');
            toggleButton.textContent = "▼";
        } else {
            currentEvent.classList.add('collapsed');
            toggleButton.textContent = "▲";
        }
    });

    return clone;
}

// Function to add a draft as a current event
function addDraftEvent(draftId) {
    const currentEventsContainer = document.getElementById('current-events-container');

    const clone = createCurrentEvent('Player Draft', 'A new player draft is now available. Click below to participate.', 'View Draft', function() {
        // Redirect to the draft page
        window.location.href = `/draft/draft.html?draftId=${draftId}`;
    });

    // Add the event card to the current events container
    currentEventsContainer.appendChild(clone);
}

function getUpcoming(leagueId) {
    const token = localStorage.getItem('token');
    fetchData(`/league/upcoming?leagueId=${leagueId}`, 'GET', { 'Authorization': `Bearer ${token}` }, null, (challenges) => {
        console.log("Upcoming challenges: ", challenges);
        challenges.sort((a, b) => new Date(a.happening_at) - new Date(b.happening_at));
        challenges.forEach(challenge => {
            addUpcomingMatch(challenge);
        });
    }, (error) => {
        console.error('Error fetching upcoming challenges:', error);
    });
}

function addUpcomingMatch(challenge) {
    const currentEventsContainer = document.getElementById('current-events-container');
    console.log("My team id: ", myTeamId) 

    const time = new Date(challenge.happening_at).toLocaleString([], { month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    if(challenge.challenger_team_id == myTeamId || challenge.challenged_team_id == myTeamId) {
        const clone = createCurrentEvent(`${challenge.challenger_name} VS ${challenge.challenged_name}`, `${time}`, 'Set Players/Actions', function() {
            window.location.href = `../bench/bench.html?challengedId=${challenge.challenged_team_id}&challengerId=${challenge.challenger_team_id}&challengeId=${challenge.challenge_id}`;
        });
        currentEventsContainer.appendChild(clone);
    }
    else {
        const clone = createCurrentEvent(`${challenge.challenger_name} VS ${challenge.challenged_name}`, `${time}`);
        currentEventsContainer.appendChild(clone);
    }
}

function getMatches(leagueId) {
    const matchesContainer = document.getElementById('matches-container');
    fetchData(`/matches?leagueId=${leagueId}`, 'GET', { 'Authorization': `Bearer ${token}` }, null, (matches) => { 
        console.log('Matches:', matches);
        matches.forEach(match => {
            const matchCard = document.createElement('div');
            matchCard.className = 'match-card';

            const matchInfo = document.createElement('div');
            matchInfo.className = 'match-info';

            if(match.type == 'league') {
                matchCard.classList.add('official-match');
            }

            // Create match teams element
            const matchTeams = document.createElement('p');
            matchTeams.className = 'match-teams';
            matchTeams.textContent = `${match.home_team_name} vs ${match.away_team_name}`;

            // Add "Live" indicator if match is in progress
            if (!match.is_over) {
                const liveIndicator = document.createElement('span');
                liveIndicator.className = 'live-indicator';
                liveIndicator.textContent = 'Live';
                matchTeams.appendChild(liveIndicator);
            }
            matchInfo.appendChild(matchTeams);

            // Create match score element with spoiler effect
            const matchScore = document.createElement('p');
            matchScore.className = 'match-score';
            matchScore.textContent = `Score: ${match.home_team_live_score} - ${match.away_team_live_score}`;
            matchInfo.appendChild(matchScore);

            const matchTime = document.createElement('p');
            matchTime.className = 'match-time';
            matchTime.textContent = match.is_over ? '' : 'Started ';
            matchTime.textContent += timeAgo(new Date(match.created_at + ' UTC').getTime());
            matchInfo.appendChild(matchTime);

            // Add event listener to reveal score when clicked
            matchScore.addEventListener('click', function() {
                this.classList.toggle('revealed');
            });

            matchCard.appendChild(matchInfo);

            const matchActions = document.createElement('div');
            matchActions.className = 'match-actions';
            const viewButton = document.createElement('button');
            viewButton.className = 'view-button';
            viewButton.innerText =  match.is_over ? 'Watch Replay' : 'Watch Match';
            viewButton.addEventListener('click', () => {
                window.location.href = `../match/match.html?matchId=${match.id}`;
            });
            matchActions.appendChild(viewButton);

            if(match.is_over) {
                const statsButton = document.createElement('button');
                statsButton.className = 'stats-button';
                statsButton.innerText = 'View Stats';
                statsButton.addEventListener('click', () => {
                    window.location.href = `../boxscore/boxscore.html?matchId=${match.id}`;
                });
                matchActions.appendChild(statsButton);
            }

            matchCard.appendChild(matchActions);
            matchesContainer.appendChild(matchCard);
        });
    }, (error) => {
        console.error('Error fetching matches:', error);
        messageDiv.innerText = 'Error fetching matches!';
    });
}

function getDraft(leagueId) {
    console.log("Getting draft")
    fetchData(`/league/drafts?leagueId=${leagueId}`, 'GET', { 'Authorization': `Bearer ${token}` }, null, (drafts) => {
        console.log("Draft: ", drafts)
        if(drafts.length > 0) {
            console.log("Adding draft event")
            addDraftEvent(drafts[0].id);
        }
    }, (error) => {
        console.error('Error fetching drafts:', error);
        messageDiv.innerText = 'Error fetching drafts!';
    });
}

function getChallenges(challengeButtons) {
    fetchData(`/challenges?teamId=${myTeamId}`, 'GET', { 'Authorization': `Bearer ${token}` }, null, (challenges) => {
        console.log('Challenges:', challenges);
        challenges.forEach(challenge => {
            console.log('Chalenge:', challenge.id);
            console.log(challengeButtons)
            const otherTeamId = challenge.challenger_team_id !== myTeamId ? challenge.challenger_team_id : challenge.challenged_team_id;
            const challengeButton = challengeButtons[otherTeamId];
            if(challengeButton) { //set challenge buttons depending on challenge status
                console.log("Challenge button: ", challenge.status)
                challengeButton.value = challenge.id;
                console.log(challengedIds)
                challengedIds[challenge.id] = challenge.challenged_team_id;
                challengerIds[challenge.id] = challenge.challenger_team_id;
                if(challenge.status === 'pending') {
                    if(challenge.challenger_team_id == myTeamId) {
                        challengeButton.innerText = 'Pending';
                        challengeButton.disabled = true;
                    }
                    else {
                        challengeButton.innerText = 'Accept Challenge';
                    }
                }
                else if(challenge.status === 'accepted' ) {
                    challengeButton.innerText = 'View Challenge';
                }
            }
        });
    }, (error) => {
        console.error('Error fetching challenges:', error);
        messageDiv.innerText = 'Error fetching challenges!';
    });
} 

function challenge(teamId, myTeamId, button) {
    if(button.innerText === 'Challenge') {
        console.log('Challenging team:', teamId);
        // Send challenge request
        fetchData(`/challenges`, 'POST', { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, { teamId, myTeamId }, (data) => {
            button.innerText = 'Pending';
            button.disabled = true;
        }, (error) => {
            console.error('Error challenging team:', error);
            messageDiv.innerText = 'Error challenging team!';
        });
    } else if (button.innerText === 'Accept Challenge') {
        // Accept challenge
        fetchData(`/challenges/${button.value}/accept`, 'POST', { 'Content-Type': 'application', 'Authorization': `Bearer ${token}` }, null, (data) => {
            const challengeId = button.value;
            window.location.href = `../bench/bench.html?challengedId=${challengedIds[challengeId]}&challengerId=${challengerIds[challengeId]}&challengeId=${challengeId}`;
        }, (error) => {
            console.error('Error accepting challenge:', error);
            messageDiv.innerText = 'Error accepting challenge!';
        });
    }
    else if(button.innerText === 'View Challenge') {
        const challengeId = button.value;
        window.location.href = `../bench/bench.html?challengedId=${challengedIds[challengeId]}&challengerId=${challengerIds[challengeId]}&challengeId=${challengeId}`;
    }
}

function startLeague(leagueName) {
    window.location.href = `../settings/settings.html?leagueName=${leagueName}`;
}