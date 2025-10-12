const express = require("express");
const axios = require("axios");

const router = express.Router();

const DEPARTMENTS = ["police", "health", "fire", "water", "electricity"];
const MATCH_RADIUS_METERS = 100;
const MATCH_WINDOW_MINUTES = 30;

const parseCoordinate = (coordinate) => {
    if (!coordinate) return null;
    const parts = String(coordinate).split(",").map((s) => s.trim());
    if (parts.length < 2) return null;
    const lat = parseFloat(parts[0]);
    const lon = parseFloat(parts[1]);
    if (Number.isNaN(lat) || Number.isNaN(lon)) return null;
    return { latitude: lat, longitude: lon };
};

const toRadians = (value) => (value * Math.PI) / 180;

const haversineDistanceMeters = (a, b) => {
    if (!a || !b) return Number.POSITIVE_INFINITY;
    const R = 6371000; // Earth radius in meters
    const dLat = toRadians(b.latitude - a.latitude);
    const dLon = toRadians(b.longitude - a.longitude);
    const lat1 = toRadians(a.latitude);
    const lat2 = toRadians(b.latitude);

    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
    return R * c;
};

const normalizeReason = (reason) => (reason ? reason.trim().toLowerCase() : "");

const tokenizeForMatch = (value) => {
    if (!value) return [];
    return value
        .toLowerCase()
        .replace(/[^a-z0-9\s]+/g, " ")
        .split(/\s+/)
        .map((token) => token.trim())
        .filter((token) => token.length > 2);
};

const tokensSimilar = (aTokens, bTokens, threshold = 0.75) => {
    if (!aTokens.length || !bTokens.length) return false;
    const setB = new Set(bTokens);
    let overlap = 0;
    aTokens.forEach((token) => {
        if (setB.has(token)) overlap += 1;
    });
    const minLength = Math.min(aTokens.length, bTokens.length);
    if (minLength === 0) return false;
    return overlap / minLength >= threshold;
};

const reasonsMatch = (a, b) => {
    if (!a || !b) return false;
    if (a === b) return true;
    const tokensA = tokenizeForMatch(a);
    const tokensB = tokenizeForMatch(b);
    return tokensSimilar(tokensA, tokensB, 0.6);
};

const parseAssignedDepartments = (raw) => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.map(String);
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.map(String);
        if (typeof parsed === "string" && parsed.trim()) return [parsed.trim()];
    } catch (_) {
        // ignore
    }
    return String(raw)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map(String);
};

const keywordDepartmentsHeuristic = (text = "") => {
    const lc = text.toLowerCase();
    const matches = [];
    const add = (dept) => {
        if (!dept) return;
        if (!matches.includes(dept)) matches.push(dept);
    };
    if (/fire|smoke|burn|flame/.test(lc)) add("fire");
    if (/injur|ambulance|blood|hospital|medical|health/.test(lc)) add("health");
    if (/crime|theft|police|robbery|assault|violence|security/.test(lc)) add("police");
    if (/water|flood|leak|sewer|drain|drainage|pipeline/.test(lc)) add("water");
    if (/electric|power|wire|transformer|outage|electrocute|short circuit/.test(lc)) add("electricity");
    return matches;
};

const buildAiResponseFallback = (description, photo) => {
    const hasPhoto = !!(photo && String(photo).trim());
    const heuristicDepts = keywordDepartmentsHeuristic(description || "");
    if (!hasPhoto) {
        return {
            descriptionPicAI: "No photo provided for analysis.",
            validation: false,
            reason: "Validation requires a photo; manual review needed.",
            assignedDepartments: heuristicDepts,
        };
    }
    return {
        descriptionPicAI: "AI analysis unavailable; photo stored for manual review.",
        validation: false,
        reason: "AI service not configured on server.",
        assignedDepartments: heuristicDepts,
    };
};

