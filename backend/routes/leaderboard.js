const express = require('express');
const router = express.Router();

// Simple middleware to verify JWT via existing auth route's logic - reuse auth.js authenticateToken by requiring it would cause circular import
// So we implement a lightweight version here using the same env vars
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Access token required' });
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid or expired token' });
        req.user = user;
        next();
    });
};

// GET /api/leaderboard/citizens - top citizens by reward_points
router.get('/citizens', authenticateToken, async (req, res) => {
    try {
        // Only govt_authority or admin can view the leaderboard from authority page
        if (!['govt_authority', 'admin'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const [rows] = await req.db.execute(
            `SELECT 
                 u.id,
                 u.firstName,
                 u.lastName,
                 u.email,
                 u.phone_number,
                 u.reward_point
             FROM users u
             WHERE u.role = 'citizen' AND u.status = 'active'
             ORDER BY u.reward_point DESC, u.createdAt ASC
             LIMIT 100`
        );

        return res.json({
            message: 'Citizen leaderboard fetched successfully',
            leaderboard: rows
        });
    } catch (error) {
        console.error('Leaderboard fetch error:', error);
        return res.status(500).json({ message: 'Failed to fetch leaderboard' });
    }
});

module.exports = router;
