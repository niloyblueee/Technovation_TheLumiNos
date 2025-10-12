const axios = require("axios");

const MATCH_RADIUS_METERS = 100;
const MATCH_WINDOW_MINUTES = 30;

const INCIDENT_CATEGORIES = [
    { key: "fire", pattern: /(fire|smoke|burn|flame|blaze|explosion|inferno)/i },
    { key: "road", pattern: /(pothole|road|street|asphalt|lane|highway|crack|hole)/i },
    { key: "water", pattern: /(flood|water[-\s]?logging|leak|drain|drainage|sewer|pipeline|pipe)/i },
    { key: "electric", pattern: /(electric|power|wire|transformer|electrocute|short circuit|sparks)/i },
    { key: "health", pattern: /(injur|medical|ambulance|health|hospital|disease|illness)/i },
    { key: "police", pattern: /(crime|theft|violence|police|assault|robbery|security)/i },
    { key: "sanitation", pattern: /(garbage|trash|waste|sanitation|clean|dirty|mosquito|vector)/i },
    { key: "noise", pattern: /(noise|loud|sound|speaker|disturbance)/i },
];

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
    const R = 6371000;
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
        // ignore JSON parse errors and fall back to comma split
    }
    return String(raw)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map(String);
};

const detectCategories = (...texts) => {
    const matches = new Set();
    texts.filter(Boolean).forEach((text) => {
        INCIDENT_CATEGORIES.forEach(({ key, pattern }) => {
            if (pattern.test(text)) {
                matches.add(key);
            }
        });
    });
    return matches;
};

const confirmCollectionWithAI = async ({
    baseReason,
    baseSummary,
    baseCategories,
    baseDepartments,
    candidateReason,
    candidateSummary,
    candidateCategories,
    candidateDepartments,
}) => {
    const openaiKey = (process.env.OPENAI_API_KEY || process.env.DUMMY_OPENAI_KEY || "").trim();
    if (!openaiKey) {
        return null;
    }

    const systemPrompt = "You compare municipal issue descriptions. Always answer with compact JSON.";
    const prompt = `Two municipal issue reports might refer to the same real-world incident. Only group them when they clearly describe the SAME type of problem at the SAME location/time. Never group different incident types (e.g., fire vs pothole). Respond ONLY with JSON {"same_collection": true|false, "rationale": string<=200}.\nIssue A reason: ${baseReason || "<empty>"}\nIssue A summary: ${baseSummary || "<empty>"}\nIssue A categories: ${(baseCategories && baseCategories.length) ? baseCategories.join(', ') : '<none>'}\nIssue A departments: ${(baseDepartments && baseDepartments.length) ? baseDepartments.join(', ') : '<none>'}\nIssue B reason: ${candidateReason || "<empty>"}\nIssue B summary: ${candidateSummary || "<empty>"}\nIssue B categories: ${(candidateCategories && candidateCategories.length) ? candidateCategories.join(', ') : '<none>'}\nIssue B departments: ${(candidateDepartments && candidateDepartments.length) ? candidateDepartments.join(', ') : '<none>'}`;

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
        console.warn("[collection-service] AI comparison failed", err?.response?.data || err.message);
    }

    return null;
};

const interpretValidationFlag = (value) => value === 1 || value === true || value === "1";

const assignIssueToCollection = async (db, issueId, { dryRun = false, requireValidation = true } = {}) => {
    const [[freshIssue]] = await db.query(
        'SELECT id, coordinate, createdAt, validation, REASON_TEXT AS reason_text, description_pic_AI AS description_pic_ai, assigned_department FROM issues WHERE id = ?',
        [issueId]
    );

    if (!freshIssue) {
        return { matched: false, reason: "not_found" };
    }

    const isValidated = interpretValidationFlag(freshIssue.validation);
    if (requireValidation && !isValidated) {
        return { matched: false, reason: "not_validated" };
    }

    const issueCoords = parseCoordinate(freshIssue.coordinate);
    if (!issueCoords) {
        return { matched: false, reason: "no_coordinates" };
    }

    const normalizedReason = normalizeReason(freshIssue.reason_text);
    const normalizedSummary = normalizeReason(freshIssue.description_pic_ai);
    const currentAssigned = parseAssignedDepartments(freshIssue.assigned_department);
    const baseCategories = detectCategories(freshIssue.reason_text, freshIssue.description_pic_ai);
    if (!normalizedReason && !normalizedSummary && currentAssigned.length === 0) {
        return { matched: false, reason: "insufficient_signals" };
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

        const candidateValidated = interpretValidationFlag(candidate.validation);
        if (!candidateValidated) {
            continue;
        }

        const candidateReason = normalizeReason(candidate.reason_text);
        const candidateSummary = normalizeReason(candidate.description_pic_ai);
        const reasonMatches = normalizedReason && candidateReason && reasonsMatch(normalizedReason, candidateReason);
        const summaryMatches = normalizedSummary && candidateSummary && reasonsMatch(normalizedSummary, candidateSummary);
        const candidateAssigned = parseAssignedDepartments(candidate.assigned_department);
        const candidateCategories = detectCategories(candidate.reason_text, candidate.description_pic_ai);
        const assignedOverlap = currentAssigned.length && candidateAssigned.length
            ? currentAssigned.some((dept) => candidateAssigned.includes(dept))
            : false;
        if (currentAssigned.length && candidateAssigned.length && !assignedOverlap) {
            continue;
        }
        if (baseCategories.size && candidateCategories.size) {
            const hasCategoryIntersection = [...baseCategories].some((cat) => candidateCategories.has(cat));
            if (!hasCategoryIntersection) {
                continue;
            }
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
                baseCategories: [...baseCategories],
                baseDepartments: currentAssigned,
                candidateReason: candidate.reason_text,
                candidateSummary: candidate.description_pic_ai,
                candidateCategories: [...candidateCategories],
                candidateDepartments: candidateAssigned,
            });
            if (typeof aiDecision === "boolean") {
                allowGrouping = aiDecision;
            } else {
                allowGrouping = false;
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

        if (!dryRun) {
            await db.execute('UPDATE issues SET same_collection = ? WHERE id = ?', [String(headId), issueId]);
        }
        return { matched: true, headId, candidateId: candidate.id, dryRun };
    }

    return { matched: false, reason: "no_match" };
};

module.exports = {
    assignIssueToCollection,
    parseAssignedDepartments,
};
