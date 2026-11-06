// Minimal JSON-file "database". Reads the whole file into memory,
// and serializes writes behind a promise queue so two requests
// can't corrupt db.json by writing at the same time.

const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "..", "data", "db.json");

const DEFAULT_DATA = {
  site: {
    heroName: "Athang Jadhav",
    heroRole: "Video Editor",
    introEyebrow: "Selected Work",
    introHeading: "Things I've edited.",
    contactEyebrow: "Have a project in mind?",
    contactHeading: "Let's work together.",
    contactDescription: "Send me your raw footage.",
    contactEmail: "editswithathang@gmail.com",
    pricingEyebrow: "TRANSPARENT PRICING",
    pricingHeading: "Clear scope.\nBetter stories.",
    pricingNote:
      "Client provides raw footage, B-roll, and music. Revisions cover adjustments to the agreed edit.",
    pricingPlans: [
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
  },
  sections: [],
};

function ensureDbFile() {
  if (!fs.existsSync(DB_PATH)) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(DEFAULT_DATA, null, 2));
  }
}

function readRaw() {
  ensureDbFile();
  const text = fs.readFileSync(DB_PATH, "utf-8");
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error(`db.json is not valid JSON: ${err.message}`);
  }
}

function writeRaw(data) {
  // Write to a temp file then rename, so a crash mid-write can't
  // leave db.json half-written.
  const tmpPath = `${DB_PATH}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2));
  fs.renameSync(tmpPath, DB_PATH);
}

// All writes go through this chain so they run one at a time.
let writeQueue = Promise.resolve();

function read() {
  return readRaw();
}

// `mutator` receives the current data and should return the new data.
// Runs exclusively with respect to other write() calls.
function write(mutator) {
  writeQueue = writeQueue.then(() => {
    const current = readRaw();
    const next = mutator(current);
    writeRaw(next);
    return next;
  });
  return writeQueue;
}

module.exports = { read, write };
