const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Lightweight token auth (avoid circular import)
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

// GET /api/events - list events newest first
router.get('/', async (req, res) => {
    try {
        const [rows] = await req.db.execute(
            `SELECT id, event_name, date, time, duration_minutes, description, createdAt
       FROM events
       ORDER BY createdAt DESC`
        );

        const now = new Date();
        const withStatus = rows.map(e => {
            const start = new Date(`${e.date}T${e.time}`);
            const end = new Date(start.getTime() + (e.duration_minutes || 0) * 60000);
            let status = 'upcoming';
            if (now >= start && now <= end) status = 'ongoing';
            else if (now > end) status = 'past';
            return { ...e, status };
        });

        res.json({ events: withStatus });
    } catch (err) {
        console.error('List events error:', err);
        res.status(500).json({ message: 'Failed to fetch events' });
    }
});

// POST /api/events - create event (govt_authority or admin)
router.post('/', authenticateToken, async (req, res) => {
    try {
        if (!['govt_authority', 'admin'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { event_name, date, time, duration_minutes, description } = req.body;
        if (!event_name || !date || !time) {
            return res.status(400).json({ message: 'event_name, date and time are required' });
        }
        const duration = Number(duration_minutes);
        if (!Number.isFinite(duration) || duration <= 0) {
            return res.status(400).json({ message: 'duration_minutes must be a positive number' });
        }

        const [result] = await req.db.execute(
            `INSERT INTO events (event_name, date, time, duration_minutes, description)
       VALUES (?, ?, ?, ?, ?)`,
            [event_name, date, time, duration, description || null]
        );

        const [[created]] = await req.db.execute(
            `SELECT id, event_name, date, time, duration_minutes, description, createdAt
       FROM events WHERE id = ?`,
            [result.insertId]
        );

        // compute status for response
        const start = new Date(`${created.date}T${created.time}`);
        const end = new Date(start.getTime() + (created.duration_minutes || 0) * 60000);
        const now = new Date();
        let status = 'upcoming';
        if (now >= start && now <= end) status = 'ongoing';
        else if (now > end) status = 'past';

        res.status(201).json({ message: 'Event created', event: { ...created, status } });
    } catch (err) {
        console.error('Create event error:', err);
        res.status(500).json({ message: 'Failed to create event' });
    }
});

module.exports = router;
