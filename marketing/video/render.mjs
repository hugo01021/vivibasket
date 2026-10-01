import { createRequire } from "node:module";
import { mkdirSync, rmSync } from "node:fs";
const { chromium } = createRequire(import.meta.url)("playwright");
const DIR = ".";
const FPS = 30, DURATION = Number(process.argv[2] ?? 32);
const only = process.argv[3] ? process.argv[3].split(",").map(Number) : null; // instants précis pour un aperçu
const frames = `${DIR}/frames`;
if (!only) { rmSync(frames, { recursive: true, force: true }); mkdirSync(frames, { recursive: true }); } else mkdirSync(`${DIR}/preview`, { recursive: true });
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 })).newPage();
await page.goto("http://localhost:8123/scene.html");
await page.evaluate(() => window.__ready);
if (only) {
  for (const t of only) { await page.evaluate((t) => window.render(t), t); await page.screenshot({ path: `${DIR}/preview/t${t.toFixed(1)}.jpg`, type: "jpeg", quality: 90 }); }
  console.log("aperçus :", only.join(", "));
} else {
  const n = Math.round(DURATION * FPS);
  const t0 = Date.now();
  for (let i = 0; i < n; i++) {
    await page.evaluate((t) => window.render(t), i / FPS);
    await page.screenshot({ path: `${frames}/f${String(i).padStart(4, "0")}.jpg`, type: "jpeg", quality: 95 });
    if (i % 150 === 0) console.log(`image ${i}/${n} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
  }
  console.log(`${n} images rendues en ${((Date.now() - t0) / 1000).toFixed(0)} s`);
}
await browser.close();
