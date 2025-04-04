import { fetchData } from "../api.js";
let token = localStorage.getItem('token');

document.addEventListener('DOMContentLoaded', () => {
    configureTournamentDatePicker();
    const form = document.getElementById('settings-form');
    const messageDiv = document.getElementById('message');
    const urlParams = new URLSearchParams(window.location.search);
    const leagueName = urlParams.get('leagueName');

    // Tab switching logic
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));

            button.classList.add('active');
            document.getElementById(button.dataset.tab).classList.add('active');
        });
    });

    document.getElementById('time-between-same-player-days').addEventListener('input', configureTournamentDatePicker);
    document.getElementById('start-datetime').addEventListener('input', configureTournamentDatePicker);
    document.getElementById('num-matches').addEventListener('input', configureTournamentDatePicker);
    // Set default active tab
    tabButtons[0].classList.add('active');
    tabPanes[0].classList.add('active');

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Get input values from General tab
        const draftTimeInput = document.getElementById('draft-time');
        const friendlyTickInput = document.getElementById('friendly-tick');
        const competitiveTickInput = document.getElementById('competitive-tick');
        const playersSetTimeInput = document.getElementById('players-set-time');
        // Get input values from Scheduling tab
        const startDatetimeInput = document.getElementById('start-datetime');
        const tourneyTimeInput = document.getElementById('tournament-datetime');
        const numMatchesInput = document.getElementById('num-matches');
        const timeBetweenMatchesInput = document.getElementById('time-between-matches');
        // New inputs for time between same player matches
        const tbspDaysInput = document.getElementById('time-between-same-player-days');
        const tbspHoursInput = document.getElementById('time-between-same-player-hours');
        const tbspMinutesInput = document.getElementById('time-between-same-player-minutes');

        const draftTimeValue = Number(draftTimeInput.value);
        const playersSetTimeValue = Number(playersSetTimeInput.value);
        const friendlyTickValue = Number(friendlyTickInput.value);
        const competitiveTickValue = Number(competitiveTickInput.value);
        const startDatetime = new Date(startDatetimeInput.value).toISOString();
        const tournamentTime = new Date(tourneyTimeInput.value).toISOString();
        const numMatchesValue = Number(numMatchesInput.value);
        const timeBetweenMatchesValue = Number(timeBetweenMatchesInput.value);
        
        const tbspDays = Number(tbspDaysInput.value);
        const tbspHours = Number(tbspHoursInput.value);
        const tbspMinutes = Number(tbspMinutesInput.value);
        // Convert time between same player matches to total minutes
        const totalSamePlayerMinutes = (tbspDays * 1440) + (tbspHours * 60) + tbspMinutes;

        // Validate starting time is set and in the future
        if (!startDatetime) {
            messageDiv.textContent = "Please set a starting time.";
            return;
        }
        console.log(startDatetime)
        const now = new Date().toISOString();
        if (Date.parse(startDatetime) <= Date.parse(now)) {
            messageDiv.textContent = "The starting time must be later than the current time.";
            return;
        }

        // Validate draft time
        if (isNaN(draftTimeValue) || draftTimeValue < 1) {
            messageDiv.textContent = "Please set a valid draft time limit.";
            return;
        }

        // Validate match tick times
        if (isNaN(friendlyTickValue) || friendlyTickValue <= 0) {
            messageDiv.textContent = "Please set a valid friendly match tick time.";
            return;
        }
        if (isNaN(competitiveTickValue) || competitiveTickValue <= 0) {
            messageDiv.textContent = "Please set a valid competitive match tick time.";
            return;
        }

        // Validate number of matches
        if (isNaN(numMatchesValue) || numMatchesValue <= 0) {
            messageDiv.textContent = "Please set a valid number of matches.";
            return;
        }

        // Validate time between matches
        if (isNaN(timeBetweenMatchesValue) || timeBetweenMatchesValue <= 0) {
            messageDiv.textContent = "Please set a valid time between matches.";
            return;
        }

        if(playersSetTimeValue > totalSamePlayerMinutes) {
            messageDiv.textContent = "Players set time cannot be greater than time between same player matches.";
            return;
        }

        // Validate time between same player matches inputs
        if (isNaN(tbspDays) || tbspDays < 0 || isNaN(tbspHours) || tbspHours < 0 || isNaN(tbspMinutes) || tbspMinutes < 0 || totalSamePlayerMinutes <= 0) {
            messageDiv.textContent = "Please set a valid time between matches of the same player.";
            return;
        }

        // Process/remove error messages
        messageDiv.style.color = 'green';
        messageDiv.textContent = "Settings saved successfully!";

        fetchData('/start-league', 'POST', { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, { 
            leagueName, 
            startDatetime, 
            playersSetTime: playersSetTimeValue,
            tournamentTime,
            draftTimeValue, 
            friendlyTickValue, 
            competitiveTickValue,
            numMatchesValue, 
            timeBetweenMatchesValue, 
            timeBetweenSamePlayerMatchesValue: totalSamePlayerMinutes 
        }, (data) => {
            messageDiv.innerText = data.message;
            if (data.message === 'League started successfully!') {
                window.location.href = '../league/league.html?league=' + leagueName;
            }
        }, (error) => {
            console.log("Error: ", error);
            messageDiv.innerText = 'Error starting league!';
        });

        // Log settings for demonstration
        console.log("First Match Start Time:", startTime);
        console.log("Draft Time Limit (minutes):", draftTimeValue);
        console.log("Friendly Match Tick Time (seconds):", friendlyTickValue);
        console.log("Competitive Match Tick Time (seconds):", competitiveTickValue);
        console.log("Number of Matches:", numMatchesValue);
        console.log("Time Between Matches (minutes):", timeBetweenMatchesValue);
        console.log("Time Between Matches of Same Player (minutes):", totalSamePlayerMinutes);

        // Optionally, save settings to localStorage (or send to a server)
        localStorage.setItem('leagueSettings', JSON.stringify({
            startTime: startTime.toISOString(),
            draftTimeLimit: draftTimeValue,
            friendlyTickTime: friendlyTickValue,
            competitiveTickTime: competitiveTickValue,
            numMatches: numMatchesValue,
            timeBetweenMatches: timeBetweenMatchesValue,
            timeBetweenSamePlayerMatches: totalSamePlayerMinutes
        }));

        // Reset form or perform additional actions if needed...
    });
});

