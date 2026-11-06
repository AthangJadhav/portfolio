const express = require("express");
const db = require("../utils/db");

const router = express.Router();

// GET /api/sections
// Public: only visible sections, sorted by position. Hidden sections
// are never sent here — this is the one place visibility is enforced
// for anonymous visitors.
router.get("/", (req, res) => {
  const data = db.read();
  const visible = data.sections
    .filter((section) => section.isVisible)
    .sort((a, b) => a.position - b.position);
  res.json(visible);
});

module.exports = router;
