import {expect} from 'chai';
import { Team } from '../server/Models/team.js'; // Adjust the path as necessary
import { Player } from '../server/Models/player.js'; // Adjust the path as necessary

describe('Team Model', function() {
    let team;

    beforeEach(function() {
        team = new Team('Team A', 1, 'Owner A');
    });

    it('should add a player to the team', function() {
        const player = new Player();
        team.addPlayer(player);
        expect(team.players).to.include(player);
    });

    it('should save the team to the database', function(done) {
        team.save(function(err) {
            expect(err).to.be.null;
            // Additional assertions can be made here if needed
            done();
        });
    });
});

describe('Player Model', function() {
    let player;

    beforeEach(function() {
        player = new Player();
    });

    it('should generate a random name', function() {
        expect(player.name).to.not.be.null;
    });

    it('should randomize the player stats', function() {
        player.randomize_stats(10);
        expect(player.bulk + player.scoring + player.assist + player.offense + player.medicine).to.equal(15);
    });
});