require('dotenv').config();
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL,
  ssl: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL ? { rejectUnauthorized: false } : false
});

async function initializeDatabase() {
  console.log('🚀 Initializing AI Prompt Master Database...');
  
  try {
    // Test connection
    console.log('📡 Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful!');

    // Create tables
    console.log('📊 Creating database tables...');

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
    console.log('✅ Classes table created');

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
    console.log('✅ Assignments table created');

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
    console.log('✅ Submissions table created');

    // Create votes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS votes (
        id SERIAL PRIMARY KEY,
        submission_id INTEGER REFERENCES submissions(id) ON DELETE CASCADE,
        voter_name VARCHAR(255) NOT NULL,
        voter_email VARCHAR(255),
        voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(submission_id, voter_email)
      )
    `);
    console.log('✅ Votes table created');

    // Create sample data for testing
    console.log('🧪 Creating sample test data...');

    // Create test class
    const classResult = await pool.query(`
      INSERT INTO classes (name, description, instructor_name, class_code) 
      VALUES ($1, $2, $3, $4) 
      ON CONFLICT (class_code) DO NOTHING
      RETURNING *
    `, [
      'AI Prompt Engineering 101',
      'Learn advanced AI prompting techniques through hands-on image generation exercises',
      'Dr. AI Instructor',
      'TEST2024'
    ]);

    if (classResult.rows.length > 0) {
      console.log(`✅ Test class created with code: ${classResult.rows[0].class_code}`);
      
      // Create test assignment
      const assignmentResult = await pool.query(`
        INSERT INTO assignments (class_id, title, description, requirements, technique)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [
        classResult.rows[0].id,
        'Professional Portrait Challenge',
        'Create a professional portrait using AI image generation',
        'Use zero-shot prompting to create a high-quality professional portrait. Focus on lighting, composition, and technical quality.',
        'zero-shot'
      ]);

      console.log(`✅ Test assignment created with ID: ${assignmentResult.rows[0].id}`);
    } else {
      console.log('ℹ️  Test class already exists, skipping creation');
    }

    // Display table stats
    console.log('\n📈 Database Statistics:');
    
    const classCount = await pool.query('SELECT COUNT(*) FROM classes');
    console.log(`   Classes: ${classCount.rows[0].count}`);
    
    const assignmentCount = await pool.query('SELECT COUNT(*) FROM assignments');
    console.log(`   Assignments: ${assignmentCount.rows[0].count}`);
    
    const submissionCount = await pool.query('SELECT COUNT(*) FROM submissions');
    console.log(`   Submissions: ${submissionCount.rows[0].count}`);
    
    const voteCount = await pool.query('SELECT COUNT(*) FROM votes');
    console.log(`   Votes: ${voteCount.rows[0].count}`);

    console.log('\n🎉 Database initialization completed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Start the server: npm run dev');
    console.log('   2. Test admin panel: http://localhost:3000/admin.html');
    console.log('   3. Test main app: http://localhost:3000');
    console.log('   4. Use test class code: TEST2024');

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run initialization
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase }; 