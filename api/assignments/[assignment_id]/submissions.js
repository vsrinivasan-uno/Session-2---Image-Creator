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
        // Create submissions table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS submissions (
                id SERIAL PRIMARY KEY,
                assignment_id INTEGER,
                student_name VARCHAR(255) NOT NULL,
                student_email VARCHAR(255),
                prompt_data JSONB NOT NULL,
                image_url TEXT,
                submission_code VARCHAR(100) UNIQUE,
                votes INTEGER DEFAULT 0,
                is_revealed BOOLEAN DEFAULT false,
                submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

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

        // Ensure existing submissions have votes initialized to 0 if null
        await pool.query(`
            UPDATE submissions SET votes = 0 WHERE votes IS NULL
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
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        await ensureDatabase();
        
        const { assignment_id } = req.query;
        
        const result = await pool.query(
            'SELECT * FROM submissions WHERE assignment_id = $1 ORDER BY submitted_at DESC',
            [assignment_id]
        );
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching submissions:', error);
        res.status(500).json({ error: 'Failed to fetch submissions' });
    }
} 