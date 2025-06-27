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
        // Create playground_gallery table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS playground_gallery (
                id SERIAL PRIMARY KEY,
                image_url TEXT UNIQUE NOT NULL,
                prompt TEXT NOT NULL,
                technique VARCHAR(50) NOT NULL,
                parameters JSONB NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

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
            const { image_url, prompt, technique, parameters } = req.body;
            
            if (!image_url || !prompt || !technique || !parameters) {
                return res.status(400).json({ error: 'Missing required fields' });
            }
            
            try {
                // Check if image URL already exists
                const existingCheck = await pool.query(
                    'SELECT id FROM playground_gallery WHERE image_url = $1',
                    [image_url]
                );
                
                if (existingCheck.rows.length > 0) {
                    return res.json({ message: 'Image already exists in gallery', exists: true });
                }
                
                // Insert new image
                const result = await pool.query(
                    'INSERT INTO playground_gallery (image_url, prompt, technique, parameters) VALUES ($1, $2, $3, $4) RETURNING *',
                    [image_url, prompt, technique, JSON.stringify(parameters)]
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