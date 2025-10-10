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

    // Build prompt for OpenAI: ask for strict JSON to simplify parsing on server
    const deptList = Array.isArray(departments) ? departments.join(', ') : '';
    let prompt = `You are an assistant that reads a citizen-submitted issue and must respond with ONLY valid JSON in this exact shape (no prose):\n`;
    prompt += `{"valid": boolean, "reason": string, "department": string|null}\n`;
    prompt += `Rules:\n`;
    prompt += `- Departments allowed: [${deptList}]. If no good match, use null.\n`;
    prompt += `- If no photo was attached, set valid=false and reason="CANNOT_VALIDATE_NO_PHOTO".\n`;
    prompt += `- If a photo is attached, reason MUST be a short one-line justification for the choice (<= 200 chars).\n`;
    prompt += `- People may prank by uploading their photo or mismatch content between description and photo, beware of that\n`;
    prompt += `- The department MUST be a single word exactly from the allowed list when applicable.\n`;
    prompt += `Issue:\nDescription: ${description || '<no description>'}\n`;
    prompt += `Photo: ${photo ? 'present' : 'absent'}\n`;

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
    // Default to GPT-5 mini unless overridden via env; fallback to gpt-4o-mini on 404
    let model = process.env.OPENAI_MODEL || 'gpt-5-mini';
    const messages = [
      { role: 'system', content: 'You are a helpful municipal issue triage assistant.' },
      { role: 'user', content: prompt }
    ];

    console.log('[ai-suggest] Using OpenAI chat completions with model:', model);
    let resp;
    try {
      resp = await axios.post(apiUrl, {
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
    } catch (e) {
      const body = e?.response?.data;
      const isModelMissing = body && (body.error?.message?.includes('model') || body.error?.code === 'model_not_found');
      if (isModelMissing && model !== 'gpt-4o-mini') {
        // Retry once with a safe fallback model
        model = 'gpt-4o-mini';
        console.warn('[ai-suggest] model fallback to gpt-4o-mini');
        resp = await axios.post(apiUrl, {
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
      } else {
        throw e;
      }
    }

    const content = resp.data?.choices?.[0]?.message?.content || '';

    // Parse JSON if possible
    let parsed = null;
    try {
      const idx = content.indexOf('{');
      const jsonText = idx >= 0 ? content.slice(idx) : content;
      parsed = JSON.parse(jsonText);
    } catch (_) { /* fall through to heuristic fallback */ }

    const hasPhoto = !!(photo && String(photo).trim().length > 0);
    const depts = Array.isArray(departments) ? departments : [];

    // Helper to sanitize department to allowed list
    const sanitizeDept = (val) => {
      if (!val || !depts.length) return null;
      const match = depts.find(d => String(d).toLowerCase() === String(val).toLowerCase());
      return match || null;
    };

    if (parsed && typeof parsed === 'object') {
      const valid = !!parsed.valid && hasPhoto; // enforce photo presence for validation
      const rawReason = typeof parsed.reason === 'string' ? parsed.reason.trim() : '';
      let reason = rawReason ? rawReason.slice(0, 300) : '';
      const department = sanitizeDept(parsed.department);

      if (!valid) {
        if (!reason) {
          reason = 'AI could not validate the issue.';
        } else if (hasPhoto && /CANNOT_VALIDATE_NO_PHOTO/i.test(reason)) {
          console.warn('[ai-suggest] Model referenced missing photo despite one being provided.');
          reason = 'AI could not validate; it did not recognize a usable photo for verification.';
        }
      } else {
        reason = reason || 'Validated by AI';
        if (hasPhoto && /CANNOT_VALIDATE_NO_PHOTO/i.test(rawReason)) {
          console.warn('[ai-suggest] Model validated issue but mentioned missing photo.');
          reason = 'AI validated the issue despite noting a photo mismatch; please double-check.';
        }
      }

      return res.json({ valid, reason, department, raw: content });
    }

    // Heuristic fallback when JSON parse fails
    if (!hasPhoto) {
      return res.json({ valid: false, reason: 'CANNOT_VALIDATE_NO_PHOTO', department: null, raw: content });
    }
    const lowered = content.toLowerCase();
    let department = null;
    for (const d of depts) {
      if (lowered.includes(String(d).toLowerCase())) { department = d; break; }
    }
    const reason = content.trim().slice(0, 300) || 'AI suggestion available';
    return res.json({ valid: true, reason, department, raw: content });
  } catch (err) {
    console.error('AI suggest error:', err?.response?.data || err.message);
    res.status(500).json({ message: 'AI suggestion failed' });
  }
});

module.exports = router;
