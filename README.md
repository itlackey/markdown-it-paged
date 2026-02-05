# markdown-it-paged

A **markdown-it** extension that lets authors opt-in to print/layout structure using lightweight `@` markers:

- `@spread` → opens a spread wrapper
- `@page` → opens a page wrapper
- `@section` → opens a region wrapper (content area within a page)
- `@break` → closes the **nearest open scope** (section → page → spread) and inserts a hard page break marker

## Why

For print workflows (e.g. Paged.js), authors often need occasional control:

- group content into a spread
- force a new page at a specific point
- create named regions that CSS can position/flow

This plugin keeps authoring **flat** and avoids nested fences/containers.

## Install

```bash
npm i markdown-it-paged
```

## Usage

### Node (CJS)

```js
const MarkdownIt = require("markdown-it");
const paged = require("markdown-it-paged");

const md = new MarkdownIt({ html: false });
md.use(paged, { implicitPage: true });

const env = {};
const html = md.render(source, env);

console.log(html);
console.log(env.layoutWarnings); // optional validation warnings
```

### Node (ESM)

```js
import MarkdownIt from "markdown-it";
import paged from "markdown-it-paged";

const md = new MarkdownIt({ html: false });
md.use(paged);

const env = {};
const html = md.render(source, env);
```

## Author syntax

### Minimal adhoc spread + break

```md
Normal flowing content...

@spread monster-reveal class=fullbleed
![Monster](img/monster.png)

Dramatic text continues...

@break

Back to normal flow...
```

### Explicit spreads/pages/sections

```md
@spread ch1-open template=spread

@page left template=spread-left
@section hero region=left class=hero
# Chapter 1
Intro copy...

@page right template=spread-right
@section body region=right
Main text...
```

### `@break` closes the nearest open scope

```md
@spread s
@page p
@section sidebar region=left
Sidebar...

@break   # closes section, inserts a page break marker

More...

@break   # closes page, inserts a page break marker
```

## Output HTML

All wrappers are `div` elements with classes + `data-*` attributes:

- Spread → `<div class="spread …" data-spread="…">`
- Page → `<div class="page …" data-page="…">`
- Section/region → `<div class="region …" data-section="…" data-region="…">`
- Break → `<div class="md-break" aria-hidden="true"></div>`

## CSS for Paged.js (copy/paste)

Place in your print CSS. This is sufficient for basic behavior:

```css
/* Hard page breaks from @break */
.md-break { break-before: page; }

/* Explicit pages */
.page { break-before: page; }

/* Optional: spread group starts on a fresh page */
.spread { break-before: page; }

/* Best-effort: keep regions together */
.region { break-inside: avoid; }
```

Named templates (optional):

```css
.page[data-template="cover"] { page: cover; }
@page cover { /* ... */ }

.page[data-template="spread-left"] { page: spread-left; }
.page[data-template="spread-right"] { page: spread-right; }
@page spread-left { /* ... */ }
@page spread-right { /* ... */ }
```

## Validation warnings

This plugin can emit non-fatal warnings into `env.layoutWarnings`:

- `implicit_page`: `@section` without an open `@page` caused an implicit page to be created (if enabled)
- `nested_spread`: `@spread` opened while another spread was open (auto-closed)
- `break_without_scope`: `@break` used with no open scope (still inserts a break marker)
- `spread_eof_close`: a spread was still open at EOF (auto-closed)

Warnings are meant for linting/CI, but never block rendering.

## Options

```js
md.use(paged, {
  implicitPage: true,          // default true
  preferPagesInSpreads: false, // default false (warn if @page outside spread)
  warnOnBreakWithoutScope: true // default true
});
```

## Development

```bash
npm i
npm test
npm run test:update
npm run build
npm run example:render
```

## License

CC-BY-4.0
