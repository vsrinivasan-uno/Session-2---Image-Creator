const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

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
    if (req.method === 'GET' && req.query.health === 'check') {
        return res.json({ status: 'healthy', service: 'submissions' });
    }

    // Get all submissions
    if (req.method === 'GET') {
        try {
            await ensureDatabase();
            
            const result = await pool.query(`
                SELECT * FROM submissions 
                ORDER BY submitted_at DESC
            `);
            
            return res.json(result.rows);
        } catch (error) {
            console.error('Error fetching submissions:', error);
            return res.status(500).json({ error: 'Failed to fetch submissions' });
        }
    }

    // Create submission
    if (req.method === 'POST') {
        try {
            await ensureDatabase();
            
            const { assignment_id, student_name, student_email, prompt_data, image_url } = req.body;
            const submission_code = uuidv4().substring(0, 12).toUpperCase();
            
            const result = await pool.query(
                'INSERT INTO submissions (assignment_id, student_name, student_email, prompt_data, image_url, submission_code) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
                [assignment_id, student_name, student_email, JSON.stringify(prompt_data), image_url, submission_code]
            );
            
            return res.json(result.rows[0]);
        } catch (error) {
            console.error('Error submitting assignment:', error);
            return res.status(500).json({ error: 'Failed to submit assignment' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
} 