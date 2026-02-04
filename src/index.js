'use strict';

/**
 * markdown-it-paged
 *
 * Markers:
 *   @spread [name] [key=value ...] [#id] [.class...]
 *   @page   [name] [key=value ...] [#id] [.class...]
 *   @section [name] [key=value ...] [#id] [.class...]
 *   @break
 *
 * Output:
 *   spread  -> <div class="spread ..." data-spread="name" ...>
 *   page    -> <div class="page ..." data-page="name" ...>
 *   section -> <div class="region ..." data-section="name" data-region="..." ...>
 *   break   -> <div class="md-break" aria-hidden="true"></div>
 *
 * Opt-in:
 *   If no markers are present, plugin does nothing.
 *
 * Validation:
 *   Warnings are pushed into env.layoutWarnings: Array<{ line, type, message, marker? }>
 */

function parseMarkerLine(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith('@')) return null;

  // Tokenize respecting simple quotes: key="a b"
  const tokens = [];
  let buf = '';
  let quote = null;

  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];

    if (quote) {
      if (ch === quote) quote = null;
      else buf += ch;
      continue;
    }

    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }

    if (/\s/.test(ch)) {
      if (buf) tokens.push(buf);
      buf = '';
      continue;
    }

    buf += ch;
  }

  if (buf) tokens.push(buf);

  const head = tokens[0]; // "@spread" | "@page" | "@section" | "@break"
  const kind = head.slice(1);

  if (!['spread', 'page', 'section', 'break'].includes(kind)) return null;

  if (kind === 'break') {
    return { kind, name: null, attrs: {} };
  }

  let idx = 1;
  let name = null;

  // Optional name (2nd token) if not an attr/shorthand
  if (
    tokens[idx] &&
    !tokens[idx].includes('=') &&
    !tokens[idx].startsWith('.') &&
    !tokens[idx].startsWith('#')
  ) {
    name = tokens[idx];
    idx++;
  }

  const attrs = {};
  const classes = [];

  for (; idx < tokens.length; idx++) {
    const t = tokens[idx];

    // shorthand
    if (t.startsWith('.')) {
      const c = t.slice(1).trim();
      if (c) classes.push(c);
      continue;
    }

    if (t.startsWith('#')) {
      const id = t.slice(1).trim();
      if (id) attrs.id = id;
      continue;
    }

    // key=value
    const eq = t.indexOf('=');
    if (eq > 0) {
      const key = t.slice(0, eq).trim();
      const val = t.slice(eq + 1).trim();
      if (!key) continue;

      if (key === 'class') {
        val
          .split(/[,\s]+/)
          .filter(Boolean)
          .forEach((c) => classes.push(c));
      } else {
        attrs[key] = val;
      }
    }
  }

  if (classes.length) attrs.class = classes.join(' ');
  return { kind, name, attrs };
}

function warn(env, line, type, message, marker) {
  if (!env.layoutWarnings) env.layoutWarnings = [];
  env.layoutWarnings.push({ line, type, message, marker });
}

function addClasses(token, baseClass, extraClass) {
  const cls = [];
  if (baseClass) cls.push(baseClass);
  if (extraClass) cls.push(extraClass);
  const merged = cls.join(' ').trim();
  if (merged) token.attrSet('class', merged);
}

function attachDataAttrs(token, kind, name, attrs) {
  if (name) {
    if (kind === 'spread') token.attrSet('data-spread', name);
    if (kind === 'page') token.attrSet('data-page', name);
    if (kind === 'section') token.attrSet('data-section', name);
  }

  if (attrs.template) token.attrSet('data-template', attrs.template);
  if (attrs.region) token.attrSet('data-region', attrs.region);
  if (attrs.id) token.attrSet('id', attrs.id);

  for (const [k, v] of Object.entries(attrs)) {
    if (!v) continue;
    if (k === 'class' || k === 'id' || k === 'template' || k === 'region') continue;
    token.attrSet(`data-${k}`, v);
  }
}

