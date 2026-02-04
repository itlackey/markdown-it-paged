const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const files = [
  "src/index.js",
  "README.md",
  "examples/demo.md",
  "examples/render.js",
  "test/layoutMarkers.test.js",
];

let ok = true;

for (const f of files) {
  const p = path.join(root, f);
  const s = fs.readFileSync(p, "utf8");
  if (s.includes("\r\n")) {
    console.error(`[lint] CRLF detected: ${f}`);
    ok = false;
  }
}

if (!ok) process.exit(1);
console.log("Lint OK");
