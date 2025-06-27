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
        // Create assignments table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS assignments (
                id SERIAL PRIMARY KEY,
                class_id INTEGER,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                requirements TEXT,
                technique VARCHAR(50) NOT NULL,
                due_date TIMESTAMP,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
        return res.json({ status: 'healthy', service: 'assignments' });
    }

    // Get all assignments
    if (req.method === 'GET') {
        try {
            await ensureDatabase();
            
            const result = await pool.query(`
                SELECT * FROM assignments 
                ORDER BY created_at DESC
            `);
            
            return res.json(result.rows);
        } catch (error) {
            console.error('Error fetching assignments:', error);
            return res.status(500).json({ error: 'Failed to fetch assignments' });
        }
    }

    // Create assignment
    if (req.method === 'POST') {
        try {
            await ensureDatabase();
            
            const { class_id, title, description, requirements, technique, due_date } = req.body;
            
            const result = await pool.query(
                'INSERT INTO assignments (class_id, title, description, requirements, technique, due_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
                [class_id, title, description, requirements, technique, due_date]
            );
            
            return res.json(result.rows[0]);
        } catch (error) {
            console.error('Error creating assignment:', error);
            return res.status(500).json({ error: 'Failed to create assignment' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
} 