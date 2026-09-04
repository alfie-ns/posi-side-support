import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const pages = ["index.html", "privacy/index.html", "support/index.html"];

function source(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function localTarget(page, reference) {
  const clean = reference.split(/[?#]/, 1)[0];
  if (!clean || clean.startsWith("#") || /^(https?:|mailto:)/.test(clean)) return null;
  const candidate = path.resolve(path.dirname(path.join(root, page)), clean);
  return clean.endsWith("/") ? path.join(candidate, "index.html") : candidate;
}

test("every local page link and asset resolves", () => {
  for (const page of pages) {
    const html = source(page);
    for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      const target = localTarget(page, match[1]);
      if (target) assert.ok(existsSync(target), `${page} has a broken reference to ${match[1]}`);
    }
  }
});

test("the home page has one clear sales route and grounded positioning", () => {
  const html = source("index.html");
  assert.match(html, /apps\.apple\.com\/gb\/app\/posi-side-positive-journal\/id6804738473/);
  assert.match(html, /£3\.99 founding price/);
  assert.match(html, /No subscription/);
  assert.match(html, /No account/);
  assert.match(html, /Data Not Collected/);
  assert.match(html, /without deciding what it meant/);
  assert.doesNotMatch(html, /they secretly liked you|sexual attraction|medical treatment/i);
});

test("search and social metadata use the published GitHub Pages origin", () => {
  const html = source("index.html");
  const origin = "https://alfie-ns.github.io/posi-side-support/";
  assert.match(html, new RegExp(`<link rel="canonical" href="${origin}">`));
  assert.match(html, new RegExp(`<meta property="og:url" content="${origin}">`));
  assert.match(html, /posi-side-header\.png/);
});

test("the supplied launch imagery is present and non-empty", () => {
  for (const asset of [
    "assets/posi-side-icon.png",
    "assets/posi-side-capture-example.png",
    "assets/posi-side-header.png"
  ]) {
    const file = path.join(root, asset);
    assert.ok(existsSync(file), `missing ${asset}`);
    assert.ok(statSync(file).size > 1_000, `${asset} is unexpectedly small`);
  }
});

test("privacy and support remain directly reachable", () => {
  assert.match(source("privacy/index.html"), /Privacy Policy/);
  assert.match(source("support/index.html"), /Contact support/);
  assert.match(source("privacy/index.html"), /href="\.\.\/"/);
  assert.match(source("support/index.html"), /href="\.\.\/"/);
});
