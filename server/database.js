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
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS leagues (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        founder_id INT NOT NULL,
        started BOOLEAN NOT NULL,
        draft_timer_mins INT DEFAULT 300,
        friendly_tick_secs INT DEFAULT 1,
        competitive_tick_secs INT DEFAULT 2, 
        FOREIGN KEY (founder_id) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS teams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        league_id INTEGER NOT NULL,
        owner_id TEXT NOT NULL,
        in_season BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (league_id) REFERENCES leagues(id),
        FOREIGN KEY (owner_id) REFERENCES users(id),
        UNIQUE(league_id, name),
        UNIQUE(league_id, owner_id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS league_users (
        league_id INTEGER NOT NULL,
        user_id TEXT NOT NULL,
        FOREIGN KEY (league_id) REFERENCES leagues(id)
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS quirks (
        id INTEGER PRIMARY KEY,
        title TEXT UNIQUE NOT NULL,
        description TEXT NOT NULL,
        power_modifier INTEGER
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
        power INTEGER NOT NULL, 
        team_id INTEGER,
        quirk INT NOT NULL,
        draft_id INT,
        FOREIGN KEY (team_id) REFERENCES teams(id)
        FOREIGN KEY (quirk) REFERENCES quirks(id)
        FOREIGN KEY (draft_id) REFERENCES drafts(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS challenges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        challenger_team_id INT NOT NULL,
        challenged_team_id INT NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        challenger_players_set BOOLEAN DEFAULT FALSE,
        challenged_players_set BOOLEAN DEFAULT FALSE,
        challenger_actions_set BOOLEAN DEFAULT FALSE,
        challenged_actions_set BOOLEAN DEFAULT FALSE,
        friendly BOOLEAN DEFAULT TRUE,
        happening_at DATETIME,
        league_id INT,

        FOREIGN KEY (challenger_team_id) REFERENCES teams(id),
        FOREIGN KEY (challenged_team_id) REFERENCES teams(id),
        FOREIGN KEY (league_id) REFERENCES leagues(id)
    );`);

    db.run(`CREATE TABLE IF NOT EXISTS challenge_players (
        challenge_id INT NOT NULL,
        player_id INT NOT NULL,
        team_id INT NOT NULL,
        offense_action TEXT,
        defense_action TEXT,
        offense_target_id INT,
        defense_target_id INT,
        offense_property TEXT,
        defense_property TEXT,
        FOREIGN KEY (challenge_id) REFERENCES challenges(id),
        FOREIGN KEY (player_id) REFERENCES players(id),
        FOREIGN KEY (team_id) REFERENCES teams(id)
        UNIQUE (challenge_id, player_id)
    );`);

    // Make a table where each row contains a single historical match
    db.run('DROP TABLE IF EXISTS match_history');
    db.run(`CREATE TABLE IF NOT EXISTS match_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        league_id INT NOT NULL,
        challenge_id INT,
        home_team_id INT NOT NULL,
        away_team_id INT NOT NULL,
        home_team_score INT,
        away_team_score INT,
        weather TEXT NOT NULL,
        type TEXT DEFAULT 'friendly',
        created_at DATETIME DEFAULT (datetime(CURRENT_TIMESTAMP, '+20 seconds')),
        FOREIGN KEY (home_team_id) REFERENCES teams(id),
        FOREIGN KEY (away_team_id) REFERENCES teams(id),
        FOREIGN KEY (league_id) REFERENCES leagues(id),
        FOREIGN KEY (challenge_id) REFERENCES challenges(id)
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
    db.run('DROP TABLE IF EXISTS match_ticks_history');
    db.run(`CREATE TABLE IF NOT EXISTS match_ticks_history (
        tick INT NOT NULL,
        match_id INT NOT NULL,
        possession_team_id INT NOT NULL,
        ball_position INT NOT NULL,
        player_possession_id INT NOT NULL,
        FOREIGN KEY (match_id) REFERENCES match_history(id),
        FOREIGN KEY (possession_team_id) REFERENCES teams(id),
        FOREIGN KEY (player_possession_id) REFERENCES players(id)
    );`);

    db.run('DROP TABLE IF EXISTS match_action_history');
   db.run(`CREATE TABLE IF NOT EXISTS match_action_history (
        match_id INT NOT NULL,
        tick INT NOT NULL,
        player_id INT NOT NULL,
        action TEXT NOT NULL,
        FOREIGN KEY (match_id) REFERENCES match_history(id),
        FOREIGN KEY (tick) REFERENCES match_ticks_history(tick)
        FOREIGN KEY (player_id) REFERENCES players(id)
    );`);

    db.run('DROP TABLE IF EXISTS match_trick_history');
    db.run(`CREATE TABLE IF NOT EXISTS match_trick_history (
        match_id INT NOT NULL,
        tick INT NOT NULL,
        tricker_id INT NOT NULL,
        tricked_id INT NOT NULL,
        trick_type TEXT NOT NULL,
        FOREIGN KEY (match_id) REFERENCES match_history(id),
        FOREIGN KEY (tick) REFERENCES match_ticks_history(tick),
        FOREIGN KEY (tricker_id) REFERENCES players(id),
        FOREIGN KEY (tricked_id) REFERENCES players(id)
    );`);

    db.run('DROP TABLE IF EXISTS player_history');
    db.run(`CREATE TABLE IF NOT EXISTS player_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        match_id INT NOT NULL,
        second_half BOOL NOT NULL,
        player_id INT NOT NULL,
        offensive_role TEXT NOT NULL,
        offensive_target_id INT,
        defensive_role TEXT NOT NULL,
        defensive_target_id INT,
        offense_action_property TEXT,
        defense_action_property TEXT,
        FOREIGN KEY (match_id) REFERENCES match_history(id),
        FOREIGN KEY (player_id) REFERENCES players(id),
        FOREIGN KEY (offensive_target_id) REFERENCES players(id),
        FOREIGN KEY (defensive_target_id) REFERENCES players(id)
    );`);

    db.run('DROP TABLE IF EXISTS attack_history');
    db.run(`CREATE TABLE IF NOT EXISTS attack_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        match_id INT NOT NULL,
        tick INT NOT NULL,
        attacking_player_id INT NOT NULL,
        attacked_player_id INT NOT NULL,
        damage_done FLOAT NOT NULL,
        percent_health_done FLOAT NOT NULL,
        permanent_injury BOOLEAN NOT NULL,
        FOREIGN KEY (match_id) REFERENCES match_history(id),
        FOREIGN KEY (tick) REFERENCES match_history(tick),
        FOREIGN KEY (attacking_player_id) REFERENCES players(id),
        FOREIGN KEY (attacked_player_id) REFERENCES players(id)
    );`);

    db.run('DROP TABLE IF EXISTS scoring_history');
    db.run(`CREATE TABLE IF NOT EXISTS scoring_history (
        match_id INT NOT NULL,
        tick INT NOT NULL,
        shooter_id INT NOT NULL,
        successful_score BOOLEAN NOT NULL,
        team_id INT NOT NULL,
        range INT NOT NULL,
        suspense INT NOT NULL,
        blitzer_id INT,
        blocker_id INT,
        points_worth INT NOT NULL,
        FOREIGN KEY (match_id) REFERENCES match_history(id),
        FOREIGN KEY (tick) REFERENCES match_ticks_history(tick),
        FOREIGN KEY (shooter_id) REFERENCES players(id),
        FOREIGN KEY (team_id) REFERENCES teams(id),
        FOREIGN KEY (blitzer_id) REFERENCES players(id)
    );`);

    db.run('DROP TABLE IF EXISTS advancement_history');
    db.run(`CREATE TABLE IF NOT EXISTS advancement_history (
        match_id INT NOT NULL,
        tick INT NOT NULL,
        player_id INT NOT NULL,
        advancement INT NOT NULL,
        type TEXT NOT NULL,
        FOREIGN KEY (match_id) REFERENCES match_history(id),
        FOREIGN KEY (tick) REFERENCES match_ticks_history(tick),
        FOREIGN KEY (player_id) REFERENCES players(id)
    );`);

    db.run(`CREATE TABLE IF NOT EXISTS drafts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        league_id INTEGER NOT NULL,
        turn INT NOT NULL DEFAULT 0,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        currently_drafting_team_id INT,
        FOREIGN KEY (league_id) REFERENCES leagues(id)
        FOREIGN KEY (currently_drafting_team_id) REFERENCES teams(id)
    );`);

    db.run(`CREATE TABLE IF NOT EXISTS draft_premoves (
        draft_id INTEGER NOT NULL,
        player_id INTEGER NOT NULL,
        team_id INTEGER NOT NULL,
        queue_order INT NOT NULL,
        FOREIGN KEY (draft_id) REFERENCES drafts(id),
        FOREIGN KEY (player_id) REFERENCES players(id),
        FOREIGN KEY (team_id) REFERENCES teams(id)
    );`);

    // Trigger to adjust order values after a row is deleted.
    db.run(`
    CREATE TRIGGER IF NOT EXISTS after_delete_draft_premove
    AFTER DELETE ON draft_premoves
    FOR EACH ROW
    BEGIN
      UPDATE draft_premoves
      SET queue_order = queue_order - 1
      WHERE team_id = OLD.team_id AND queue_order > OLD.queue_order;
    END;
    `);

    db.run(`CREATE TABLE IF NOT EXISTS season (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        league_id INTEGER NOT NULL,
        num INT,
        start_date DATETIME NOT NULL,
        end_date DATETIME,
        FOREIGN KEY (league_id) REFERENCES leagues(id)
    );`);

    // Trigger: before inserting a new season, if num is not provided,
    // set it to one more than the current maximum for the same league.
    db.run(`
    CREATE TRIGGER IF NOT EXISTS set_season_num
    BEFORE INSERT ON season
    FOR EACH ROW
    WHEN NEW.num IS NULL
    BEGIN
      SELECT NEW.num = COALESCE(
          (SELECT MAX(num) FROM season WHERE league_id = NEW.league_id),
          0
      ) + 1;
    END;
    `);
});

export { db };