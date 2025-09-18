const express = require("express");
const router = express.Router();

// Route to handle issue submission
router.post("/", async (req, res) => {
    const db = req.db;
    const { phone_number, coordinate, description, photo, emergency, status } = req.body;



    try {
        // Insert issue into database
        const [result] = await db.execute(
            "INSERT INTO issues ( phone_number, coordinate, description, photo, emergency, status) VALUES (?, ?, ?, ?, ?, ?)",
            [phone_number, coordinate, description, photo, emergency, status]
        );

        // Return success response
        return res.status(201).json({
            message: "Issue submitted successfully",
            issueId: result.insertId
        });
    } catch (error) {
        console.error("Error submitting issue:", error);
        return res.status(555).json({ message: "Internal server error" });
    }
});
module.exports = router;