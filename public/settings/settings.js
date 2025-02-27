import { fetchData } from "../api.js";
let token = localStorage.getItem('token');

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('settings-form');
    const messageDiv = document.getElementById('message');
    const urlParams = new URLSearchParams(window.location.search);
    const leagueName = urlParams.get('leagueName');

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Get input values
        const startDatetimeInput = document.getElementById('start-datetime');
        const draftTimeInput = document.getElementById('draft-time');
        const friendlyTickInput = document.getElementById('friendly-tick');
        const competitiveTickInput = document.getElementById('competitive-tick');

        const startDatetimeValue = startDatetimeInput.value;
        const draftTimeValue = Number(draftTimeInput.value);
        const friendlyTickValue = Number(friendlyTickInput.value);
        const competitiveTickValue = Number(competitiveTickInput.value);

        // Validate starting time is set and in the future
        if (!startDatetimeValue) {
            messageDiv.textContent = "Please set a starting time.";
            return;
        }
        const startTime = new Date(startDatetimeValue);
        const now = new Date();
        if (startTime <= now) {
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

        // Process/remove error messages
        messageDiv.style.color = 'green';
        messageDiv.textContent = "Settings saved successfully!";

        fetchData('/start-league', 'POST', { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, { leagueName, startTime, draftTimeValue, friendlyTickValue, competitiveTickValue }, (data) => {
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

        // Optionally, save settings to localStorage (or send to a server)
        localStorage.setItem('leagueSettings', JSON.stringify({
            startTime: startTime.toISOString(),
            draftTimeLimit: draftTimeValue,
            friendlyTickTime: friendlyTickValue,
            competitiveTickTime: competitiveTickValue
        }));

        // Reset form or perform additional actions if needed...
    });
});