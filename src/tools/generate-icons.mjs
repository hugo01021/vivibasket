/**
 * Génère les icônes PWA (PNG) et le favicon à partir de la marque DunkOne,
 * en rendant le SVG avec Chromium (Playwright) :
 *
 *   node src/tools/generate-icons.mjs
 */
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require("playwright"));
} catch {
  ({ chromium } = createRequire("/opt/node22/lib/node_modules/")("playwright"));
}

const root = process.cwd();
const svg = readFileSync(path.join(root, "app/icon.svg"), "utf8");
const inner = svg.replace(/<rect[^>]*\/>/, ""); // sans le fond : on le dessine à la taille voulue

function page(size, { maskable }) {
  const radius = maskable ? 0 : Math.round(size * 0.22);
  const pad = maskable ? size * 0.12 : 0;
  return `<body style="margin:0;background:transparent"><div style="width:${size}px;height:${size}px;border-radius:${radius}px;background:#0b0b0d;display:flex;align-items:center;justify-content:center;overflow:hidden">
    <div style="width:${size - pad * 2}px;height:${size - pad * 2}px">${inner.replace(/width="32" height="32"/, `width="${size - pad * 2}" height="${size - pad * 2}"`)}</div></div></body>`;
}

function ico(png, size) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(1, 4);
  const entry = Buffer.alloc(16);
  entry[0] = size >= 256 ? 0 : size; entry[1] = size >= 256 ? 0 : size;
  entry.writeUInt16LE(1, 4); entry.writeUInt16LE(32, 6); entry.writeUInt32LE(png.length, 8); entry.writeUInt32LE(22, 12);
  return Buffer.concat([header, entry, png]);
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 600, height: 600 }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
async function render(size, opts) {
  await p.setViewportSize({ width: size, height: size });
  await p.setContent(page(size, opts));
  return p.screenshot({ type: "png", omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
}
mkdirSync(path.join(root, "public/icons"), { recursive: true });
writeFileSync(path.join(root, "public/icons/icon-192.png"), await render(192, { maskable: false }));
writeFileSync(path.join(root, "public/icons/icon-512.png"), await render(512, { maskable: false }));
writeFileSync(path.join(root, "public/icons/maskable-512.png"), await render(512, { maskable: true }));
writeFileSync(path.join(root, "app/apple-icon.png"), await render(180, { maskable: true }));
writeFileSync(path.join(root, "app/favicon.ico"), ico(await render(48, { maskable: false }), 48));
await browser.close();
console.log("Icônes générées : public/icons/*.png, app/apple-icon.png, app/favicon.ico");
