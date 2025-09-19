const express = require('express');
const router = express.Router();

// GET /api/issues - return issues with parsed coordinates
router.get('/', async (req, res) => {
  const db = req.db;
  try {
    const [rows] = await db.query('SELECT id, phone_number, coordinate, description, photo, emergency, status FROM issues');
    // coordinate is stored as "lat,lon" or "lat, lon" string. Parse into numbers.
    const parsed = rows.map(r => {
      let lat = null;
      let lon = null;
      if (r.coordinate) {
        const parts = String(r.coordinate).split(',').map(s => s.trim());
        if (parts.length >= 2) {
          const a = parseFloat(parts[0]);
          const b = parseFloat(parts[1]);
          if (!Number.isNaN(a) && !Number.isNaN(b)) {
            lat = a; lon = b;
          }
        }
      }
      return {
        id: r.id,
        phone_number: r.phone_number,
        description: r.description,
        photo: r.photo,
        emergency: !!r.emergency,
        status: r.status,
        latitude: lat,
        longitude: lon,
      };
    });
    res.json(parsed);
  } catch (err) {
    console.error('Error fetching issues:', err);
    res.status(500).json({ message: 'Failed to fetch issues' });
  }
});

module.exports = router;
