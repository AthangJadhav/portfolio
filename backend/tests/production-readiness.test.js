const test = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const { spawn } = require("node:child_process");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const PORT = 4101;
const TEST_PASSWORD = "StrongPassword123!";
const TEST_SECRET = "test-secret-for-ci";

function waitForServer(port, timeoutMs = 15000) {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const tryFetch = () => {
      fetch(`http://localhost:${port}/api/health`)
        .then((response) => {
          if (response.ok) return resolve();
          throw new Error(`Health check failed: ${response.status}`);
        })
        .catch(() => {
          if (Date.now() - startedAt > timeoutMs) {
            reject(new Error(`Server did not start within ${timeoutMs}ms`));
            return;
          }

          setTimeout(tryFetch, 200);
        });
    };

    tryFetch();
  });
}

test("backend login and reorder flow works with production safeguards", async () => {
  const hash = await bcrypt.hash(TEST_PASSWORD, 10);
  const child = spawn(process.execPath, ["server.js"], {
    cwd: __dirname + "/..",
    env: {
      ...process.env,
      PORT: String(PORT),
      JWT_SECRET: TEST_SECRET,
      ADMIN_PASSWORD_HASH: hash,
      NODE_ENV: "test",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  let serverOutput = "";
  child.stdout.on("data", (chunk) => {
    serverOutput += chunk.toString();
  });
  child.stderr.on("data", (chunk) => {
    serverOutput += chunk.toString();
  });

  try {
    await waitForServer(PORT);

    const loginResponse = await fetch(`http://localhost:${PORT}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: TEST_PASSWORD }),
    });

    const loginText = await loginResponse.text();
    assert.equal(loginResponse.status, 200, `Login unexpectedly failed: ${loginText}`);

    const cookieHeader = loginResponse.headers.get("set-cookie") || "";
    assert.match(cookieHeader, /admin_token=/, "Login should set the admin auth cookie");

    const token = jwt.sign({ role: "admin" }, TEST_SECRET, { expiresIn: "7d" });
    const sectionsResponse = await fetch(`http://localhost:${PORT}/api/admin/sections`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const sectionsText = await sectionsResponse.text();
    assert.equal(sectionsResponse.status, 200, `Admin sections fetch failed: ${sectionsText}`);
    const sections = JSON.parse(sectionsText);
    assert.ok(Array.isArray(sections));

    const order = sections.map((section) => section.id);
    if (order.length > 1) {
      const [first] = order;
      order.push(first);
      order.shift();

      const reorderResponse = await fetch(`http://localhost:${PORT}/api/admin/sections/reorder`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ order }),
      });

      const reorderText = await reorderResponse.text();
      assert.equal(reorderResponse.status, 200, `Reorder unexpectedly failed: ${reorderText}`);
      const updatedSections = JSON.parse(reorderText);
      assert.ok(Array.isArray(updatedSections));
      assert.equal(updatedSections.length, sections.length);
    }
  } finally {
    child.kill("SIGTERM");
    await once(child, "exit").catch(() => undefined);
    if (serverOutput) {
      console.log(serverOutput.trim());
    }
  }
});