function plugin(md, pluginOptions = {}) {
  const options = {
    implicitPage: true,
    preferPagesInSpreads: false,
    warnOnBreakWithoutScope: true,
    ...pluginOptions,
  };

  function markerBlock(state, startLine, endLine, silent) {
    const pos = state.bMarks[startLine] + state.tShift[startLine];
    const max = state.eMarks[startLine];
    const line = state.src.slice(pos, max);

    const parsed = parseMarkerLine(line);
    if (!parsed) return false;
    if (silent) return true;

    state.env.__layoutMarkersUsed = true;

    const token = state.push('layout_marker', '', 0);
    token.meta = parsed;
    token.meta.__line = startLine + 1; // 1-based line number

    state.line = startLine + 1;
    return true;
  }

  md.block.ruler.before('paragraph', 'layout_marker', markerBlock, {
    alt: ['paragraph', 'reference', 'blockquote', 'list'],
  });

  md.core.ruler.after('block', 'layout_transform', function (state) {
    if (!state.env.__layoutMarkersUsed) return;

    const out = [];
    let spreadOpen = false;
    let pageOpen = false;
    let sectionOpen = false;

    let spreadStartedWithNoPagesYet = false;
    let sawAnyPageInsideCurrentSpread = false;

    function closeSection() {
      if (!sectionOpen) return;
      out.push(new state.Token('layout_section_close', 'div', -1));
      sectionOpen = false;
    }

    function closePage() {
      if (!pageOpen) return;
      closeSection();
      out.push(new state.Token('layout_page_close', 'div', -1));
      pageOpen = false;
    }

    function closeSpread() {
      if (!spreadOpen) return;
      closePage();
      out.push(new state.Token('layout_spread_close', 'div', -1));
      spreadOpen = false;
      spreadStartedWithNoPagesYet = false;
      sawAnyPageInsideCurrentSpread = false;
    }

    function openSpread(meta) {
      const t = new state.Token('layout_spread_open', 'div', 1);
      addClasses(t, 'spread', meta.attrs && meta.attrs.class ? meta.attrs.class : '');
      attachDataAttrs(t, 'spread', meta.name, meta.attrs || {});
      out.push(t);
      spreadOpen = true;
      spreadStartedWithNoPagesYet = true;
      sawAnyPageInsideCurrentSpread = false;
    }

    function openPage(meta) {
      const t = new state.Token('layout_page_open', 'div', 1);
      addClasses(t, 'page', meta.attrs && meta.attrs.class ? meta.attrs.class : '');
      attachDataAttrs(t, 'page', meta.name, meta.attrs || {});
      out.push(t);
      pageOpen = true;

      if (spreadOpen) {
        sawAnyPageInsideCurrentSpread = true;
        spreadStartedWithNoPagesYet = false;
      } else if (options.preferPagesInSpreads) {
        warn(state.env, meta.__line || 0, 'page_outside_spread', '@page used outside of a spread; allowed, but spreads are recommended for deliberate grouping.', meta);
      }
    }

    function openSection(meta) {
      const t = new state.Token('layout_section_open', 'div', 1);
      addClasses(t, 'region', meta.attrs && meta.attrs.class ? meta.attrs.class : '');
      attachDataAttrs(t, 'section', meta.name, meta.attrs || {});
      out.push(t);
      sectionOpen = true;
    }

    for (let i = 0; i < state.tokens.length; i++) {
      const tok = state.tokens[i];

      if (tok.type !== 'layout_marker') {
        out.push(tok);
        continue;
      }

      const meta = tok.meta || {};
      const kind = meta.kind;
      const line = meta.__line || 0;

      if (kind === 'spread') {
        if (spreadOpen) {
          warn(state.env, line, 'nested_spread', '@spread encountered while another spread is open; closing the previous spread automatically.', meta);
        }
        closeSpread();
        openSpread(meta);
        continue;
      }

      if (kind === 'page') {
        closePage();
        openPage(meta);
        continue;
      }

      if (kind === 'section') {
        closeSection();

        if (!pageOpen) {
          if (options.implicitPage) {
            warn(state.env, line, 'implicit_page', '@section used without an open @page; creating an implicit page wrapper (data-page="auto").', meta);
            openPage({ name: 'auto', attrs: {}, __line: line });
          } else {
            warn(state.env, line, 'section_without_page', '@section used without an open @page; region will render but will not be wrapped in a page.', meta);
          }
        }

        if (spreadOpen && spreadStartedWithNoPagesYet) {
          warn(
            state.env,
            line,
            'spread_without_pages',
            '@section inside a spread without an explicit @page. Allowed (adhoc spread), but explicit @page markers give stronger control.',
            meta
          );
        }

        openSection(meta);
        continue;
      }

      if (kind === 'break') {
        if (!sectionOpen && !pageOpen && !spreadOpen && options.warnOnBreakWithoutScope) {
          warn(state.env, line, 'break_without_scope', '@break used but no spread/page/section is open. It will still force a page break.', meta);
        }

        // Close nearest open scope: section -> page -> spread
        if (sectionOpen) closeSection();
        else if (pageOpen) closePage();
        else if (spreadOpen) closeSpread();

        const b = new state.Token('layout_break', 'div', 0);
        b.attrSet('class', 'md-break');
        b.attrSet('aria-hidden', 'true');
        out.push(b);
        continue;
      }
    }

    if (spreadOpen && !sawAnyPageInsideCurrentSpread) {
      warn(
        state.env,
        0,
        'spread_eof_close',
        'An open @spread reached end-of-document; closing it automatically. If this was meant to be adhoc, consider adding @break to return to default flow.',
        null
      );
    }

    closeSpread();
    state.tokens = out;
  });

  // Renderer rules for injected tokens
  md.renderer.rules.layout_spread_open = (tokens, idx, opts, env, self) => self.renderToken(tokens, idx, opts);
  md.renderer.rules.layout_spread_close = (tokens, idx, opts, env, self) => self.renderToken(tokens, idx, opts);
  md.renderer.rules.layout_page_open = (tokens, idx, opts, env, self) => self.renderToken(tokens, idx, opts);
  md.renderer.rules.layout_page_close = (tokens, idx, opts, env, self) => self.renderToken(tokens, idx, opts);
  md.renderer.rules.layout_section_open = (tokens, idx, opts, env, self) => self.renderToken(tokens, idx, opts);
  md.renderer.rules.layout_section_close = (tokens, idx, opts, env, self) => self.renderToken(tokens, idx, opts);
  md.renderer.rules.layout_break = (tokens, idx, opts, env, self) => self.renderToken(tokens, idx, opts);

  // Marker tokens are transformed away
  md.renderer.rules.layout_marker = () => '';
}

// CJS default export
module.exports = plugin;
// Allow ESM default import via interop
module.exports.default = plugin;
