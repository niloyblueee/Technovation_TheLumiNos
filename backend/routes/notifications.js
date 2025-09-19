const express = require('express');
const router = express.Router();

// GET /api/notifications
// Returns recent events as notifications. This is a simple read-only
// endpoint intended for clients to show event reminders.
router.get('/', async (req, res) => {
  try {
    const [rows] = await req.db.execute(
      `SELECT id, event_name, date, time,duration_minutes, description, createdAt
       FROM events
       ORDER BY createdAt DESC
       LIMIT 50`
    );

    const now = new Date();
    const notifications = rows.map(r => {
      // combine date and time into an ISO string when possible
      let startsAt = null;
      try {
        if (r.date) {
          const t = r.time || '00:00:00';
          // Normalize time to include seconds if needed
          const timePart = t.split(':').length === 2 ? `${t}:00` : t;
          // Create a JS Date from YYYY-MM-DD and HH:MM:SS
          const iso = `${r.date}T${timePart}`;
          const d = new Date(iso);
          if (!isNaN(d)) startsAt = d.toISOString();
        }
      } catch (e) {
        startsAt = null;
      }

      // time until start in seconds (null if unknown)
      let timeUntil = null;
      if (startsAt) {
        const delta = (new Date(startsAt).getTime() - now.getTime()) / 1000;
        timeUntil = Math.floor(delta);
      }

      return {
        id: `event-${r.id}`,
        title: r.event_name,
        message: r.description || `Event ${r.event_name}`,
        path: `/events/${r.id}`,
        createdAt: (r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString()),
        startsAt,
        timeUntilSeconds: timeUntil,
        raw: r,
      };
    });

    res.json(notifications);
  } catch (err) {
    console.error('Notifications error:', err);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

module.exports = router;
