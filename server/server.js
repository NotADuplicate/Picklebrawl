import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';
import { db } from './database.js';
import leagueRoutes from './Routes/leagues.js';
import { QuirkGenerator } from './quirkGenerator.js';
import { NameGenerator } from './Models/nameGenerator.js';
import teamRoutes from './Routes/teams.js';
import challengesRoutes from './Routes/challenges.js';
import statsRoutes from './Routes/stats.js';
import matchRoutes from './Routes/match.js';
import draftRoutes from './Routes/draft.js';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { authenticator, SECRET_KEY } from './Models/authenticator.js';

const app = express();
const PORT = 6969;

// Convert import.meta.url to __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//app.use(bodyParser.json());
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

QuirkGenerator.loadQuirks();
const namesFilePath = path.join(__dirname, './names.json');
let namesArray = [];

fs.readFile(namesFilePath, 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading names file:', err.message);
        return;
    }
    try {
        let namesJson = JSON.parse(data);
        NameGenerator.init(namesJson.names);
    } catch (parseErr) {
        console.error('Error parsing names file:', parseErr.message);
    }
});

console.log("Loading routes");
// Use routers
app.use('/', leagueRoutes);
app.use('/', teamRoutes);
console.log("Loading routes");
app.use('/', challengesRoutes);
app.use('/', statsRoutes);
app.use('/', matchRoutes);
console.log("Loading routes");
app.use('/', draftRoutes);
console.log("Loading routes");

// Serve login.html as the default page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/login/login.html'));
});

// Endpoint to create an account
app.post('/create-account', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required!' });
    }

    db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, [username, password], function(err) {
        if (err) {
            console.error('Error inserting user:', err.message);
            return res.status(400).json({ message: 'Username already exists!' });
        }
        const token = jwt.sign({ userId: this.lastID }, SECRET_KEY, { expiresIn: '2h' });
        console.log('User created with id:', this.lastID, " and token:", token);
        res.json({ message: 'Account created successfully!', token });
    });
});

// Endpoint to log in
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required!' });
    }

    db.get(`SELECT * FROM users WHERE username = ? AND password = ?`, [username, password], (err, row) => {
        if (err) {
            console.error('Error querying user:', err.message);
            return res.status(500).json({ message: 'Internal server error!' });
        }
        if (!row) {
            return res.status(400).json({ message: 'Invalid username or password!' });
        }

        const token = jwt.sign({ userId: row.id }, SECRET_KEY, { expiresIn: '2h' });
        res.json({ message: "Login successful!", token });
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on :${PORT}`);
});