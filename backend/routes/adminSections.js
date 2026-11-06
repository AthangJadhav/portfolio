const express = require("express");
const { v4: uuidv4 } = require("uuid");
const db = require("../utils/db");
const { upload, deleteUploadedFile } = require("../utils/upload");

const router = express.Router();

function nextPosition(sections) {
  if (sections.length === 0) return 0;
  return Math.max(...sections.map((s) => s.position)) + 1;
}

// GET /api/admin/sections
// All sections, hidden included, so the admin dashboard can list
// and toggle everything.
router.get("/", (req, res) => {
  const data = db.read();
  const all = [...data.sections].sort((a, b) => a.position - b.position);
  res.json(all);
});

// POST /api/admin/sections
// multipart/form-data: title, caption, isVisible (optional), video (optional file)
router.post("/", upload.single("video"), async (req, res) => {
  const { title, caption } = req.body;
  const isVisible = req.body.isVisible !== "false"; // defaults true

  if (!title || !title.trim()) {
    return res.status(400).json({ error: "Title is required." });
  }

  const now = new Date().toISOString();

  const newSection = {
    id: uuidv4(),
    title: title.trim(),
    caption: (caption || "").trim(),
    videoUrl: req.file ? `/uploads/${req.file.filename}` : null,
    isVisible,
    position: 0, // set below
    createdAt: now,
    updatedAt: now,
  };

  const data = await db.write((current) => {
    newSection.position = nextPosition(current.sections);
    return { ...current, sections: [...current.sections, newSection] };
  });

  const saved = data.sections.find((s) => s.id === newSection.id);
  res.status(201).json(saved);
});

// PUT /api/admin/sections/reorder
// body: { order: [id1, id2, id3, ...] } — full ordered list of section ids
router.put("/reorder", async (req, res) => {
  const { order } = req.body || {};
  if (!Array.isArray(order)) {
    return res.status(400).json({ error: "order must be an array of section ids." });
  }

  const data = db.read();
  const currentIds = new Set(data.sections.map((s) => s.id));
  const sameSet =
    order.length === currentIds.size && order.every((id) => currentIds.has(id));

  if (!sameSet) {
    return res.status(400).json({ error: "order must include every existing section id exactly once." });
  }

  const updated = await db.write((current) => {
    const positionById = new Map(order.map((id, index) => [id, index]));
    const sections = current.sections.map((s) => ({
      ...s,
      position: positionById.get(s.id),
      updatedAt: new Date().toISOString(),
    }));
    return { ...current, sections };
  });

  res.json([...updated.sections].sort((a, b) => a.position - b.position));
});

// PUT /api/admin/sections/:id
// multipart/form-data: any of title, caption, isVisible, video (optional new file)
router.put("/:id", upload.single("video"), async (req, res) => {
  const { id } = req.params;
  const data = db.read();
  const existing = data.sections.find((s) => s.id === id);

  if (!existing) {
    return res.status(404).json({ error: "Section not found." });
  }

  const updates = {};
  if (req.body.title !== undefined) updates.title = req.body.title.trim();
  if (req.body.caption !== undefined) updates.caption = req.body.caption.trim();
  if (req.body.isVisible !== undefined) updates.isVisible = req.body.isVisible === "true" || req.body.isVisible === true;

  let oldVideoToDelete = null;
  if (req.file) {
    oldVideoToDelete = existing.videoUrl;
    updates.videoUrl = `/uploads/${req.file.filename}`;
  }

  const updated = await db.write((current) => {
    const sections = current.sections.map((s) =>
      s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
    );
    return { ...current, sections };
  });

  if (oldVideoToDelete) {
    deleteUploadedFile(oldVideoToDelete);
  }

  const saved = updated.sections.find((s) => s.id === id);
  res.json(saved);
});

// DELETE /api/admin/sections/:id
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const data = db.read();
  const existing = data.sections.find((s) => s.id === id);

  if (!existing) {
    return res.status(404).json({ error: "Section not found." });
  }

  await db.write((current) => ({
    ...current,
    sections: current.sections.filter((s) => s.id !== id),
  }));

  if (existing.videoUrl) {
    deleteUploadedFile(existing.videoUrl);
  }

  res.status(204).end();
});

module.exports = router;
