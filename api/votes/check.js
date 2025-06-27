const { Pool } = require('pg');

// Database connection
let pool;
try {
    pool = new Pool({
        connectionString: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
} catch (error) {
    console.error('Database setup error:', error);
}

// Initialize database tables
async function initializeDatabase() {
    if (!pool) return false;
    
    try {
        // Create votes table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS votes (
                id SERIAL PRIMARY KEY,
                submission_id INTEGER,
                voter_id VARCHAR(255) NOT NULL,
                voter_fingerprint TEXT,
                voter_ip VARCHAR(45),
                voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(submission_id, voter_id)
            )
        `);

        return true;
    } catch (error) {
        console.error('Error initializing database:', error);
        return false;
    }
}

let dbInitialized = false;
async function ensureDatabase() {
    if (!dbInitialized) {
        dbInitialized = await initializeDatabase();
    }
    return dbInitialized;
}

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Health check
    if (req.method === 'GET') {
        return res.json({ status: 'healthy', service: 'votes' });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        await ensureDatabase();
        
        const { voter_id, submission_ids } = req.body;
        
        if (!voter_id || !submission_ids || !Array.isArray(submission_ids)) {
            return res.status(400).json({ error: 'Voter ID and submission IDs array required' });
        }
        
        const result = await pool.query(
            'SELECT submission_id FROM votes WHERE voter_id = $1 AND submission_id = ANY($2)',
            [voter_id, submission_ids]
        );
        
        const votedSubmissions = result.rows.map(row => row.submission_id);
        res.json({ voted_submissions: votedSubmissions });
    } catch (error) {
        console.error('Error checking votes:', error);
        res.status(500).json({ error: 'Failed to check votes' });
    }
} 