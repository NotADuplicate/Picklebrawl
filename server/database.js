import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

// Convert import.meta.url to __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use a file-based SQLite database
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

// Create tables if they don't exist
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        username TEXT PRIMARY KEY UNIQUE NOT NULL,
        password TEXT NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS leagues (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        founder TEXT NOT NULL,
        started BOOLEAN NOT NULL,
        FOREIGN KEY (founder) REFERENCES users(username)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS teams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        league_id INTEGER NOT NULL,
        owner TEXT NOT NULL,
        FOREIGN KEY (league_id) REFERENCES leagues(id)
        FOREIGN KEY (owner) REFERENCES users(username)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS league_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        league_id INTEGER NOT NULL,
        username TEXT NOT NULL,
        FOREIGN KEY (league_id) REFERENCES leagues(id)
        FOREIGN KEY (username) REFERENCES users(username)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS players (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        bulk INTEGER NOT NULL,
        finesse INTEGER NOT NULL,
        height INTEGER NOT NULL,
        strength INTEGER NOT NULL,
        trickiness INTEGER NOT NULL,
        focus INTEGER NOT NULL,
        team_id INTEGER NOT NULL,
        FOREIGN KEY (team_id) REFERENCES teams(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS challenges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        challenger_team_id INT NOT NULL,
        challenged_team_id INT NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        FOREIGN KEY (challenger_team_id) REFERENCES teams(id),
        FOREIGN KEY (challenged_team_id) REFERENCES teams(id)
    );`);

    // Make a table where each row contains a single historical match
    db.run(`CREATE TABLE IF NOT EXISTS match_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        league_id INT NOT NULL,
        home_team_id INT NOT NULL,
        away_team_id INT NOT NULL,
        home_team_score INT NOT NULL,
        away_team_score INT NOT NULL,
        weather TEXT NOT NULL,
        FOREIGN KEY (league_id) REFERENCES leagues(id),
        FOREIGN KEY (home_team_id) REFERENCES teams(id),
        FOREIGN KEY (away_team_id) REFERENCES teams(id)
    );`);

    /* Store: who has possession,
    where the ball is (also tells how much advancement has happened since we'll have a log),
    roles of each player and their team (unsure how to implement cleanly -- I've added a 
        playedTeamHistory table below because that's what my brain went to),
    who attacked who and for how much damage (attacks, unsure how to implement multiple possible 
        attacks per tick, I think with a table it'll only have 1 possible attack to reference),
    who attempted to score and if they succeeded (can only allow 1 attempt per tick if that's ok),
    maybe in the future implement log of random events or ways quirks interacted
    */
    db.run(`CREATE TABLE IF NOT EXISTS match_ticks_history (
        tick INT NOT NULL,
        match_id INT NOT NULL,
        possession_team_id INT NOT NULL,
        ball_position INT NOT NULL,
        FOREIGN KEY (match_id) REFERENCES match_history(id),
        FOREIGN KEY (possession_team_id) REFERENCES teams(id),
        PRIMARY KEY (match_id, tick)
    );`);

    // Roles set as ints so we can maybe set them as an enum or something
    db.run(`CREATE TABLE IF NOT EXISTS player_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        match_id INT NOT NULL,
        tick_start INT NOT NULL,
        tick_end INT NOT NULL,
        player_id INT NOT NULL,
        offensive_role INT NOT NULL,
        offensive_target_id INT,
        defensive_role INT NOT NULL,
        defensive_target_id INT,
        FOREIGN KEY (match_id) REFERENCES match_history(id),
        FOREIGN KEY (tick_start) REFERENCES match_history(tick),
        FOREIGN KEY (tick_end) REFERENCES match_history(tick),
        FOREIGN KEY (player_id) REFERENCES players(id),
        FOREIGN KEY (offensive_target_id) REFERENCES players(id),
        FOREIGN KEY (defensive_target_id) REFERENCES players(id)
    );`);

    db.run(`CREATE TABLE IF NOT EXISTS attack_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        match_id INT NOT NULL,
        tick INT NOT NULL,
        attacking_player_id INT NOT NULL,
        attacked_player_id INT NOT NULL,
        damage_done FLOAT NOT NULL,
        permanent_injury BOOLEAN NOT NULL,
        FOREIGN KEY (match_id) REFERENCES match_history(id),
        FOREIGN KEY (tick) REFERENCES match_history(tick),
        FOREIGN KEY (attacking_player_id) REFERENCES players(id),
        FOREIGN KEY (attacked_player_id) REFERENCES players(id)
    );`);

    db.run(`CREATE TABLE IF NOT EXISTS scoring_history (
        match_id INT NOT NULL,
        tick INT NOT NULL,
        shooter_id INT NOT NULL,
        successful_score BOOLEAN NOT NULL,
        team_id INT NOT NULL,
        FOREIGN KEY (match_id) REFERENCES match_history(id),
        FOREIGN KEY (tick) REFERENCES match_history(tick),
        FOREIGN KEY (shooter_id) REFERENCES players(id),
        FOREIGN KEY (team_id) REFERENCES teams(id)
        PRIMARY KEY (match_id, tick)
    );`);

});

export { db };