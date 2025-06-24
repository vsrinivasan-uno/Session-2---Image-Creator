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

// Helper function to get real IP address
function getRealIP(req) {
    const forwarded = req.headers['x-forwarded-for'];
    const realIP = req.headers['x-real-ip'];
    const cfIP = req.headers['cf-connecting-ip'];
    
    let detectedIP = req.ip || req.connection?.remoteAddress || 'unknown';
    
    if (cfIP) detectedIP = cfIP;
    else if (realIP) detectedIP = realIP;
    else if (forwarded) detectedIP = forwarded.split(',')[0].trim();
    
    if (detectedIP.startsWith('::ffff:')) {
        detectedIP = detectedIP.substring(7);
    }
    
    return detectedIP;
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
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        await ensureDatabase();
        
        const { submission_id } = req.query;
        const { voter_id, voter_fingerprint } = req.body;
        const voter_ip = getRealIP(req);

        if (!voter_id) {
            return res.status(400).json({ error: 'Voter ID is required' });
        }

        // Check for duplicate vote
        const existingVote = await pool.query(
            'SELECT id FROM votes WHERE submission_id = $1 AND voter_id = $2',
            [submission_id, voter_id]
        );

        if (existingVote.rows.length > 0) {
            return res.status(409).json({ error: 'You have already voted for this submission' });
        }

        // Record the vote
        await pool.query(
            'INSERT INTO votes (submission_id, voter_id, voter_fingerprint, voter_ip) VALUES ($1, $2, $3, $4)',
            [submission_id, voter_id, voter_fingerprint, voter_ip]
        );

        // Update submission vote count
        const updateResult = await pool.query(
            'UPDATE submissions SET votes = COALESCE(votes, 0) + 1 WHERE id = $1 RETURNING votes',
            [submission_id]
        );

        const updatedVotes = updateResult.rows[0]?.votes || 1;

        res.json({
            success: true,
            votes: updatedVotes
        });

    } catch (error) {
        console.error('Error voting:', error);
        res.status(500).json({ error: 'Failed to record vote' });
    }
} 