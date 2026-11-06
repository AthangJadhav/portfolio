# Portfolio — Full-Stack Setup Guide

This project is now two parts in one repo:

```
portfolio/
├─ backend/              Express API (auth, sections CMS, site content, uploads)
│  ├─ data/db.json        JSON "database" — site content + sections
│  ├─ uploads/            Uploaded videos land here (served at /uploads/...)
│  ├─ middleware/auth.js  JWT guard for /api/admin/*
│  ├─ routes/             auth.js, sections.js, site.js, adminSections.js, adminSite.js
│  ├─ utils/              db.js (JSON read/write), upload.js (multer), hashPassword.js
│  ├─ server.js           App entry point
│  └─ .env.example        Copy to .env and fill in
├─ src/                  React + Vite frontend
│  ├─ components/         TopBar, LoginModal, AdminDashboard, WorkSidebar, VideoModal
│  └─ lib/api.ts          Talks to the backend
├─ public/
├─ .env.example           Copy to .env.local — VITE_API_URL
└─ package.json           Frontend (Vite) package.json
```

## 1. Backend setup

```bash
cd backend
npm install
```

Generate a bcrypt hash for the password you want to log in with:

```bash
node utils/hashPassword.js "YourChosenPassword"
```

Copy the printed hash. Then:

```bash
cp .env.example .env
```

Edit `backend/.env`:

```
JWT_SECRET=<a long random string — see the comment in .env.example for a one-liner to generate one>
ADMIN_PASSWORD_HASH=<the hash you just generated>
PORT=4000
CORS_ORIGIN=http://localhost:5173
```

Start the backend:

```bash
npm run dev
```

It listens on `http://localhost:4000` by default. `GET /api/health` should return `{"status":"ok"}`.

## 2. Frontend setup

From the project root (not `backend/`):

```bash
npm install
cp .env.example .env.local
```

`\.env.local` only needs:

```
VITE_API_URL=http://localhost:4000
```

Start the frontend:

```bash
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## 3. Using the site

- **Public view**: open the site normally — no login needed. The "WORK" sidebar lists every visible section; clicking a title opens the glass video modal.
- **Admin access**: click the "AJ" logo in the top-left **three times within two seconds**. A password modal appears. Log in with the password you set in step 1.
- **Admin dashboard**: after logging in, you can:
  - Edit the hero name/role, work-section heading, and contact copy ("Site content").
  - Add a new section (title, caption, optional video file).
  - Edit, reorder (↑/↓), hide/unhide, replace the video, or delete any existing section.
  - Log out (clears your token; the triple-click will ask for the password again next time).

Admin edits save to `backend/data/db.json` and uploaded videos to `backend/uploads/`. The public site re-fetches its content after every admin change, so changes appear without a page reload.

## 4. Notes

- **Video formats accepted**: MP4, WebM, MOV, MKV. Max size: 500MB per file (configurable in `backend/utils/upload.js`).
- **Where visibility is enforced**: `GET /api/sections` (the public endpoint) only ever returns sections where `isVisible` is `true`. The admin dashboard calls `GET /api/admin/sections`, which returns everything, hidden included.
- **Password reset**: there's no "forgot password" flow by design — it's a single-admin site. To change the password, re-run `hashPassword.js` with the new password and update `ADMIN_PASSWORD_HASH` in `.env`, then restart the backend.
- **Moving to production**: this setup keeps JSON-file storage and local disk uploads, which is fine for a single-admin portfolio but assumes one server process (no horizontal scaling) and that the `backend/uploads` folder is backed up. If you outgrow it, the natural next step is swapping `utils/db.js` for a real database and `utils/upload.js` for an object-storage client — the route files don't need to change much since they only call those two modules.
