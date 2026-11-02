import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { renderInline, type Note } from "../app/components/InlineText";

const html = (text: string, notes?: Record<string, Note>) => renderToStaticMarkup(<p>{renderInline(text, notes)}</p>);

test("bold", () => {
  expect(html("a **b** c")).toBe("<p>a <strong>b</strong> c</p>");
  expect(html("lone ** stars")).toBe("<p>lone ** stars</p>");
});

test("external links open a new tab, internal ones stay", () => {
  const out = html("see [gh](https://github.com/x) or [about](/about)");
  expect(out).toMatch(/<a href="https:\/\/github.com\/x" target="_blank" rel="noopener noreferrer"[^>]*>gh<\/a>/);
  const internal = out.match(/<a[^>]*href="\/about"[^>]*>about<\/a>/)?.[0] ?? "";
  expect(internal).not.toBe("");
  expect(internal).not.toContain("target");
});

test("unsupported schemes stay plain text", () => {
  expect(html("[x](javascript:alert(1))")).not.toContain("<a");
  expect(html("[x](mailto:a@b.c)")).not.toContain("<a");
});

test("a text note becomes a focusable aside", () => {
  const out = html("land of [people](#people).", { people: "some note" });
  expect(out).toContain('tabindex="0"');
  expect(out).toContain(">people</span>");
  expect(out).toMatch(/role="tooltip"[^>]*>some note</);
});

test("a list note shows each name and place", () => {
  const out = html("[them](#who)", { who: [["Ana", "Rio", "sings"], ["Bo", "Oslo", "skis"]] });
  expect(out).toContain("Ana");
  expect(out).toContain("(Rio)");
  expect(out).toContain(", sings");
  expect(out).toContain("Bo");
  expect(out).toContain("etc.");
});

test("an unknown note stays as written", () => {
  expect(html("[x](#missing)")).toBe("<p>[x](#missing)</p>");
});
