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
        // Create playground_gallery table with user tracking columns
        await pool.query(`
            CREATE TABLE IF NOT EXISTS playground_gallery (
                id SERIAL PRIMARY KEY,
                image_url TEXT UNIQUE NOT NULL,
                prompt TEXT NOT NULL,
                technique VARCHAR(50) NOT NULL,
                parameters JSONB NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                user_ip VARCHAR(45),
                user_agent TEXT,
                user_fingerprint VARCHAR(255),
                session_id VARCHAR(255),
                browser_info JSONB
            )
        `);

        // Add user tracking columns if they don't exist (for existing deployments)
        const columns = [
            { name: 'user_ip', type: 'VARCHAR(45)' },
            { name: 'user_agent', type: 'TEXT' },
            { name: 'user_fingerprint', type: 'VARCHAR(255)' },
            { name: 'session_id', type: 'VARCHAR(255)' },
            { name: 'browser_info', type: 'JSONB' }
        ];

        for (const column of columns) {
            try {
                await pool.query(`
                    ALTER TABLE playground_gallery 
                    ADD COLUMN IF NOT EXISTS ${column.name} ${column.type}
                `);
            } catch (error) {
                // Column might already exist, continue
                console.log(`Column ${column.name} might already exist:`, error.message);
            }
        }

        return true;
    } catch (error) {
        console.error('Error initializing playground gallery database:', error);
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
        return res.json({ status: 'healthy', service: 'playground_gallery' });
    }

    try {
        await ensureDatabase();
        
        if (req.method === 'POST') {
            // Add new image to gallery
            const { image_url, prompt, technique, parameters, user_tracking } = req.body;
            
            if (!image_url || !prompt || !technique || !parameters) {
                return res.status(400).json({ error: 'Missing required fields' });
            }
            
            // Extract user IP from headers (handles various proxy setups)
            const getUserIP = (req) => {
                return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                       req.headers['x-real-ip'] ||
                       req.headers['x-client-ip'] ||
                       req.connection?.remoteAddress ||
                       req.socket?.remoteAddress ||
                       'unknown';
            };
            
            // Prepare user tracking data
            const userIP = getUserIP(req);
            const userAgent = req.headers['user-agent'] || 'unknown';
            const userFingerprint = user_tracking?.fingerprint || 'unknown';
            const sessionId = user_tracking?.session_id || 'unknown';
            const browserInfo = user_tracking?.browser_info || {};
            
            try {
                // Check if image URL already exists
                const existingCheck = await pool.query(
                    'SELECT id FROM playground_gallery WHERE image_url = $1',
                    [image_url]
                );
                
                if (existingCheck.rows.length > 0) {
                    return res.json({ message: 'Image already exists in gallery', exists: true });
                }
                
                // Insert new image with user tracking data
                const result = await pool.query(
                    `INSERT INTO playground_gallery 
                     (image_url, prompt, technique, parameters, user_ip, user_agent, user_fingerprint, session_id, browser_info) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
                    [
                        image_url, 
                        prompt, 
                        technique, 
                        JSON.stringify(parameters),
                        userIP,
                        userAgent,
                        userFingerprint,
                        sessionId,
                        JSON.stringify(browserInfo)
                    ]
                );
                
                res.json({ message: 'Image added to gallery', data: result.rows[0] });
            } catch (error) {
                if (error.code === '23505') { // Unique constraint violation
                    return res.json({ message: 'Image already exists in gallery', exists: true });
                }
                throw error;
            }
            
        } else if (req.method === 'GET') {
            // Get gallery images with pagination
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const offset = (page - 1) * limit;
            const technique = req.query.technique; // Optional filter
            
            let query = 'SELECT * FROM playground_gallery';
            let countQuery = 'SELECT COUNT(*) FROM playground_gallery';
            let queryParams = [];
            let countParams = [];
            
            if (technique && technique !== 'all') {
                query += ' WHERE technique = $1';
                countQuery += ' WHERE technique = $1';
                queryParams.push(technique);
                countParams.push(technique);
            }
            
            query += ' ORDER BY created_at DESC LIMIT $' + (queryParams.length + 1) + ' OFFSET $' + (queryParams.length + 2);
            queryParams.push(limit, offset);
            
            const [imagesResult, countResult] = await Promise.all([
                pool.query(query, queryParams),
                pool.query(countQuery, countParams)
            ]);
            
            const totalImages = parseInt(countResult.rows[0].count);
            const totalPages = Math.ceil(totalImages / limit);
            
            res.json({
                images: imagesResult.rows,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalImages,
                    hasMore: page < totalPages
                }
            });
            
        } else {
            res.status(405).json({ error: 'Method not allowed' });
        }
        
    } catch (error) {
        console.error('Error in playground gallery API:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
} 