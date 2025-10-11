const express = require("express");
const axios = require("axios");

const router = express.Router();

const DEPARTMENTS = ["police", "health", "fire", "water", "electricity"];

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
        const heuristicFallback = keywordDepartmentsHeuristic(`${description || ""} ${photoDescription}`);
        const assignedDepartments = (sanitized.length ? sanitized : heuristicFallback).slice(0, 3);

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