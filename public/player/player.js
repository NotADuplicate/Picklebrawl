import { fetchData } from "../api.js";
document.addEventListener('DOMContentLoaded', () => {
    // Dummy data for player's stats

    const urlParams = new URLSearchParams(window.location.search);
    let playerId = urlParams.get('playerId');
    let dummyStats;
    fetchData(`/teams/player/${playerId}`, 'GET', {}, null, (data) => {
        console.log(data);
        dummyStats = data.rows;
        // Display total stats on page load
        displayTotal();
    });
  
    // Function to display total stats
    function displayTotal() {
      console.log(dummyStats)
      console.log(dummyStats.total_dmg);
        document.getElementById('points-value').textContent = dummyStats.total_points
        document.getElementById('player-name').textContent = dummyStats.player_name
        document.getElementById('player-team').textContent = dummyStats.team
        console.log(document.getElementById("field-goals"))
        document.getElementById('field-goals').textContent = Number(dummyStats.total_FG_makes).toFixed(0) + "/" + Number(dummyStats.total_FG_attempts).toFixed(0);
        document.getElementById('blitz-goals').textContent = Number(dummyStats.total_blitz_makes).toFixed(0) + "/" + Number(dummyStats.total_blitz_attempts).toFixed(0);
        document.getElementById('points-blocked-value').textContent = dummyStats.total_blocks
        document.getElementById('meters-advanced-value').textContent = Number(dummyStats.total_advance).toFixed(1);
        document.getElementById('meters-defended-value').textContent = Number(dummyStats.total_defense).toFixed(1);
        document.getElementById('damage-dealt-value').textContent = Number(dummyStats.total_dmg).toFixed(1);
        document.getElementById('steals-value').textContent = dummyStats.total_steals
        document.getElementById('matches-played').querySelector('span').textContent = dummyStats.matches_played;
    }
  
    // Function to display average stats
    function displayAverage() {
    document.getElementById('points-value').textContent = Number(dummyStats.avg_points).toFixed(1);
    document.getElementById('field-goals').textContent = Number(dummyStats.avg_FG_makes).toFixed(1) + "/" + Number(dummyStats.avg_FG_attempts).toFixed(1);
    document.getElementById('blitz-goals').textContent = Number(dummyStats.avg_blitz_makes).toFixed(1) + "/" + Number(dummyStats.avg_blitz_attempts).toFixed(1);
    document.getElementById('points-blocked-value').textContent = Number(dummyStats.avg_blocks).toFixed(1);
    document.getElementById('meters-advanced-value').textContent = Number(dummyStats.avg_advance).toFixed(1);
    document.getElementById('meters-defended-value').textContent = Number(dummyStats.avg_defense).toFixed(1);
    document.getElementById('damage-dealt-value').textContent = Number(dummyStats.avg_dmg).toFixed(1);
    document.getElementById('steals-value').textContent = Number(dummyStats.avg_steals).toFixed(1);
    }
  
    
  
    // Add event listeners to toggle buttons
    const totalButton = document.getElementById('view-total');
    const averageButton = document.getElementById('view-average');
  
    totalButton.addEventListener('click', () => {
      totalButton.classList.add('active');
      averageButton.classList.remove('active');
      displayTotal();
    });
  
    averageButton.addEventListener('click', () => {
      averageButton.classList.add('active');
      totalButton.classList.remove('active');
      displayAverage();
    });
  });