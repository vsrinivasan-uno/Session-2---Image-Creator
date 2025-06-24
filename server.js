require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy to get real IP addresses (important for Vercel, Heroku, etc.)
app.set('trust proxy', true);

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL,
  ssl: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// Test database connection
pool.on('connect', () => {
  console.log('Connected to the database');
});

pool.on('error', (err) => {
  console.error('Database connection error:', err);
});

// Initialize database tables
async function initializeDatabase() {
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

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
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
  try {
    const { submission_id } = req.params;
    const { voter_id, voter_fingerprint } = req.body;
    // Enhanced IP address detection with multiple fallbacks
    const voter_ip = req.ip || 
                     req.connection?.remoteAddress || 
                     req.socket?.remoteAddress || 
                     req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                     req.headers['x-real-ip'] ||
                     req.headers['x-client-ip'] ||
                     req.headers['cf-connecting-ip'] ||
                     req.connection?.socket?.remoteAddress ||
                     'unknown';
    const timestamp = new Date().toISOString();
    
    // Enhanced logging for security monitoring
    console.log(`🗳️  VOTE ATTEMPT [${timestamp}]`);
    console.log(`   📍 IP: ${voter_ip}`);
    console.log(`   🆔 Voter ID: ${voter_id?.substring(0, 12)}...`);
    console.log(`   🔍 Fingerprint: ${voter_fingerprint?.substring(0, 20)}...`);
    console.log(`   🎯 Submission: ${submission_id}`);
    console.log(`   📊 User Agent: ${req.get('User-Agent')?.substring(0, 50)}...`);
    
    if (!voter_id) {
      console.log(`❌ Vote rejected: Missing voter ID from ${voter_ip}`);
      return res.status(400).json({ error: 'Voter ID is required' });
    }
    
    // Check if user already voted for this submission
    const existingVote = await pool.query(
      'SELECT * FROM votes WHERE submission_id = $1 AND voter_id = $2',
      [submission_id, voter_id]
    );
    
    if (existingVote.rows.length > 0) {
      console.log(`⚠️  Vote rejected: Duplicate voter ID for submission ${submission_id} from ${voter_ip}`);
      return res.status(400).json({ 
        error: 'You have already voted for this submission',
        already_voted: true 
      });
    }
    
    // Additional check: same fingerprint voting for same submission (backup protection)
    if (voter_fingerprint) {
      const fingerprintVote = await pool.query(
        'SELECT * FROM votes WHERE submission_id = $1 AND voter_fingerprint = $2',
        [submission_id, voter_fingerprint]
      );
      
      if (fingerprintVote.rows.length > 0) {
        console.log(`⚠️  Vote rejected: Duplicate fingerprint for submission ${submission_id} from ${voter_ip}`);
        return res.status(400).json({ 
          error: 'A vote from this device has already been recorded for this submission',
          already_voted: true 
        });
      }
    }
    
    // Add vote
    const voteResult = await pool.query(
      'INSERT INTO votes (submission_id, voter_id, voter_fingerprint, voter_ip) VALUES ($1, $2, $3, $4) RETURNING id',
      [submission_id, voter_id, voter_fingerprint, voter_ip]
    );
    
    console.log(`✅ Vote recorded: ID ${voteResult.rows[0].id} for submission ${submission_id} from ${voter_ip}`);
    
    // Update vote count
    console.log(`📊 Updating vote count for submission ${submission_id}`);
    const updateResult = await pool.query(
      'UPDATE submissions SET votes = COALESCE(votes, 0) + 1 WHERE id = $1',
      [submission_id]
    );
    console.log(`📈 Vote count update affected ${updateResult.rowCount} rows`);
    
    // Get updated vote count
    const submissionResult = await pool.query(
      'SELECT votes FROM submissions WHERE id = $1',
      [submission_id]
    );
    
    const updatedVotes = submissionResult.rows[0]?.votes || 0;
    console.log(`🎉 Vote successful: Submission ${submission_id} now has ${updatedVotes} votes (from ${voter_ip})`);
    
    res.json({ 
      success: true, 
      votes: updatedVotes 
    });
  } catch (error) {
    console.error(`💥 Error voting from ${req.ip}:`, error);
    if (error.constraint === 'votes_submission_id_voter_id_key') {
      res.status(400).json({ error: 'You have already voted for this submission', already_voted: true });
    } else {
      res.status(500).json({ error: 'Failed to vote' });
    }
  }
});

// Serve frontend files
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize database and start server
async function startServer() {
  try {
    await initializeDatabase();
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.log('⚠️  Database connection failed, running in offline mode');
    console.log('   Frontend will still work, but submissions will use local storage');
    console.log('   To enable database: Update NEON_DATABASE_URL in .env file');
  }
  
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Main App: http://localhost:${PORT}`);
    console.log(`⚙️  Admin Panel: http://localhost:${PORT}/admin.html`);
    console.log(`🔧 API Health: http://localhost:${PORT}/api/health`);
  });
}

startServer().catch(console.error); 