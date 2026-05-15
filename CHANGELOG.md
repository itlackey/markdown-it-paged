# Changelog

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
