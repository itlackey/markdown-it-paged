# Changelog

## 0.3.0
- New `@end-section` marker: explicitly closes the open section region mid-page without forcing a page break
- New `@page-break` marker: forces a page break in flow without opening a named page container
- New `@column-break` marker: forces a column break within a multi-column section; emits a zero-height `<div class="md-column-break">` with `break-after: column`
- New `@break` semantics: now only closes the nearest open `@section` (no-op if none open); no longer closes pages or emits a break div
- `@section` now emits `class="section"` (was `class="region"`); CSS updated to match
- `@section` auto-closes at EOF; `@chapter` is intentionally left open at EOF
- `@page` no longer closes on `@section` — page wrapper persists across section transitions
- Switch project license to MPL-2.0

## 0.1.0
- Initial release: @spread/@page/@section/@break markers
- Opt-in behavior (no markers -> no wrappers)
- Non-fatal validation warnings in env.layoutWarnings
- Snapshot tests (Vitest)
