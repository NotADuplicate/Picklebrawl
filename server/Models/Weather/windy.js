import { Weather } from './weather.js';

export class Windy extends Weather {
    description = "Scoring is more difficult from range";

    scoreEffect(shooter, offenseTeam, defenseTeam, position) { //windy effects scoring
        console.log("WIND")
        let shooting = Math.random() * (shooter.agility + shooter.tempAgility)
        console.log("Shooting: " + shooting);
        for (const player of defenseTeam.players) {
            if(player.defensePriority === "Defend Score") {
                shooting -= Math.random() * (player.bulk + player.tempBulk);
            }
        }
        shooting -= (100-this.position) * 0.3; //distance from goal has triple the effect it had before
        return(shooting > -1); 
    }
}