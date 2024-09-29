document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const teamId = urlParams.get('teamId');
    console.log("DOM")
    getGameStats(teamId)
});

function getGameStats(teamId) {
    fetch(`http://localhost:3000/game-stats?teamId=${teamId}`)
    .then(response => response.json())
    .then(stats => {
        console.log(stats)
    });
};
