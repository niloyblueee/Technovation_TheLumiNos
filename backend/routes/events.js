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
      `SELECT id, event_name, date, time, description, status, createdAt
       FROM events
       ORDER BY createdAt DESC`
    );
    res.json({ events: rows });
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

    const { event_name, date, time, description, status } = req.body;
    if (!event_name || !date || !time) {
      return res.status(400).json({ message: 'event_name, date and time are required' });
    }
    const normalizedStatus = ['upcoming', 'ongoing', 'past'].includes(status) ? status : 'upcoming';

    const [result] = await req.db.execute(
      `INSERT INTO events (event_name, date, time, description, status)
       VALUES (?, ?, ?, ?, ?)`,
      [event_name, date, time, description || null, normalizedStatus]
    );

    const [[created]] = await req.db.execute(
      `SELECT id, event_name, date, time, description, status, createdAt
       FROM events WHERE id = ?`,
      [result.insertId]
    );

    res.status(201).json({ message: 'Event created', event: created });
  } catch (err) {
    console.error('Create event error:', err);
    res.status(500).json({ message: 'Failed to create event' });
  }
});

module.exports = router;
