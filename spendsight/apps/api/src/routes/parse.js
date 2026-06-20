const express = require("express");
const router = express.Router();

const Category = require("../models/Category");

const {
    parseTransaction,
} = require("../services/anthropicParser");

router.post("/transaction", async (req, res) => {
    try {
        const { text } = req.body;

        if (!text?.trim()) {
            return res.status(400).json({
                success: false,
                error: "Transaction text is required",
            });
        }

        const parsed = await parseTransaction(text);

        return res.json({
            success: true,
            data: parsed,
        });

    } catch (error) {
        console.error("Claude Parse Error:", error);

        return res.status(500).json({
            success: false,
            error: "Failed to parse transaction",
        });
    }
});

module.exports = router;