function configureTournamentDatePicker() {
    // Get inputs needed to calculate the regular season range
    const startDatetimeInput = document.getElementById('start-datetime');
    const numMatchesInput = document.getElementById('num-matches');
    const tbspDaysInput = document.getElementById('time-between-same-player-days');
    const messageDiv = document.getElementById('message');
    
    // Parse values (ensure they are numbers)
    const startDatetime = new Date(startDatetimeInput.value);
    const numMatches = Number(numMatchesInput.value);
    const tbspDays = Number(tbspDaysInput.value);

    // Calculate the regular season range (from startDatetime, inclusive, to endSeason, exclusive)
    const seasonStart = new Date(startDatetime);
    seasonStart.setHours(0, 0, 0, 0);
    const endSeason = new Date(startDatetime);
    endSeason.setDate(endSeason.getDate() + tbspDays * numMatches);
    
    flatpickr("#tournament-datetime", {
        enableTime: true,
        dateFormat: "Y-m-d\\TH:i",
        // Disable days that are within the regular season period:
        onChange: function(selectedDates, dateStr, instance) {
            if (selectedDates.length > 0) {
                const date = new Date(selectedDates[0]);
                if (date >= seasonStart && date < endSeason) {
                    // Warn the user and clear the invalid selection.
                    messageDiv.textContent = "Cannot select a date within the regular season period.";
                    instance.clear();
                } else {
                    messageDiv.textContent = "";
                }
            }
        },
        onDayCreate: function(dObj, dStr, fp, dayElem) {
            // Also add a custom class for styling if desired.
            const date = new Date(dayElem.dateObj);
            date.setHours(0, 0, 0, 0);
            if (date >= seasonStart && date < endSeason) {
                dayElem.classList.add("regular-season");
            }
        }
    });
}