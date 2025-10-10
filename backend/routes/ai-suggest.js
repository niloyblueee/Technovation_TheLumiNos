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
    let prompt = `You triage public issues or emergencies. Citizens may write quickly with grammar or spelling mistakes. Respond with ONLY strict JSON in this exact shape (no prose):\n`;
    prompt += `{"valid": boolean, "reason": string, "summary": string, "photo_summary": string, "department": string|null, "extra_departments": string[]}\n`;
    prompt += `Guidelines:\n`;
    prompt += `- Summarize the text in <= 200 characters (summary).\n`;
    prompt += `- Summarize the photo based on any hints in the description or metadata. If description contradicts the photo, note it (photo_summary).\n`;
    prompt += `- Cross-check description vs photo_summary before deciding validity.\n`;
    prompt += `- If no photo was attached, set valid=false and reason="CANNOT_VALIDATE_NO_PHOTO".\n`;
    prompt += `- If the issue looks invalid or unrelated, explain why in reason (<= 200 chars).\n`;
    prompt += `- If valid, explain briefly why in reason (<= 200 chars) and pick the single best department from [${deptList}] in the department field (or null).\n`;
    prompt += `- Provide up to two additional department suggestions from the list in extra_departments (empty array if none).\n`;
    prompt += `- Accident cases may contain pic that are blurry or unclear—if the description indicates an accident/emergency, validate it if possible.\n`;
    prompt += `- People may upload photos of video games or movies or tv shows. If you detect these are invalid, flag them with a reason.\n`;
    prompt += `- If it is related to power outage, the pic may indicate powered off lights, not consider just darkened area, look for electrical components or area with power outage pic —consider the description to validate.\n`;
    prompt += `- People may prank by uploading irrelevant photos—flag those as invalid with a reason.\n`;
    prompt += `- People may upload photos of text documents or screenshots—these are invalid unless the description explains the issue clearly.\n`;
    prompt += `- People may upload photos of locations or landmarks without an issue—these are invalid unless the description explains the issue clearly.\n`;
    prompt += `- People may upload photos of people or animals without an issue—these are invalid unless the description explains the issue clearly.\n`;
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

      const summary = (description || '').trim().slice(0, 200) || 'No description provided.';
      const photoSummary = photo ? 'Photo provided (fallback rules cannot verify contents).' : 'No photo provided.';
      return res.json({
        valid: !!photo,
        reason: photo ? 'FALLBACK_RULES_USED' : 'CANNOT_VALIDATE_NO_PHOTO',
        department,
        extra_departments: [],
        summary,
        photo_summary: photoSummary,
        raw: null
      });
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
      let reason = rawReason ? rawReason.slice(0, 200) : '';
      const department = sanitizeDept(parsed.department);
      const extraDepartmentsRaw = Array.isArray(parsed.extra_departments) ? parsed.extra_departments : [];
      const extraDepartments = extraDepartmentsRaw
        .map(sanitizeDept)
        .filter(Boolean)
        .filter((d, idx, arr) => d && arr.indexOf(d) === idx && d !== department);
      const summary = typeof parsed.summary === 'string'
        ? parsed.summary.trim().slice(0, 200)
        : '';
      const photoSummary = typeof parsed.photo_summary === 'string'
        ? parsed.photo_summary.trim().slice(0, 200)
        : '';

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

      return res.json({
        valid,
        reason,
        department,
        extra_departments: extraDepartments,
        summary: summary || (description ? description.slice(0, 200) : ''),
        photo_summary: photoSummary || (hasPhoto ? 'Photo provided.' : 'No photo provided.'),
        raw: content
      });
    }

    // Heuristic fallback when JSON parse fails
    if (!hasPhoto) {
      return res.json({
        valid: false,
        reason: 'CANNOT_VALIDATE_NO_PHOTO',
        department: null,
        extra_departments: [],
        summary: (description || '').trim().slice(0, 200) || 'No description provided.',
        photo_summary: 'No photo provided.',
        raw: content
      });
    }
    const lowered = content.toLowerCase();
    let department = null;
    for (const d of depts) {
      if (lowered.includes(String(d).toLowerCase())) { department = d; break; }
    }
    const reason = content.trim().slice(0, 300) || 'AI suggestion available';
    return res.json({
      valid: true,
      reason,
      department,
      extra_departments: [],
      summary: (description || '').trim().slice(0, 200) || 'No description provided.',
      photo_summary: 'Photo provided (JSON parse fallback).',
      raw: content
    });
  } catch (err) {
    console.error('AI suggest error:', err?.response?.data || err.message);
    res.status(500).json({ message: 'AI suggestion failed' });
  }
});

module.exports = router;
