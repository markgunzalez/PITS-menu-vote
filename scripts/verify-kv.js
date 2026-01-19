require('dotenv').config();
const { createClient } = require('@vercel/kv');

const kv = createClient({
    url: process.env.PITS_REDIS_KV_REST_API_URL,
    token: process.env.PITS_REDIS_KV_REST_API_TOKEN,
});

async function verifyKV() {
    console.log("🔍 Verifying Vercel KV Connection...");

    if (!process.env.PITS_REDIS_KV_REST_API_URL) {
        console.error("❌ Error: KV_REST_API_URL is missing from .env");
        process.exit(1);
    }

    try {
        console.log("Testing Write (hincrby)...");
        await kv.hincrby('menu_votes_test', 'test_item', 1);
        
        console.log("Testing Read (hgetall)...");
        const result = await kv.hgetall('menu_votes_test');
        const total = await kv.get('total_voters');
        console.log("✅ Read Result:", result);
        console.log("✅ Total Voters:", total);

        if (result && result.test_item >= 1) {
            console.log("✅ Write/Read successful!");
        } else {
            console.warn("⚠️ Data mismatch.");
        }

        console.log("Cleaning up...");
        await kv.del('menu_votes_test');
        console.log("✅ Cleanup successful.");

    } catch (error) {
        console.error("❌ KV Operation Failed:", error);
    }
}

verifyKV();
