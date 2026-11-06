require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const { requireAdmin } = require("./middleware/auth");

const authRoutes = require("./routes/auth");
const sectionsRoutes = require("./routes/sections");
const siteRoutes = require("./routes/site");
const adminSectionsRoutes = require("./routes/adminSections");
const adminSiteRoutes = require("./routes/adminSite");

// Fail fast if required secrets are missing, instead of silently
// signing tokens nobody can verify or accepting no password at all.
if (!process.env.JWT_SECRET) {
  console.error("Missing JWT_SECRET in .env. See .env.example.");
  process.exit(1);
}
if (!process.env.ADMIN_PASSWORD_HASH) {
  console.error("Missing ADMIN_PASSWORD_HASH in .env. Run: node utils/hashPassword.js \"YourPassword\"");
  process.exit(1);
}

const app = express();
const PORT = Number(process.env.PORT || 4000);

const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOrigin = (origin, callback) => {
  if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
    callback(null, true);
    return;
  }

  callback(new Error("Origin not allowed by CORS"));
};

const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please try again later." },
});

const adminApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again shortly." },
});

app.disable("x-powered-by");
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Serve uploaded videos.
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Public API
app.use("/api/admin/login", adminLoginLimiter);
app.use("/api/admin", authRoutes);
app.use("/api/sections", sectionsRoutes);
app.use("/api/site", siteRoutes);

// Admin API — requireAdmin is mounted once on the whole /api/admin
// prefix, so every route registered under it is protected by
// default. A new admin route added later is protected automatically
// unless it's explicitly registered above this line as public.
const adminRouter = express.Router();
adminRouter.use(adminApiLimiter);
adminRouter.use(requireAdmin);
adminRouter.use("/sections", adminSectionsRoutes);
adminRouter.use("/site", adminSiteRoutes);
app.use("/api/admin", adminRouter);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Centralized error handler — catches multer errors (bad file type,
// too large) and anything else thrown in a route, so the client
// always gets a JSON error instead of an HTML stack trace.
app.use((err, req, res, next) => {
  console.error(err);
  if (err.message && err.message.startsWith("Unsupported video type")) {
    return res.status(415).json({ error: err.message });
  }
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "Video file is too large (max 500MB)." });
  }
  if (err.message === "Origin not allowed by CORS") {
    return res.status(403).json({ error: "Origin not allowed." });
  }
  res.status(500).json({ error: "Something went wrong on the server." });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Backend listening on http://localhost:${PORT}`);
  });
}

module.exports = { app };
