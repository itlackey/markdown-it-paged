# Changelog

## [Unreleased] 0.4.0
- `@section` now emits `class="section"` instead of `class="region"`
- `@break` semantics changed: now only closes the nearest open `@section` (no-op if none open); no break div emitted
- New `@page-break` marker: forces a page break in flow without opening a named page container; emits `<div class="md-page-break" aria-hidden="true">`
- `@chapter` no longer auto-closes at EOF; Paged.js handles document-end implicitly
- `@section` now auto-closes at EOF (explicit `closeSection()` before EOF spread logic)
- CSS: `.region` rule replaced by `.section { break-inside: avoid; }`
- CSS: `.md-break` rule replaced by `.md-page-break { break-before: page; }`

## 0.3.0
- Add `@end-section` marker: explicitly closes the currently open section region mid-page
- `@end-section` with no open section is a no-op (no warning, no output)
- `@end-section` does not close the enclosing `@page` — only the section within it
- Switch project license to MPL-2.0

## 0.1.0
- Initial release: @spread/@page/@section/@break markers
- Opt-in behavior (no markers -> no wrappers)
- Non-fatal validation warnings in env.layoutWarnings
- Snapshot tests (Vitest)
