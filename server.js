require('dotenv').config(); // Load environment variables locally
const express = require('express');
const path = require('path');
const { kv, createClient } = require('@vercel/kv'); // Vercel KV SDK
const app = express();
const PORT = process.env.PORT || 3000;

// Check Environment
const USE_KV = !!process.env.PITS_REDIS_KV_REST_API_URL;
const IS_VERCEL = !!process.env.VERCEL;

// Function to get KV client with custom env vars
const getKvClient = () => {
    if (USE_KV) {
        return createClient({
            url: process.env.PITS_REDIS_KV_REST_API_URL,
            token: process.env.PITS_REDIS_KV_REST_API_TOKEN,
        });
    }
    return kv;
}

const kvClient = getKvClient();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); 

// --- Database adapters ---

// --- Database adapters ---

// 2. In-Memory Fallback (Primary fallback if verified KV fails)
const memoryStore = {};
let memoryTotalVoters = 0;

// Data Helpers
const Data = {
    async getVotes() {
        if (USE_KV) {
            // Redis (Cloud)
            const raw = (await kvClient.hgetall('menu_votes')) || {};
            const total = (await kvClient.get('total_voters')) || 0;
            
            // Redis often returns strings, cast to numbers for consistency
            const results = {};
            for (const [key, value] of Object.entries(raw)) {
                results[key] = parseInt(value, 10);
            }
            return { votes: results, totalVoters: parseInt(total, 10) };
        } else {
            // In-Memory Fallback
            return { votes: memoryStore, totalVoters: memoryTotalVoters };
        }
    },

    async addVotes(selectedIds) {
        if (USE_KV) {
            // Redis (Cloud)
            const pipeline = kvClient.pipeline();
            selectedIds.forEach(id => {
                pipeline.hincrby('menu_votes', id, 1);
            });
            pipeline.incr('total_voters');
            await pipeline.exec();
            return this.getVotes();
        } else {
            // In-Memory Fallback
            selectedIds.forEach(id => {
                memoryStore[id] = (memoryStore[id] || 0) + 1;
            });
            memoryTotalVoters++;
            return { votes: memoryStore, totalVoters: memoryTotalVoters };
        }
    },

    async resetVotes() {
        if (USE_KV) {
            // Redis (Cloud)
            await kvClient.del('menu_votes');
            await kvClient.set('total_voters', 0);
        } else {
            // In-Memory Fallback
            for (const key in memoryStore) delete memoryStore[key];
            memoryTotalVoters = 0;
        }
        return {};
    }
};



// --- APIs ---

// Explicit Root Route (Fallback if static serving fails locally)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

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
        let mode = '🗄️ In-Memory (Fallback)';
        if (USE_KV) mode = '⚡ Vercel KV (Redis)';
        console.log(`Storage Mode: ${mode}`);
    });
}

// Export for Vercel Serverless
module.exports = app;
