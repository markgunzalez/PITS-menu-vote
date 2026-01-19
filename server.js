const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { kv } = require('@vercel/kv'); // Vercel KV SDK

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'data', 'votes.db');

// Check Environment
const USE_KV = !!process.env.KV_REST_API_URL;
const IS_VERCEL = !!process.env.VERCEL;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname))); 

// --- Database adapters ---

// 1. SQLite Adapter (Lazy Load for Local Only)
let db;
if (!USE_KV && !IS_VERCEL) {
    const fs = require('fs');
    const sqlite3 = require('sqlite3').verbose();
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
    
    db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) console.error('SQLite Error:', err.message);
        else {
            console.log('Connected to Local SQLite.');
            db.run(`CREATE TABLE IF NOT EXISTS menu_votes (id INTEGER PRIMARY KEY, count INTEGER DEFAULT 0)`);
        }
    });
}

// 2. In-Memory Fallback (For Vercel without KV)
const memoryStore = {};

// Data Helpers
const Data = {
    async getVotes() {
        if (USE_KV) {
            // Redis (Cloud)
            return (await kv.hgetall('menu_votes')) || {};
        } else if (IS_VERCEL) {
            // In-Memory (Fallback)
            // Note: Data resets on server restart
            return memoryStore;
        } else {
            // SQLite (Local)
            return new Promise((resolve, reject) => {
                db.all("SELECT id, count FROM menu_votes", [], (err, rows) => {
                    if (err) reject(err);
                    else {
                        const results = {};
                        rows.forEach(row => results[row.id] = row.count);
                        resolve(results);
                    }
                });
            });
        }
    },

    async addVotes(selectedIds) {
        if (USE_KV) {
            // Redis (Cloud)
            const pipeline = kv.pipeline();
            selectedIds.forEach(id => {
                pipeline.hincrby('menu_votes', id, 1);
            });
            await pipeline.exec();
            return this.getVotes();
        } else if (IS_VERCEL) {
            // In-Memory (Fallback)
            selectedIds.forEach(id => {
                memoryStore[id] = (memoryStore[id] || 0) + 1;
            });
            return memoryStore;
        } else {
            // SQLite (Local)
            return new Promise((resolve, reject) => {
                db.serialize(() => {
                    const stmt = db.prepare("INSERT INTO menu_votes (id, count) VALUES (?, 1) ON CONFLICT(id) DO UPDATE SET count = count + 1");
                    selectedIds.forEach(id => stmt.run(id));
                    stmt.finalize(() => {
                        this.getVotes().then(resolve).catch(reject);
                    });
                });
            });
        }
    },

    async resetVotes() {
        if (USE_KV) {
            await kv.del('menu_votes');
        } else if (IS_VERCEL) {
            for (const key in memoryStore) delete memoryStore[key];
        } else {
            return new Promise((resolve, reject) => {
                db.run("DELETE FROM menu_votes", [], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        }
        return {};
    }
};

// --- APIs ---

app.post('/api/reset', async (req, res) => {
    try {
        await Data.resetVotes();
        res.json({ success: true, message: 'All votes have been reset.' });
    } catch (err) {
        console.error("Reset Error:", err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/vote', async (req, res) => {
    const { selectedIds } = req.body;
    if (!Array.isArray(selectedIds) || selectedIds.length === 0) {
        return res.status(400).json({ error: 'Invalid selection' });
    }

    try {
        const results = await Data.addVotes(selectedIds);
        res.json({ success: true, message: 'Votes recorded', results });
    } catch (err) {
        console.error("Save Error:", err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/results', async (req, res) => {
    try {
        const results = await Data.getVotes();
        res.json(results);
    } catch (err) {
        console.error("Read Error:", err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Start Server
// Only start listening if running directly (not required/handled by Vercel in serverless mode usually, but harmless if guarded)
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
        let mode = '🗄️ Local (SQLite)';
        if (USE_KV) mode = '⚡ Vercel KV (Redis)';
        else if (IS_VERCEL) mode = '⚠️ In-Memory (Fallback)';
        console.log(`Storage Mode: ${mode}`);
    });
}

// Export for Vercel Serverless
module.exports = app;
