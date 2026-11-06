const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const router = express.Router();

// Very small brute-force guard: slow down after repeated failures
// from the same IP. Resets on success. Not a replacement for a
// real rate limiter, but better than nothing for a single-admin site.
const failedAttempts = new Map(); // ip -> { count, lastAttempt }
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 10;

function tooManyAttempts(ip) {
  const entry = failedAttempts.get(ip);
  if (!entry) return false;
  if (Date.now() - entry.lastAttempt > WINDOW_MS) {
    failedAttempts.delete(ip);
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

function recordFailure(ip) {
  const entry = failedAttempts.get(ip) || { count: 0, lastAttempt: 0 };
  entry.count += 1;
  entry.lastAttempt = Date.now();
  failedAttempts.set(ip, entry);
}

function clearFailures(ip) {
  failedAttempts.delete(ip);
}

function buildAuthCookie(token) {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

// POST /api/admin/login
router.post("/login", async (req, res) => {
  const { password } = req.body || {};
  const ip = req.ip;

  if (tooManyAttempts(ip)) {
    return res.status(429).json({ error: "Too many attempts. Try again later." });
  }

  if (!password || typeof password !== "string") {
    return res.status(400).json({ error: "Password is required." });
  }

  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!hash) {
    // Misconfiguration, not a login failure, so this one doesn't count
    // against the attempt limiter.
    return res.status(500).json({ error: "Server is not configured with an admin password." });
  }

  const isMatch = await bcrypt.compare(password, hash);

  if (!isMatch) {
    recordFailure(ip);
    return res.status(401).json({ error: "Incorrect password." });
  }

  clearFailures(ip);

  const token = jwt.sign({ role: "admin" }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("admin_token", token, buildAuthCookie(token));
  res.json({ token, ok: true });
});

module.exports = router;
