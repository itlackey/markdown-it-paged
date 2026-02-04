/**
 * Example: render markdown to HTML with markdown-it-paged.
 *
 * Usage:
 *   node examples/render.js examples/demo.md > examples/demo.html
 */
const fs = require("fs");
const MarkdownIt = require("markdown-it");
const paged = require("../src/index.js");

const file = process.argv[2];
if (!file) {
  console.error("Usage: node examples/render.js <file.md>");
  process.exit(1);
}

const source = fs.readFileSync(file, "utf8");
const md = new MarkdownIt({ html: false });

md.use(paged, { implicitPage: true });

const env = {};
const html = md.render(source, env);

process.stderr.write(JSON.stringify(env.layoutWarnings || [], null, 2) + "\n");
process.stdout.write(html);
