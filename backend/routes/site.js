const express = require("express");
const db = require("../utils/db");

const router = express.Router();

// GET /api/site — public, read-only site copy (hero name, headings, CTA email, etc.)
router.get("/", (req, res) => {
  const data = db.read();
  res.json(data.site);
});

module.exports = router;
