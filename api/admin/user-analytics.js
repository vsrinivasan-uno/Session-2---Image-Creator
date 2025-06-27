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
        // Ensure playground_gallery table exists with user tracking
        await pool.query(`
            CREATE TABLE IF NOT EXISTS playground_gallery (
                id SERIAL PRIMARY KEY,
                image_url TEXT UNIQUE NOT NULL,
                prompt TEXT NOT NULL,
                technique VARCHAR(50) NOT NULL,
                parameters JSONB NOT NULL,
                user_ip INET,
                user_agent TEXT,
                user_fingerprint TEXT,
                browser_info JSONB,
                session_id TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Health check
    if (req.method === 'GET' && req.query.health === 'check') {
        return res.json({ status: 'healthy', service: 'user_analytics' });
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        await ensureDatabase();
        
        // Get user analytics from playground gallery
        const analyticsQuery = `
            SELECT 
                user_ip,
                user_fingerprint,
                session_id,
                browser_info,
                COUNT(*) as images_created,
                MIN(created_at) as first_activity,
                MAX(created_at) as last_activity,
                array_agg(DISTINCT technique) as techniques_used
            FROM playground_gallery 
            WHERE user_ip IS NOT NULL 
            GROUP BY user_ip, user_fingerprint, session_id, browser_info
            ORDER BY last_activity DESC
        `;
        
        const summaryQuery = `
            SELECT 
                COUNT(DISTINCT user_ip) as unique_ips,
                COUNT(DISTINCT user_fingerprint) as unique_fingerprints,
                COUNT(DISTINCT session_id) as unique_sessions,
                COUNT(*) as total_images
            FROM playground_gallery 
            WHERE user_ip IS NOT NULL
        `;
        
        const [analyticsResult, summaryResult] = await Promise.all([
            pool.query(analyticsQuery),
            pool.query(summaryQuery)
        ]);
        
        res.json({
            summary: summaryResult.rows[0],
            user_activity: analyticsResult.rows
        });
        
    } catch (error) {
        console.error('Error fetching user analytics:', error);
        res.status(500).json({ error: 'Failed to fetch user analytics' });
    }
} 