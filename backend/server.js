// ========================================
// IMPORT REQUIRED PACKAGES
// ========================================

const express = require("express");
const cors = require("cors");
const db = require("./db");
require("dotenv").config();

// ========================================
// CREATE EXPRESS APPLICATION
// ========================================

const app = express();

const PORT = process.env.PORT || 3000;

// ========================================
// MIDDLEWARE
// ========================================

// Allow the frontend to communicate with the backend
app.use(cors());

// Allow the server to receive JSON data
app.use(express.json());

// ========================================
// TEST ROUTE
// ========================================

app.get("/", (req, res) => {
    res.send("My Diary backend is running successfully! 💗");
});

// ========================================
// GET ALL DIARY ENTRIES
// ========================================

app.get("/api/entries", (req, res) => {
    const sql = `
        SELECT *
        FROM diary_entries
        ORDER BY entry_date DESC, id DESC
    `;

    db.query(sql, (error, results) => {
        if (error) {
            console.error("Error fetching entries:", error.message);
            return res.status(500).json({
                message: "Failed to fetch diary entries."
            });
        }

        res.json(results);
    });
});

// ========================================
// GET ONE DIARY ENTRY
// ========================================

app.get("/api/entries/:id", (req, res) => {
    const { id } = req.params;

    const sql = "SELECT * FROM diary_entries WHERE id = ?";

    db.query(sql, [id], (error, results) => {
        if (error) {
            console.error("Error fetching entry:", error.message);
            return res.status(500).json({
                message: "Failed to fetch diary entry."
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                message: "Diary entry not found."
            });
        }

        res.json(results[0]);
    });
});

// ========================================
// CREATE A NEW DIARY ENTRY
// ========================================

app.post("/api/entries", (req, res) => {
    const {
        title,
        entry_date,
        category,
        mood,
        content,
        favorite
    } = req.body;

    // Validate required fields
    if (
        !title ||
        !entry_date ||
        !category ||
        !mood ||
        !content
    ) {
        return res.status(400).json({
            message: "Please provide all required diary entry fields."
        });
    }

    const sql = `
        INSERT INTO diary_entries
        (title, entry_date, category, mood, content, favorite)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    const values = [
        title,
        entry_date,
        category,
        mood,
        content,
        favorite ? 1 : 0
    ];

    db.query(sql, values, (error, result) => {
        if (error) {
            console.error("Error creating entry:", error.message);
            return res.status(500).json({
                message: "Failed to create diary entry."
            });
        }

        res.status(201).json({
            message: "Diary entry created successfully!",
            id: result.insertId
        });
    });
});

// ========================================
// UPDATE A DIARY ENTRY
// ========================================

app.put("/api/entries/:id", (req, res) => {
    const { id } = req.params;

    const {
        title,
        entry_date,
        category,
        mood,
        content,
        favorite
    } = req.body;

    if (
        !title ||
        !entry_date ||
        !category ||
        !mood ||
        !content
    ) {
        return res.status(400).json({
            message: "Please provide all required diary entry fields."
        });
    }

    const sql = `
        UPDATE diary_entries
        SET title = ?,
            entry_date = ?,
            category = ?,
            mood = ?,
            content = ?,
            favorite = ?
        WHERE id = ?
    `;

    const values = [
        title,
        entry_date,
        category,
        mood,
        content,
        favorite ? 1 : 0,
        id
    ];

    db.query(sql, values, (error, result) => {
        if (error) {
            console.error("Error updating entry:", error.message);
            return res.status(500).json({
                message: "Failed to update diary entry."
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Diary entry not found."
            });
        }

        res.json({
            message: "Diary entry updated successfully!"
        });
    });
});

// ========================================
// DELETE A DIARY ENTRY
// ========================================

app.delete("/api/entries/:id", (req, res) => {
    const { id } = req.params;

    const sql = "DELETE FROM diary_entries WHERE id = ?";

    db.query(sql, [id], (error, result) => {
        if (error) {
            console.error("Error deleting entry:", error.message);
            return res.status(500).json({
                message: "Failed to delete diary entry."
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Diary entry not found."
            });
        }

        res.json({
            message: "Diary entry deleted successfully!"
        });
    });
});

// ========================================
// START THE SERVER
// ========================================

app.listen(PORT, () => {
    console.log(`My Diary server running at http://localhost:${PORT}`);
});