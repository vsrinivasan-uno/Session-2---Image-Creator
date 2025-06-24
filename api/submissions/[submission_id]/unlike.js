const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'DELETE') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { submission_id } = req.query;
    const { voter_id, voter_fingerprint } = req.body;

    if (!submission_id || !voter_id) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Check if vote exists
        const voteCheck = await client.query(
            'SELECT id FROM votes WHERE submission_id = $1 AND voter_id = $2',
            [submission_id, voter_id]
        );

        if (voteCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Vote not found' });
        }

        // Remove the vote
        await client.query(
            'DELETE FROM votes WHERE submission_id = $1 AND voter_id = $2',
            [submission_id, voter_id]
        );

        // Update submission vote count (decrement)
        const submissionResult = await client.query(
            'UPDATE submissions SET votes = GREATEST(COALESCE(votes, 0) - 1, 0) WHERE id = $1 RETURNING votes',
            [submission_id]
        );

        await client.query('COMMIT');

        const updatedVotes = submissionResult.rows[0]?.votes || 0;

        console.log(`Vote removed: submission_id=${submission_id}, voter_id=${voter_id}, new_votes=${updatedVotes}`);

        res.json({
            success: true,
            votes: updatedVotes,
            message: 'Vote removed successfully'
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Unlike error:', error);
        
        if (error.code === '23503') {
            return res.status(404).json({ error: 'Submission not found' });
        }
        
        res.status(500).json({ 
            error: 'Database error', 
            details: process.env.NODE_ENV === 'development' ? error.message : undefined 
        });
    } finally {
        client.release();
    }
} 