const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// lightweight auth
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

// Departments list (static for now; can be DB driven later)
router.get('/meta/departments', (req, res) => {
  res.json({ departments: ['police', 'health', 'fire', 'water', 'electricity'] });
});

// Get single issue
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await req.db.query('SELECT id, phone_number, coordinate, description, photo, emergency, status, assigned_department FROM issues WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Issue not found' });
    const r = rows[0];
    let lat = null, lon = null;
    if (r.coordinate) {
      const parts = String(r.coordinate).split(',').map(s => s.trim());
      if (parts.length >= 2) {
        const a = parseFloat(parts[0]);
        const b = parseFloat(parts[1]);
        if (!Number.isNaN(a) && !Number.isNaN(b)) { lat = a; lon = b; }
      }
    }
    res.json({
      id: r.id,
      phone_number: r.phone_number,
      description: r.description,
      photo: r.photo,
      emergency: !!r.emergency,
      status: r.status,
      assigned_department: r.assigned_department || null,
      latitude: lat,
      longitude: lon,
    });
  } catch (err) {
    console.error('Error fetching issue:', err);
    res.status(500).json({ message: 'Failed to fetch issue' });
  }
});

// Verify issue (approve/deny) and optionally assign department
router.post('/:id/verify', authenticateToken, async (req, res) => {
  try {
    if (!['govt_authority', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const { action, department } = req.body; // action: 'approve' or 'deny'
    if (!['approve', 'deny'].includes(action)) {
      return res.status(400).json({ message: 'action must be approve or deny' });
    }

    let newStatus = action === 'approve' ? 'in_progress' : 'rejected';
    const params = [newStatus, department || null, req.params.id];
    await req.db.execute('UPDATE issues SET status = ?, assigned_department = ? WHERE id = ?', params);

    const [[updated]] = await req.db.execute('SELECT id, status, assigned_department FROM issues WHERE id = ?', [req.params.id]);
    res.json({ message: 'Issue updated', issue: updated });
  } catch (err) {
    console.error('Verify issue error:', err);
    res.status(500).json({ message: 'Failed to verify issue' });
  }
});

module.exports = router;
