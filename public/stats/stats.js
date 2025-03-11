document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const teamId = urlParams.get('teamId');
    const biggestStats = document.getElementById("biggest-stats")
    biggestStats.textContent = "hello"
    const data = setGameStats(teamId)
});

function setGameStats(teamId) {
    fetch(`/game-stats?teamId=${teamId}`)
    .then(response => response.json())
    .then(stats => {
        console.log("Inside setGameStats, gotten stats:")
        console.log(stats)

        console.log("Setting games won:")
        setGamesWon(stats)
    });
};

function setGamesWon(data) {

}