import { fetchData } from "../api.js";

let events = [];
let myTeamId = localStorage.getItem('teamId');
let leagueId;
// Example events array - these would typically be passed in or fetched from a server.
document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    leagueId = urlParams.get('leagueId');
    // Initial render
    getUpcoming(leagueId, renderCalendar);
    
    const backButton = document.getElementById('back-button');
    backButton.addEventListener('click', () => {
        window.history.back();
    });
});

let currentDate = new Date();

function renderCalendar() {
    const calendarEl = document.getElementById('calendar');
    const monthYearEl = document.getElementById('month-year');
    calendarEl.innerHTML = ""; // Clear previous calendar

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay(); // 0 (Sunday) - 6 (Saturday)
    const totalDays = lastDay.getDate();

    // Set header title (e.g., "February 2025")
    const options = { month: 'long', year: 'numeric' };
    monthYearEl.textContent = currentDate.toLocaleDateString(undefined, options);

    // Fill in blank days for the previous month at start of week
    for (let i = 0; i < startDayOfWeek; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.classList.add('day');
        calendarEl.appendChild(emptyCell);
    }

    // Create cells for each day of the month
    for (let day = 1; day <= totalDays; day++) {
        const cell = document.createElement('div');
        cell.classList.add('day');

        // Add day number display
        const dayNumber = document.createElement('div');
        dayNumber.classList.add('day-number');
        dayNumber.textContent = day;
        cell.appendChild(dayNumber);

        // Format the date string as YYYY-MM-DD
        const formattedDate = `${year}-${String(month+1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        // Find and display any events for this date
        events.filter(event => event.date === formattedDate).forEach(event => {
            if (event.url) {
                // Create a button if the event has an URL.
                const eventButton = document.createElement('button');
                eventButton.classList.add('event-button');
                eventButton.textContent = event.title;
                eventButton.addEventListener('click', () => {
                    window.location.href = event.url;
                });
                cell.appendChild(eventButton);
            } else {
                // Fallback to a normal event box.
                const eventEl = document.createElement('div');
                eventEl.classList.add('event');
                eventEl.textContent = event.title;
                cell.appendChild(eventEl);
            }
        });

        calendarEl.appendChild(cell);
    }
}

function getUpcoming(leagueId, callback) {
    const token = localStorage.getItem('token');
    fetchData(`/league/upcoming?leagueId=${leagueId}`, 'GET', { 'Authorization': `Bearer ${token}` }, null, (challenges) => {
        console.log("Upcoming challenges: ", challenges);
        challenges.sort((a, b) => new Date(a.happening_at) - new Date(b.happening_at));
        challenges.forEach(challenge => {
            const myTeamId = challenge.my_team_id
            let event = {
                title: `${challenge.challenger_name} vs ${challenge.challenged_name}`,
                date: challenge.happening_at.substring(0, 10)
            };
            if(challenge.challenger_team_id == myTeamId || challenge.challenged_team_id == myTeamId) {
                event.url = `../bench/bench.html?challengedId=${challenge.challenged_team_id}&challengerId=${challenge.challenger_team_id}&challengeId=${challenge.challenge_id}`;
            }
            events.push(event);
        });
        callback();
    }, (error) => {
        console.error('Error fetching upcoming challenges:', error);
        callback();
    });
}

// Navigation controls
document.getElementById('prev-month').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
});

document.getElementById('next-month').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
});