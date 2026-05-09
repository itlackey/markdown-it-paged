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

@page chapter opener template=chapter
@section intro hero lead region=body
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
});