const analyzeIssueWithAI = async ({ description, photo, modelOverride = null }) => {
    const openaiKey = (process.env.OPENAI_API_KEY || process.env.DUMMY_OPENAI_KEY || "").trim();
    const defaultSummary = buildAiResponseFallback(description, photo);

    if (!openaiKey) {
        return { ...defaultSummary, source: "fallback" };
    }

    const hasPhoto = !!(photo && String(photo).trim());
    if (!hasPhoto) {
        return { ...defaultSummary, source: "no_photo" };
    }

    const systemPrompt = "You are a municipal issue triage assistant. Always respond with valid JSON.";
    const userContent = [
        {
            type: "text",
            text: `A citizen submitted an issue. Description: ${description || "<empty>"}. Compare it with the attached photo. Respond ONLY as JSON with keys: photo_description (<=200 chars), match (true/false), reason (<=200 chars), departments (array of 1-3 unique strings chosen from [${DEPARTMENTS.join(", ")}]). Do not add commentary.`,
        },
    ];

    if (hasPhoto) {
        userContent.push({
            type: "image_url",
            image_url: { url: photo },
        });
    }

    let model = modelOverride || process.env.OPENAI_MODEL || "gpt-4o-mini";

    try {
        const response = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userContent },
                ],
                response_format: { type: "json_object" },
                temperature: 0.1,
                max_tokens: 220,
            },
            {
                headers: {
                    Authorization: `Bearer ${openaiKey}`,
                    "Content-Type": "application/json",
                },
            }
        );

        const content = response.data?.choices?.[0]?.message?.content || "";
        let parsed;
        try {
            const jsonSliceStart = content.indexOf("{");
            const jsonSliceEnd = content.lastIndexOf("}");
            const jsonPayload = jsonSliceStart >= 0 && jsonSliceEnd >= jsonSliceStart
                ? content.slice(jsonSliceStart, jsonSliceEnd + 1)
                : content;
            parsed = JSON.parse(jsonPayload);
        } catch (parseErr) {
            console.warn("[submit-issue] Failed to parse AI JSON response, falling back", parseErr);
            return { ...defaultSummary, source: "parse_fallback" };
        }

        const photoDescription = typeof parsed.photo_description === "string" ? parsed.photo_description.slice(0, 200) : "AI did not provide a description.";
        const match = typeof parsed.match === "boolean" ? parsed.match : false;
        const reason = typeof parsed.reason === "string" ? parsed.reason.slice(0, 200) : "AI did not provide a reason.";
        const departmentsRaw = Array.isArray(parsed.departments) ? parsed.departments : [];
        const sanitized = departmentsRaw
            .map((val) => (typeof val === "string" ? val.trim().toLowerCase() : ""))
            .filter((val) => DEPARTMENTS.includes(val));
        let assignedDepartments = sanitized.slice(0, 3);
        if (!(match && hasPhoto)) {
            assignedDepartments = [];
        }
        if (assignedDepartments.length === 0 && match && hasPhoto) {
            assignedDepartments = keywordDepartmentsHeuristic(`${description || ""} ${photoDescription}`).slice(0, 3);
        }

        return {
            descriptionPicAI: photoDescription,
            validation: match && hasPhoto,
            reason,
            source: modelOverride ? `openai:${modelOverride}` : "openai",
            assignedDepartments,
        };
    } catch (err) {
        const responseData = err?.response?.data;
        if (responseData && (responseData.error?.code === "model_not_found" || /model/i.test(responseData.error?.message || ""))) {
            if (model !== "gpt-4o-mini" && modelOverride !== "gpt-4o-mini") {
                return analyzeIssueWithAI({ description, photo, modelOverride: "gpt-4o-mini" });
            }
        }
        console.error("[submit-issue] AI request failed:", err?.response?.data || err.message);
        return { ...defaultSummary, source: "api_error" };
    }
};

const confirmCollectionWithAI = async ({
    baseReason,
    baseSummary,
    candidateReason,
    candidateSummary,
}) => {
    const openaiKey = (process.env.OPENAI_API_KEY || process.env.DUMMY_OPENAI_KEY || "").trim();
    if (!openaiKey) {
        return null;
    }

    const systemPrompt = "You compare municipal issue descriptions. Always answer with compact JSON.";
    const prompt = `Two issue reports might refer to the same real-world incident. Decide if they should be grouped. Respond ONLY with JSON {"same_collection": true|false, "rationale": string<=200}.\nIssue A reason: ${baseReason || "<empty>"}\nIssue A summary: ${baseSummary || "<empty>"}\nIssue B reason: ${candidateReason || "<empty>"}\nIssue B summary: ${candidateSummary || "<empty>"}\nInterpret reasons as text written by humans; consider if they describe the same type of problem occurring at the same place and time.`;

    try {
        const response = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model: process.env.OPENAI_MODEL || "gpt-4o-mini",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: [{ type: "text", text: prompt }] },
                ],
                response_format: { type: "json_object" },
                temperature: 0,
                max_tokens: 120,
            },
            {
                headers: {
                    Authorization: `Bearer ${openaiKey}`,
                    "Content-Type": "application/json",
                },
            }
        );

        const content = response.data?.choices?.[0]?.message?.content || "";
        const jsonStart = content.indexOf("{");
        const jsonEnd = content.lastIndexOf("}");
        const payload = jsonStart >= 0 && jsonEnd >= jsonStart ? content.slice(jsonStart, jsonEnd + 1) : content;
        const parsed = JSON.parse(payload);
        if (typeof parsed.same_collection === "boolean") {
            return parsed.same_collection;
        }
    } catch (err) {
        console.warn("[submit-issue] collection AI decision failed", err?.response?.data || err.message);
    }

    return null;
};

