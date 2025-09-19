const express = require('express');
const router = express.Router();
const axios = require('axios');

// lightweight auth similar to issues route
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

// POST /api/ai/suggest
// Body: { description, photo, departments: [] }
router.post('/suggest', authenticateToken, async (req, res) => {
  try {
    const { description, photo, departments } = req.body || {};

    if (!description && !photo) {
      return res.status(400).json({ message: 'description or photo required' });
    }

    // Build prompt for OpenAI
    const deptList = Array.isArray(departments) ? departments.join(', ') : '';
    let prompt = `You are an assistant that reads a citizen-submitted issue and determines two things:\n`;
    prompt += `1) Whether the issue can be validated from the provided information. If there is no photo attached respond with: 'CANNOT_VALIDATE_NO_PHOTO'.\n`;
    prompt += `2) Suggest the most appropriate department from the following list: ${deptList}. Only return the single best match (one word).\n`;
    prompt += `\nIssue description:\n${description || '<no description>'}\n`;
    if (photo) {
      prompt += `\nNote: A photo was attached. You may assume it is relevant evidence.\n`;
    }

    // Use OpenAI if key provided, otherwise return a deterministic fallback
    const openaiKey = (process.env.OPENAI_API_KEY || process.env.DUMMY_OPENAI_KEY || '').trim();
    if (!openaiKey) {
      console.warn('[ai-suggest] OPENAI key missing -> using fallback rules');
      // Fallback: if photo exists, attempt simple keyword matching
      if (!photo) return res.json({ valid: false, reason: 'CANNOT_VALIDATE_NO_PHOTO', department: null, raw: null });
      const text = (description || '').toLowerCase();
      let department = null;
      if (/fire|smoke|flame/.test(text)) department = 'fire';
      else if (/health|sick|injury|hospital/.test(text)) department = 'health';
      else if (/water|leak|sewage/.test(text)) department = 'water';
      else if (/electric|power|wire|pole/.test(text)) department = 'electricity';
      else if (/crime|robbery|assault|shooting|accident|police/.test(text)) department = 'police';
      else department = departments && departments[0] ? departments[0] : null;

      return res.json({ valid: true, reason: 'FALLBACK_RULES_USED', department, raw: null });
    }

    // Call OpenAI Chat Completions (use gpt-4o-mini or gpt-4o if available). Keep payload simple.
    const apiUrl = 'https://api.openai.com/v1/chat/completions';
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const messages = [
      { role: 'system', content: 'You are a helpful municipal issue triage assistant.' },
      { role: 'user', content: prompt }
    ];

    console.log('[ai-suggest] Using OpenAI chat completions with model:', model);
    const resp = await axios.post(apiUrl, {
      model,
      messages,
      max_tokens: 200,
      temperature: 0.2,
    }, {
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const content = resp.data?.choices?.[0]?.message?.content || '';

    // Simple parser: look for our special token or try to extract a department word
    if (content.includes('CANNOT_VALIDATE_NO_PHOTO')) {
      return res.json({ valid: false, reason: 'CANNOT_VALIDATE_NO_PHOTO', department: null, raw: content });
    }

    // Find department from provided list
    const lowered = content.toLowerCase();
    let found = null;
    for (const d of (departments || [])) {
      if (lowered.includes(d.toLowerCase())) { found = d; break; }
    }

    return res.json({ valid: true, reason: 'OPENAI_OK', department: found, raw: content });
  } catch (err) {
    console.error('AI suggest error:', err?.response?.data || err.message);
    res.status(500).json({ message: 'AI suggestion failed' });
  }
});

module.exports = router;
