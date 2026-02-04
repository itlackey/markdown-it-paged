/**
 * Simple build: emits dist/index.cjs, dist/index.mjs, dist/index.d.ts
 * No bundlers. Keeps the project dependency-light.
 */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const src = path.join(root, "src", "index.js");
const distDir = path.join(root, "dist");

fs.mkdirSync(distDir, { recursive: true });

// CommonJS output: copy source
fs.copyFileSync(src, path.join(distDir, "index.cjs"));

// ESM output: tiny wrapper that imports CJS and re-exports default
const esm = `
import cjs from "../src/index.js";
export default cjs;
`;
fs.writeFileSync(path.join(distDir, "index.mjs"), esm.trimStart(), "utf8");

// Types (minimal)
const dts = `
import type MarkdownIt from "markdown-it";

export interface LayoutWarning {
  line: number;
  type: string;
  message: string;
  marker?: any;
}

export interface PagedOptions {
  implicitPage?: boolean;
  preferPagesInSpreads?: boolean;
  warnOnBreakWithoutScope?: boolean;
}

declare function markdownItPaged(md: MarkdownIt, options?: PagedOptions): void;
export default markdownItPaged;
`;
fs.writeFileSync(path.join(distDir, "index.d.ts"), dts.trimStart(), "utf8");

console.log("Built dist/ files.");
