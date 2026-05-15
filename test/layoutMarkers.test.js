import { describe, it, expect } from "vitest";
import MarkdownIt from "markdown-it";
import paged from "../src/index.js";

function render(mdText, pluginOpts) {
  const md = new MarkdownIt({ html: false });
  md.use(paged, pluginOpts);
  const env = {};
  const html = md.render(mdText, env);
  return { html, warnings: env.layoutWarnings ?? [] };
}

describe("markdown-it-paged", () => {
  it("does nothing when no markers are used (opt-in)", () => {
    const input = `# Title

This is normal markdown.
`;
    const { html, warnings } = render(input);
    expect(html).toMatchSnapshot();
    expect(warnings).toMatchSnapshot();
  });

  it("adhoc spread + break wraps only the marked region", () => {
    const input = `Before.

@spread s1 class=fullbleed
Inside spread.

@break

After.
`;
    const { html, warnings } = render(input);
    expect(html).toMatchSnapshot();
    expect(warnings).toMatchSnapshot();
  });

  it("explicit spread + pages + sections", () => {
    const input = `@spread ch1 template=spread

@page left template=spread-left
@section hero region=left class=hero
# Hello
Text

@page right template=spread-right
@section body region=right
More
`;
    const { html, warnings } = render(input);
    expect(html).toMatchSnapshot();
    expect(warnings).toMatchSnapshot();
  });

  it("section without page triggers implicit page + warning", () => {
    const input = `@section intro
Hello
`;
    const { html, warnings } = render(input, { implicitPage: true });
    expect(html).toMatchSnapshot();
    expect(warnings).toMatchSnapshot();
  });

  it("break closes nearest scope (section then page then spread)", () => {
    const input = `@spread s
@page p
@section a
A
@break
B
@break
C
@break
D
`;
    const { html, warnings } = render(input);
    expect(html).toMatchSnapshot();
    expect(warnings).toMatchSnapshot();
  });

  it("supports space-delimited class lists on markers", () => {
    const input = `@spread fullbleed opener

@page template=chapter chapter opener
@section region=body intro hero lead
Hello
`;
    const { html, warnings } = render(input);
    expect(html).toMatchSnapshot();
    expect(warnings).toMatchSnapshot();
  });

  it("wraps content in chapter containers until the next chapter or eof", () => {
    const input = `@chapter intro opener
# Intro

@page cover featured template=chapter
@section body prose region=main
Welcome

@break

Still in the first chapter.

@chapter appendix
## Appendix
Done.
`;
    const { html, warnings } = render(input);
    expect(html).toMatchSnapshot();
    expect(warnings).toMatchSnapshot();
  });

  it("@end-section closes an open section region mid-page", () => {
    const input = `@page p1

@section two-column
Left column content.

@end-section

Single column content after section.
`;
    const { html, warnings } = render(input);
    expect(html).toMatchSnapshot();
    expect(warnings).toMatchSnapshot();
    // section div should be present and closed before the trailing paragraph
    expect(html).toContain('<div class="region"');
    expect(html).toContain('</div>');
    // The trailing paragraph must appear after the section close
    const sectionCloseIdx = html.indexOf('</div>', html.indexOf('Left column content.'));
    const trailingParaIdx = html.indexOf('Single column content after section.');
    expect(trailingParaIdx).toBeGreaterThan(sectionCloseIdx);
  });

  it("@end-section with no open section is a no-op (no extra divs emitted)", () => {
    const input = `@page p1
Some content.

@end-section

More content.
`;
    const { html, warnings } = render(input);
    expect(html).toMatchSnapshot();
    expect(warnings).toMatchSnapshot();
    // No region div should appear since no @section was opened
    expect(html).not.toContain('class="region');
  });

  it("content after @end-section within the same @page renders outside any region div", () => {
    const input = `@page p1

@section .two-column
Inside two-column.

@end-section

Outside two-column.
`;
    const { html, warnings } = render(input);
    expect(html).toMatchSnapshot();
    expect(warnings).toMatchSnapshot();
    // Confirm the region div does not wrap the final paragraph
    const regionCloseIdx = html.lastIndexOf('</div>');
    const outsideParaIdx = html.indexOf('Outside two-column.');
    // The region close tag for the section should appear before the outside paragraph
    // (the page close wraps everything, so we check the section close specifically)
    const regionOpenIdx = html.indexOf('<div class="region');
    const regionCloseAfterOpen = html.indexOf('</div>', regionOpenIdx);
    expect(outsideParaIdx).toBeGreaterThan(regionCloseAfterOpen);
  });
});
