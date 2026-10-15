// Generates app/tokens.css from design/tokens.json (the tradh. design system).
// Run with `pnpm --filter @tradh/web tokens`. Do not edit tokens.css by hand.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const tokens = JSON.parse(readFileSync(join(here, "..", "design", "tokens.json"), "utf8"));

const themes = tokens.color.themes.map((t) => t.id); // ["light","dark"]
const byName = new Map(tokens.color.tokens.map((t) => [t.name, t]));

function resolve(value, theme, depth = 0) {
  if (depth > 8) throw new Error("alias loop");
  const raw = typeof value === "string" ? value : (value[theme] ?? value[themes[0]]);
  const m = /^\{(.+)\}$/.exec(raw);
  if (!m) return raw;
  const ref = byName.get(m[1]);
  if (!ref) throw new Error(`unknown alias ${raw}`);
  return resolve(ref.value, theme, depth + 1);
}

const lines = [];
lines.push(`/* ${tokens.name} — generated from design/tokens.json. Do not edit by hand. */`);

function block(selector, theme) {
  lines.push(`${selector} {`);
  for (const t of tokens.color.tokens) lines.push(`  --${t.name}: ${resolve(t.value, theme)};`);
  for (const t of tokens.shadow.tokens) lines.push(`  --${t.name}: ${typeof t.value === "string" ? t.value : t.value[theme]};`);
  lines.push(`}`);
}

block(':root, [data-theme="light"]', "light");
lines.push(`@media (prefers-color-scheme: dark) {`);
block(`  :root:not([data-theme="light"])`, "dark");
lines.push(`}`);
block(`:root[data-theme="dark"], [data-theme="dark"]`, "dark");

lines.push(`:root {`);
for (const t of tokens.spacing.tokens) lines.push(`  --${t.name}: ${t.value};`);
for (const t of tokens.radius.tokens) lines.push(`  --${t.name}: ${t.value};`);
for (const t of tokens.size.tokens) lines.push(`  --${t.name}: ${t.value};`);
lines.push(`  --font-heading: ${tokens.type.families.heading};`);
lines.push(`  --font-body: ${tokens.type.families.body};`);
lines.push(`  color-scheme: light;`);
lines.push(`}`);
lines.push(`:root[data-theme="dark"] { color-scheme: dark; }`);
lines.push(`@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { color-scheme: dark; } }`);

// Type styles as utility classes (td-display, td-h1, …) so pages can use them without Tailwind config.
for (const g of tokens.type.groups) {
  for (const s of g.styles) {
    const parts = [
      `font-family: var(--font-${g.family})`,
      `font-size: ${s.fontSize}`,
      `line-height: ${s.lineHeight}`,
      `font-weight: ${s.fontWeight}`,
    ];
    if (s.letterSpacing) parts.push(`letter-spacing: ${s.letterSpacing}`);
    if (s.name === "eyebrow") parts.push("text-transform: uppercase");
    if (s.name === "figure" || s.name === "data") parts.push("font-variant-numeric: tabular-nums");
    lines.push(`.t-${s.name} { ${parts.join("; ")}; }`);
  }
}

// Tailwind v4 theme mapping: only semantic tokens, no default palette.
lines.push(`@theme inline {`);
lines.push(`  --color-*: initial;`);
for (const t of tokens.color.tokens) lines.push(`  --color-${t.name}: var(--${t.name});`);
lines.push(`  --font-heading: var(--font-heading);`);
lines.push(`  --font-body: var(--font-body);`);
lines.push(`  --font-sans: var(--font-body);`);
for (const t of tokens.radius.tokens) lines.push(`  --${t.name.replace("radius-", "radius-")}: ${t.value};`);
for (const t of tokens.shadow.tokens) lines.push(`  --${t.name.replace("shadow-", "shadow-")}: var(--${t.name});`);
lines.push(`}`);

writeFileSync(join(here, "..", "app", "tokens.css"), lines.join("\n") + "\n");
console.log(`tokens.css written (${tokens.color.tokens.length} colours, ${themes.length} themes)`);
