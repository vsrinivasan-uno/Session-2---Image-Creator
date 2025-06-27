require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for IP detection in production
app.set('trust proxy', true);

// Database connection
let pool;
try {
    pool = new Pool({
        connectionString: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    
    // Test connection
    pool.query('SELECT NOW()', (err, result) => {
        if (err) {
            console.error('Database connection error:', err);
        }
    });
} catch (error) {
    console.error('Database setup error:', error);
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// Initialize database tables
async function initializeDatabase() {
    if (!pool) return false;
    
    try {
        // Create classes table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS classes (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                instructor_name VARCHAR(255),
                class_code VARCHAR(50) UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create assignments table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS assignments (
                id SERIAL PRIMARY KEY,
                class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
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

        // Create submissions table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS submissions (
                id SERIAL PRIMARY KEY,
                assignment_id INTEGER REFERENCES assignments(id) ON DELETE CASCADE,
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
                submission_id INTEGER REFERENCES submissions(id) ON DELETE CASCADE,
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

// Helper function to get real IP address
function getRealIP(req) {
    // Enhanced IP detection for production environments
    const forwarded = req.headers['x-forwarded-for'];
    const realIP = req.headers['x-real-ip'];
    const cfIP = req.headers['cf-connecting-ip']; // Cloudflare
    const remoteIP = req.connection?.remoteAddress || req.socket?.remoteAddress;
    
    let detectedIP = req.ip || remoteIP || 'unknown';
    
    // Prefer real IP sources in production
    if (cfIP) detectedIP = cfIP;
    else if (realIP) detectedIP = realIP;
    else if (forwarded) detectedIP = forwarded.split(',')[0].trim();
    
    // Clean IPv6 mapped IPv4 addresses
    if (detectedIP.startsWith('::ffff:')) {
        detectedIP = detectedIP.substring(7);
    }
    
    // For local development, simulate production IP
    if (detectedIP === '127.0.0.1' || detectedIP === '::1' || detectedIP.startsWith('192.168.') || detectedIP.startsWith('10.')) {
        const simulatedIPs = ['203.0.113.1', '198.51.100.1', '192.0.2.1', '203.0.113.50'];
        const simulatedIP = simulatedIPs[Math.floor(Math.random() * simulatedIPs.length)];
        return simulatedIP;
    }
    
    return detectedIP;
}

// API Routes

// Health check - Use the comprehensive health check from api/health.js
app.get('/api/health', async (req, res) => {
    try {
        // Import and use the comprehensive health check
        const healthCheck = require('./api/health.js');
        await healthCheck(req, res);
    } catch (error) {
        console.error('Health check error:', error);
        res.status(500).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

// Authentication endpoint for health dashboard
app.post('/api/auth', async (req, res) => {
    try {
        const authHandler = require('./api/auth.js');
        await authHandler(req, res);
    } catch (error) {
        console.error('Auth error:', error);
        res.status(500).json({
            success: false,
            error: 'Authentication service error'
        });
    }
});


// Debug endpoint to check IP detection
app.get('/api/debug/ip', (req, res) => {
    const ipInfo = {
        'req.ip': req.ip,
        'req.connection.remoteAddress': req.connection?.remoteAddress,
        'req.socket.remoteAddress': req.socket?.remoteAddress,
        'x-forwarded-for': req.headers['x-forwarded-for'],
        'x-real-ip': req.headers['x-real-ip'],
        'x-client-ip': req.headers['x-client-ip'],
        'cf-connecting-ip': req.headers['cf-connecting-ip'],
        'connection.socket.remoteAddress': req.connection?.socket?.remoteAddress,
        'user-agent': req.headers['user-agent'],
        'all-headers': req.headers
    };
    
    console.log('🔍 IP Debug Request:', ipInfo);
    res.json(ipInfo);
});

// Test endpoint with simulated real IP (for development testing)
app.get('/api/debug/simulate-real-ip', (req, res) => {
    // Simulate what production would look like
    const simulatedRequest = {
        ip: '203.45.123.89',
        headers: {
            'x-forwarded-for': '203.45.123.89, 172.31.1.100',
            'x-real-ip': '203.45.123.89',
            'user-agent': req.headers['user-agent']
        }
    };
    
    const simulatedIP = simulatedRequest.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
                       simulatedRequest.headers['x-real-ip'] || 
                       simulatedRequest.ip ||
                       'unknown';
    
    console.log(`🌐 Simulated Production IP: ${simulatedIP}`);
    res.json({
        message: 'This simulates what IP detection looks like in production',
        detectedIP: simulatedIP,
        simulation: simulatedRequest
    });
});

// Create a new class
app.post('/api/classes', async (req, res) => {
    try {
        const { name, description, instructor_name } = req.body;
        const class_code = uuidv4().substring(0, 8).toUpperCase();
        
        const result = await pool.query(
            'INSERT INTO classes (name, description, instructor_name, class_code) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, description, instructor_name, class_code]
        );
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error creating class:', error);
        res.status(500).json({ error: 'Failed to create class' });
    }
});

// Get class by code
app.get('/api/classes/:code', async (req, res) => {
    try {
        const { code } = req.params;
        const result = await pool.query('SELECT * FROM classes WHERE class_code = $1', [code]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Class not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching class:', error);
        res.status(500).json({ error: 'Failed to fetch class' });
    }
});

// Create assignment
app.post('/api/assignments', async (req, res) => {
    try {
        const { class_id, title, description, requirements, technique, due_date } = req.body;
        
        const result = await pool.query(
            'INSERT INTO assignments (class_id, title, description, requirements, technique, due_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [class_id, title, description, requirements, technique, due_date]
        );
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error creating assignment:', error);
        res.status(500).json({ error: 'Failed to create assignment' });
    }
});

// Get assignments for a class
app.get('/api/classes/:class_id/assignments', async (req, res) => {
    try {
        const { class_id } = req.params;
        const result = await pool.query(
            'SELECT * FROM assignments WHERE class_id = $1 AND is_active = true ORDER BY created_at DESC',
            [class_id]
        );
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching assignments:', error);
        res.status(500).json({ error: 'Failed to fetch assignments' });
    }
});

// Get default assignment (first available assignment)
app.get('/api/assignments/default', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM assignments WHERE is_active = true ORDER BY created_at ASC LIMIT 1'
        );
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching default assignment:', error);
        res.status(500).json({ error: 'Failed to fetch default assignment' });
    }
});

// Get all submissions
app.get('/api/submissions', async (req, res) => {
    try {
        await initializeDatabase();
        
        const result = await pool.query(`
            SELECT s.*, a.title as assignment_title, c.name as class_name 
            FROM submissions s 
            LEFT JOIN assignments a ON s.assignment_id = a.id 
            LEFT JOIN classes c ON a.class_id = c.id 
            ORDER BY s.submitted_at DESC
        `);
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching submissions:', error);
        res.status(500).json({ error: 'Failed to fetch submissions' });
    }
});

// Submit assignment
app.post('/api/submissions', async (req, res) => {
    try {
        const { assignment_id, student_name, student_email, prompt_data, image_url } = req.body;
        const submission_code = uuidv4().substring(0, 12).toUpperCase();
        
        const result = await pool.query(
            'INSERT INTO submissions (assignment_id, student_name, student_email, prompt_data, image_url, submission_code) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [assignment_id, student_name, student_email, JSON.stringify(prompt_data), image_url, submission_code]
        );
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error submitting assignment:', error);
        res.status(500).json({ error: 'Failed to submit assignment' });
    }
});

// Get submissions for an assignment
app.get('/api/assignments/:assignment_id/submissions', async (req, res) => {
    try {
        const { assignment_id } = req.params;
        const result = await pool.query(
            'SELECT * FROM submissions WHERE assignment_id = $1 ORDER BY submitted_at DESC',
            [assignment_id]
        );
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching submissions:', error);
        res.status(500).json({ error: 'Failed to fetch submissions' });
    }
});

// Check if voter has already voted for submissions
app.post('/api/votes/check', async (req, res) => {
    try {
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
});

// Vote for submission with anonymous voter tracking
app.post('/api/submissions/:submission_id/vote', async (req, res) => {
    const submission_id = req.params.submission_id;
    const { voter_id, voter_fingerprint } = req.body;
    const voter_ip = getRealIP(req);
    const timestamp = new Date().toISOString();

    // Enhanced logging for production monitoring
    const ipInfo = {
        detected: voter_ip,
        forwarded: req.headers['x-forwarded-for'],
        real: req.headers['x-real-ip'],
        cf: req.headers['cf-connecting-ip'],
        connection: req.connection?.remoteAddress,
        socket: req.socket?.remoteAddress
    };

    try {
        if (!voter_id) {
            res.status(400).json({ error: 'Voter ID is required' });
            return;
        }

        // Check for duplicate vote by voter ID
        const existingVoteById = await pool.query(
            'SELECT id FROM votes WHERE submission_id = $1 AND voter_id = $2',
            [submission_id, voter_id]
        );

        if (existingVoteById.rows.length > 0) {
            res.status(409).json({ error: 'You have already voted for this submission' });
            return;
        }

        // Check for duplicate vote by fingerprint
        if (voter_fingerprint) {
            const existingVoteByFingerprint = await pool.query(
                'SELECT id FROM votes WHERE submission_id = $1 AND voter_fingerprint = $2',
                [submission_id, voter_fingerprint]
            );

            if (existingVoteByFingerprint.rows.length > 0) {
                res.status(409).json({ error: 'Duplicate vote detected from this device' });
                return;
            }
        }

        // Record the vote
        const voteResult = await pool.query(
            'INSERT INTO votes (submission_id, voter_id, voter_fingerprint, voter_ip) VALUES ($1, $2, $3, $4) RETURNING *',
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
            votes: updatedVotes,
            vote_id: voteResult.rows[0].id
        });

    } catch (error) {
        console.error('Error voting:', error);
        res.status(500).json({ error: 'Failed to record vote' });
    }
});

// Remove vote (unlike) from submission
app.delete('/api/submissions/:submission_id/unlike', async (req, res) => {
    const submission_id = req.params.submission_id;
    const { voter_id, voter_fingerprint } = req.body;
    const voter_ip = getRealIP(req);

    try {
        if (!voter_id) {
            res.status(400).json({ error: 'Voter ID is required' });
            return;
        }

        // Check if vote exists
        const existingVote = await pool.query(
            'SELECT id FROM votes WHERE submission_id = $1 AND voter_id = $2',
            [submission_id, voter_id]
        );

        if (existingVote.rows.length === 0) {
            res.status(404).json({ error: 'No vote found to remove' });
            return;
        }

        // Remove the vote
        await pool.query(
            'DELETE FROM votes WHERE submission_id = $1 AND voter_id = $2',
            [submission_id, voter_id]
        );

        // Update submission vote count
        const updateResult = await pool.query(
            'UPDATE submissions SET votes = GREATEST(COALESCE(votes, 0) - 1, 0) WHERE id = $1 RETURNING votes',
            [submission_id]
        );

        const updatedVotes = updateResult.rows[0]?.votes || 0;

        res.json({
            success: true,
            votes: updatedVotes
        });

    } catch (error) {
        console.error('Error removing vote:', error);
        res.status(500).json({ error: 'Failed to remove vote' });
    }
});

// Playground Gallery API endpoints
app.get('/api/playground-gallery', async (req, res) => {
    try {
        await initializeDatabase();
        
        // Create playground_gallery table if it doesn't exist with user tracking
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
        
        // Add user tracking columns if they don't exist (migration)
        try {
            await pool.query(`ALTER TABLE playground_gallery ADD COLUMN IF NOT EXISTS user_ip INET`);
            await pool.query(`ALTER TABLE playground_gallery ADD COLUMN IF NOT EXISTS user_agent TEXT`);
            await pool.query(`ALTER TABLE playground_gallery ADD COLUMN IF NOT EXISTS user_fingerprint TEXT`);
            await pool.query(`ALTER TABLE playground_gallery ADD COLUMN IF NOT EXISTS browser_info JSONB`);
            await pool.query(`ALTER TABLE playground_gallery ADD COLUMN IF NOT EXISTS session_id TEXT`);
        } catch (migrationError) {
            console.log('Migration already completed or columns exist');
        }
        
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
        
    } catch (error) {
        console.error('Error fetching playground gallery:', error);
        res.status(500).json({ error: 'Failed to fetch gallery' });
    }
});

app.post('/api/playground-gallery', async (req, res) => {
    try {
        await initializeDatabase();
        
        // Create playground_gallery table if it doesn't exist with user tracking
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
        
        // Add user tracking columns if they don't exist (migration)
        try {
            await pool.query(`ALTER TABLE playground_gallery ADD COLUMN IF NOT EXISTS user_ip INET`);
            await pool.query(`ALTER TABLE playground_gallery ADD COLUMN IF NOT EXISTS user_agent TEXT`);
            await pool.query(`ALTER TABLE playground_gallery ADD COLUMN IF NOT EXISTS user_fingerprint TEXT`);
            await pool.query(`ALTER TABLE playground_gallery ADD COLUMN IF NOT EXISTS browser_info JSONB`);
            await pool.query(`ALTER TABLE playground_gallery ADD COLUMN IF NOT EXISTS session_id TEXT`);
        } catch (migrationError) {
            console.log('Migration already completed or columns exist');
        }
        
        const { image_url, prompt, technique, parameters, user_tracking } = req.body;
        
        if (!image_url || !prompt || !technique || !parameters) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        // Extract user tracking information
        const user_ip = getRealIP(req);
        const user_agent = req.get('User-Agent');
        const user_fingerprint = user_tracking?.fingerprint;
        const browser_info = user_tracking?.browser_info;
        const session_id = user_tracking?.session_id;
        
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
                 (image_url, prompt, technique, parameters, user_ip, user_agent, user_fingerprint, browser_info, session_id) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
                [
                    image_url, 
                    prompt, 
                    technique, 
                    JSON.stringify(parameters),
                    user_ip,
                    user_agent,
                    user_fingerprint,
                    JSON.stringify(browser_info),
                    session_id
                ]
            );
            
            res.json({ message: 'Image added to gallery', data: result.rows[0] });
        } catch (error) {
            if (error.code === '23505') { // Unique constraint violation
                return res.json({ message: 'Image already exists in gallery', exists: true });
            }
            throw error;
        }
        
    } catch (error) {
        console.error('Error saving to playground gallery:', error);
        res.status(500).json({ error: 'Failed to save to gallery' });
    }
});

// Admin endpoint to view user analytics (for development/admin purposes only)
app.get('/api/admin/user-analytics', async (req, res) => {
    try {
        await initializeDatabase();
        
        // Get user analytics from playground gallery
        const analyticsQuery = `
            SELECT 
                user_ip,
                user_fingerprint,
                session_id,
                browser_info,
                COUNT(*) as images_created,
                MIN(created_at) as first_visit,
                MAX(created_at) as last_visit,
                ARRAY_AGG(DISTINCT technique) as techniques_used
            FROM playground_gallery 
            WHERE user_ip IS NOT NULL 
            GROUP BY user_ip, user_fingerprint, session_id, browser_info
            ORDER BY images_created DESC, last_visit DESC
        `;
        
        const analyticsResult = await pool.query(analyticsQuery);
        
        // Get summary statistics
        const summaryQuery = `
            SELECT 
                COUNT(DISTINCT user_ip) as unique_ips,
                COUNT(DISTINCT user_fingerprint) as unique_fingerprints,
                COUNT(DISTINCT session_id) as unique_sessions,
                COUNT(*) as total_images
            FROM playground_gallery 
            WHERE user_ip IS NOT NULL
        `;
        
        const summaryResult = await pool.query(summaryQuery);
        
        // Calculate average session duration separately to avoid nested aggregates
        let avgSessionDuration = 0;
        try {
            const durationQuery = `
                SELECT AVG(session_duration_minutes) as avg_session_duration_minutes
                FROM (
                    SELECT 
                        session_id,
                        EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at)))/60 as session_duration_minutes
                    FROM playground_gallery 
                    WHERE user_ip IS NOT NULL AND session_id IS NOT NULL
                    GROUP BY session_id
                    HAVING COUNT(*) > 1
                ) session_durations
            `;
            const durationResult = await pool.query(durationQuery);
            avgSessionDuration = durationResult.rows[0]?.avg_session_duration_minutes || 0;
        } catch (durationError) {
            console.log('Could not calculate session duration:', durationError.message);
        }
        
        res.json({
            summary: {
                ...summaryResult.rows[0],
                avg_session_duration_minutes: avgSessionDuration
            },
            user_analytics: analyticsResult.rows.map(row => ({
                ...row,
                browser_info: typeof row.browser_info === 'string' ? JSON.parse(row.browser_info) : row.browser_info
            }))
        });
        
    } catch (error) {
        console.error('Error fetching user analytics:', error);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});

// Serve frontend files
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize database and start server
async function startServer() {
        const dbInitialized = await initializeDatabase();
    
    if (dbInitialized) {
        // Database ready
    } else {
        // Offline mode - frontend will handle gracefully
    }

    app.listen(PORT, () => {
        // Server started
    });
}

startServer().catch(console.error); 