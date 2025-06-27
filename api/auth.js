const crypto = require('crypto');

module.exports = async (req, res) => {
    try {
        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        
        if (req.method === 'OPTIONS') {
            return res.status(200).end();
        }

        // Health check
        if (req.method === 'GET' && req.query.health === 'check') {
            return res.json({ status: 'healthy', service: 'authentication' });
        }

        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ error: 'Password required' });
        }

        // Get password from environment variables - NO FALLBACK
        const correctPassword = process.env.HEALTH_DASHBOARD_PASSWORD;
        
        if (!correctPassword) {
            console.error('❌ HEALTH_DASHBOARD_PASSWORD environment variable not set');
            return res.status(500).json({
                success: false,
                error: 'Authentication service not configured. Please set HEALTH_DASHBOARD_PASSWORD environment variable.'
            });
        }
        
        // Simple password comparison (you could enhance this with hashing)
        const isValid = password === correctPassword;

        if (isValid) {
            // Generate a session token (simple timestamp-based)
            const sessionToken = crypto.createHash('sha256')
                .update(`${correctPassword}-${Date.now()}-${Math.random()}`)
                .digest('hex');

            res.status(200).json({
                success: true,
                sessionToken: sessionToken,
                expiresIn: 4 * 60 * 60 * 1000, // 4 hours in milliseconds
                message: 'Authentication successful'
            });
        } else {
            // Add delay to prevent brute force attacks
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            res.status(401).json({
                success: false,
                message: 'Invalid password'
            });
        }

    } catch (error) {
        console.error('Auth error:', error);
        res.status(500).json({
            success: false,
            error: 'Authentication service error'
        });
    }
}; 