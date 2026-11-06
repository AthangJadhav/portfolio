const express = require("express");
const db = require("../utils/db");

const router = express.Router();

const EDITABLE_FIELDS = [
  "heroName",
  "heroRole",
  "introEyebrow",
  "introHeading",
  "contactEyebrow",
  "contactHeading",
  "contactDescription",
  "contactEmail",
  "pricingEyebrow",
  "pricingHeading",
  "pricingNote",
];

// GET /api/admin/site — same data as the public route, kept here too
// so the admin dashboard has one consistent base path to call.
router.get("/", (req, res) => {
  const data = db.read();
  res.json(data.site);
});

// PUT /api/admin/site — partial update of site copy.
router.put("/", async (req, res) => {
  const updates = {};
  for (const field of EDITABLE_FIELDS) {
    if (req.body[field] !== undefined) {
      updates[field] = String(req.body[field]);
    }
  }

  if (req.body.pricingPlans !== undefined) {
    const plans = Array.isArray(req.body.pricingPlans)
      ? req.body.pricingPlans.map((plan) => ({
          number: String(plan.number ?? ""),
          title: String(plan.title ?? ""),
          description: String(plan.description ?? ""),
          price: String(plan.price ?? ""),
          unit: String(plan.unit ?? ""),
          detail: String(plan.detail ?? ""),
          featured: Boolean(plan.featured),
        }))
      : [];

    updates.pricingPlans = plans;
  }

  const data = await db.write((current) => {
    const existingSite = current.site || {};
    const nextSite = {
      ...existingSite,
      ...updates,
      pricingPlans:
        updates.pricingPlans && updates.pricingPlans.length
          ? updates.pricingPlans
          : existingSite.pricingPlans || [
              {
                number: "01",
                title: "Single Short",
                description: "One short-form edit, captions and basic graphics.",
                price: "₹1,000",
                unit: "/ video",
                detail: "2–3 day turnaround · 1 revision",
                featured: false,
              },
              {
                number: "02 · WEEKLY",
                title: "Weekly Pack",
                description: "Four shorts for a consistent publishing rhythm.",
                price: "₹3,200",
                unit: "/ week",
                detail: "4 videos · approx. 20% saving",
                featured: true,
              },
              {
                number: "03",
                title: "Monthly Pack",
                description: "Sixteen shorts planned for long-term consistency.",
                price: "₹13,000",
                unit: "/ month",
                detail: "16 videos · approx. 20% saving",
                featured: false,
              },
            ],
    };

    return {
      ...current,
      site: nextSite,
    };
  });

  res.json(data.site);
});

module.exports = router;