const assignIssueToCollection = async (db, issueId, aiResult) => {
    if (!aiResult || !aiResult.validation) {
        return;
    }

    const [[freshIssue]] = await db.query(
        'SELECT id, coordinate, createdAt, validation, REASON_TEXT AS reason_text, description_pic_AI AS description_pic_ai, assigned_department FROM issues WHERE id = ?',
        [issueId]
    );

    if (!freshIssue) {
        return;
    }

    const freshValidation = freshIssue.validation === 1 || freshIssue.validation === true || freshIssue.validation === '1';
    if (!freshValidation) {
        return;
    }

    const issueCoords = parseCoordinate(freshIssue.coordinate);
    if (!issueCoords) {
        return;
    }

    const normalizedReason = normalizeReason(freshIssue.reason_text);
    const normalizedSummary = normalizeReason(freshIssue.description_pic_ai);
    const currentAssigned = parseAssignedDepartments(freshIssue.assigned_department);
    if (!normalizedReason && !normalizedSummary && currentAssigned.length === 0) {
        return;
    }

    const createdAt = freshIssue.createdAt ? new Date(freshIssue.createdAt) : new Date();

    const [candidates] = await db.query(
        `SELECT id, coordinate, createdAt, validation, REASON_TEXT AS reason_text, description_pic_AI AS description_pic_ai, assigned_department, same_collection
         FROM issues
         WHERE id <> ?
           AND createdAt >= DATE_SUB(?, INTERVAL ${MATCH_WINDOW_MINUTES} MINUTE)
         ORDER BY createdAt ASC`,
        [issueId, createdAt]
    );

    for (const candidate of candidates) {
        const candidateCoords = parseCoordinate(candidate.coordinate);
        if (!candidateCoords) continue;

        const candidateCreated = candidate.createdAt ? new Date(candidate.createdAt) : null;
        if (candidateCreated) {
            const timeDiffMs = Math.abs(createdAt.getTime() - candidateCreated.getTime());
            if (timeDiffMs > MATCH_WINDOW_MINUTES * 60 * 1000) {
                continue;
            }
        }

        const distance = haversineDistanceMeters(issueCoords, candidateCoords);
        if (Number.isNaN(distance) || distance > MATCH_RADIUS_METERS) {
            continue;
        }

        const candidateValidation = candidate.validation === 1 || candidate.validation === true || candidate.validation === '1';
        if (!candidateValidation) {
            continue;
        }

        const candidateReason = normalizeReason(candidate.reason_text);
        const candidateSummary = normalizeReason(candidate.description_pic_ai);
        const reasonMatches = normalizedReason && candidateReason && reasonsMatch(normalizedReason, candidateReason);
        const summaryMatches = normalizedSummary && candidateSummary && reasonsMatch(normalizedSummary, candidateSummary);
        const candidateAssigned = parseAssignedDepartments(candidate.assigned_department);
        const assignedOverlap = currentAssigned.length && candidateAssigned.length
            ? currentAssigned.some((dept) => candidateAssigned.includes(dept))
            : false;
        if (currentAssigned.length && candidateAssigned.length && !assignedOverlap) {
            continue;
        }
        const textualMatch = reasonMatches || summaryMatches;
        if (!assignedOverlap && !textualMatch) {
            continue;
        }

        let allowGrouping = assignedOverlap;
        if (!allowGrouping && textualMatch) {
            const aiDecision = await confirmCollectionWithAI({
                baseReason: freshIssue.reason_text,
                baseSummary: freshIssue.description_pic_ai,
                candidateReason: candidate.reason_text,
                candidateSummary: candidate.description_pic_ai,
            });
            if (typeof aiDecision === "boolean") {
                allowGrouping = aiDecision;
            } else {
                allowGrouping = textualMatch;
            }
        }

        if (!allowGrouping) {
            continue;
        }

        let headIdRaw = candidate.same_collection ? Number(candidate.same_collection) : candidate.id;
        if (Number.isNaN(headIdRaw) || headIdRaw <= 0) {
            headIdRaw = candidate.id;
        }
        const headId = headIdRaw;
        if (headId === issueId) {
            continue;
        }

        await db.execute('UPDATE issues SET same_collection = ? WHERE id = ?', [String(headId), issueId]);
        break;
    }
};

// Route to handle issue submission
router.post("/", async (req, res) => {
    const db = req.db;
    const {
        phone_number,
        coordinate,
        description,
        photo,
        emergency = false,
        status = "pending",
    } = req.body || {};

    if (!description) {
        return res.status(400).json({ message: "description is required" });
    }

    try {
        const aiResult = await analyzeIssueWithAI({ description, photo });

        const [result] = await db.execute(
            "INSERT INTO issues (phone_number, coordinate, description, photo, emergency, status, assigned_department, description_pic_AI, validation, REASON_TEXT) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                phone_number || null,
                coordinate,
                description,
                photo || null,
                !!emergency,
                status,
                aiResult.assignedDepartments && aiResult.assignedDepartments.length
                    ? JSON.stringify(aiResult.assignedDepartments)
                    : null,
                aiResult.descriptionPicAI,
                aiResult.validation ? 1 : 0,
                aiResult.reason,
            ]
        );

        await assignIssueToCollection(db, result.insertId, aiResult);

        return res.status(201).json({
            message: "Issue submitted successfully",
            issueId: result.insertId,
            ai: {
                description_pic_ai: aiResult.descriptionPicAI,
                validation: aiResult.validation,
                reason_text: aiResult.reason,
                assigned_departments: aiResult.assignedDepartments || [],
                assigned_department: aiResult.assignedDepartments && aiResult.assignedDepartments.length
                    ? aiResult.assignedDepartments.join(', ')
                    : null,
                source: aiResult.source,
            },
        });
    } catch (error) {
        console.error("Error submitting issue:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = router;