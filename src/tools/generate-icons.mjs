/**
 * Génère les icônes PWA (PNG) et le favicon à partir de la marque Rebond,
 * sans dépendance : rastérisation maison + encodeur PNG (zlib de Node).
 *
 *   node src/tools/generate-icons.mjs
 */
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const BG = [11, 11, 13];
const ACCENT = [255, 122, 26];
const INK = [26, 13, 4];
const FG = [244, 241, 236];

const crcTable = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function encodePng(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0;
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // profondeur
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/** Couleur d'un point (coordonnées normalisées 0..1) ou null si transparent. */
function sample(u, v, { maskable }) {
  // fond : carré arrondi (ou plein cadre pour l'icône maskable)
  const radius = maskable ? 0 : 0.22;
  const inside = maskable || roundedRect(u, v, radius);
  if (!inside) return null;
  let color = BG;

  // sol
  const groundY = maskable ? 0.74 : 0.78;
  if (Math.abs(v - groundY) < 0.012 && u > 0.14 && u < 0.86) color = mix(BG, FG, 0.35);

  // trajectoire en pointillés : parabole du point d'impact (0.2, groundY) vers le ballon
  const bx = maskable ? 0.64 : 0.66;
  const by = maskable ? 0.36 : 0.33;
  const t = (u - 0.2) / (bx - 0.2);
  if (t > 0 && t < 1) {
    const curveY = groundY - (groundY - by) * (1 - (1 - t) * (1 - t));
    const dash = Math.floor(t * 9) % 2 === 0;
    if (Math.abs(v - curveY) < 0.014 && dash) color = ACCENT;
  }
  // point d'impact
  if (dist(u, v, 0.2, groundY) < 0.03) color = ACCENT;

  // ballon
  const r = maskable ? 0.17 : 0.2;
  const d = dist(u, v, bx, by);
  if (d < r) {
    color = ACCENT;
    const w = r * 0.085;
    // coutures : une verticale, une horizontale, deux arcs
    if (Math.abs(u - bx) < w || Math.abs(v - by) < w) color = mix(ACCENT, INK, 0.75);
    const a1 = Math.abs(dist(u, v, bx - r * 1.35, by) - r * 1.25) < w;
    const a2 = Math.abs(dist(u, v, bx + r * 1.35, by) - r * 1.25) < w;
    if (a1 || a2) color = mix(ACCENT, INK, 0.75);
  }
  return color;
}

function roundedRect(u, v, r) {
  const x = Math.max(0, Math.abs(u - 0.5) - (0.5 - r));
  const y = Math.max(0, Math.abs(v - 0.5) - (0.5 - r));
  return x * x + y * y <= r * r;
}
function dist(a, b, c, d) {
  return Math.hypot(a - c, b - d);
}
function mix(a, b, t) {
  return a.map((c, i) => c + (b[i] - c) * t);
}

function render(size, opts) {
  const SS = 4; // sur-échantillonnage pour l'anticrénelage
  const out = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const c = sample((x + (sx + 0.5) / SS) / size, (y + (sy + 0.5) / SS) / size, opts);
          if (c) {
            r += c[0];
            g += c[1];
            b += c[2];
            a += 1;
          }
        }
      }
      const i = (y * size + x) * 4;
      if (a > 0) {
        out[i] = Math.round(r / a);
        out[i + 1] = Math.round(g / a);
        out[i + 2] = Math.round(b / a);
        out[i + 3] = Math.round((a / (SS * SS)) * 255);
      }
    }
  }
  return encodePng(size, size, out);
}

function ico(png, size) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  const entry = Buffer.alloc(16);
  entry[0] = size >= 256 ? 0 : size;
  entry[1] = size >= 256 ? 0 : size;
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(22, 12);
  return Buffer.concat([header, entry, png]);
}

const root = process.cwd();
mkdirSync(path.join(root, "public/icons"), { recursive: true });
writeFileSync(path.join(root, "public/icons/icon-192.png"), render(192, { maskable: false }));
writeFileSync(path.join(root, "public/icons/icon-512.png"), render(512, { maskable: false }));
writeFileSync(path.join(root, "public/icons/maskable-512.png"), render(512, { maskable: true }));
writeFileSync(path.join(root, "app/apple-icon.png"), render(180, { maskable: true }));
writeFileSync(path.join(root, "app/favicon.ico"), ico(render(48, { maskable: false }), 48));
console.log("Icônes générées : public/icons/*.png, app/apple-icon.png, app/favicon.ico");
