const jwt = require("jsonwebtoken");

function getTokenFromRequest(req) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme === "Bearer" && token) {
    return token;
  }

  const cookies = Object.fromEntries(
    (req.headers.cookie || "")
      .split(";")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        const separatorIndex = entry.indexOf("=");
        if (separatorIndex === -1) return [entry, ""];
        return [entry.slice(0, separatorIndex), entry.slice(separatorIndex + 1)];
      })
  );

  return cookies.admin_token || null;
}

// Protects every route it's attached to: no valid token -> 401.
// Mount this on the whole /api/admin router so new admin routes
// are protected automatically instead of opting in one by one.
function requireAdmin(req, res, next) {
  const token = getTokenFromRequest(req);

  if (!token) {
    return res.status(401).json({ error: "Missing or malformed Authorization header." });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.role !== "admin") {
      return res.status(403).json({ error: "Not authorized." });
    }
    req.admin = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}

module.exports = { requireAdmin };
