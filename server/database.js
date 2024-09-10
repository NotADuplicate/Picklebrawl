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
        agility INTEGER NOT NULL,
        height INTEGER NOT NULL,
        strength INTEGER NOT NULL,
        medicine INTEGER NULL,
        quirk TEXT NOT NULL,
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
});

export { db };