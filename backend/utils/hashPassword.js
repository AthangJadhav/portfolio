// One-off helper: prints a bcrypt hash for the password you pass in.
// Usage: node utils/hashPassword.js "YourChosenPassword"
// Paste the printed hash into backend/.env as ADMIN_PASSWORD_HASH.

const bcrypt = require("bcryptjs");

const plainPassword = process.argv[2];

if (!plainPassword) {
  console.error("Usage: node utils/hashPassword.js \"YourChosenPassword\"");
  process.exit(1);
}

const hash = bcrypt.hashSync(plainPassword, 10);
console.log(hash);
