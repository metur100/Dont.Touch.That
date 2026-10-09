/**
 * Renders the app icon, adaptive icon layers, splash icon and favicon as PNGs without any image
 * dependencies (supersampled vector shapes + a tiny zlib PNG encoder).
 *
 * Motif: the forbidden big red button, with a "!" on it, on the game's warm cream-to-pink background.
 *
 * Usage: node scripts/generate-icons.js
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const OUT = path.join(__dirname, '..', 'assets');
const BG_TOP = [255, 244, 224];
const BG_BOTTOM = [255, 205, 225];
const RED_LIGHT = [255, 98, 112];
const RED = [226, 30, 55];
const RED_DARK = [138, 15, 32];
const SHINE = [255, 170, 178];
const WHITE = [255, 255, 255];
const OUTLINE = [43, 27, 74];

// ---------- PNG encoding ----------
const CRC_TABLE = new Int32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c;
});
function crc32(buf) {
  let c = -1;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function writePng(file, size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  fs.writeFileSync(path.join(OUT, file), png);
  console.log(`wrote ${file} (${size}x${size})`);
}

// ---------- shapes (unit coordinates 0..1) ----------
const mix = (c1, c2, t) => [0, 1, 2].map((i) => Math.round(c1[i] + (c2[i] - c1[i]) * Math.max(0, Math.min(1, t))));
const inCircle = (x, y, cx, cy, r) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
const inEllipse = (x, y, cx, cy, rx, ry) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
/** Vertical capsule (rounded bar). */
function inCapsule(x, y, cx, top, bottom, halfW) {
  if (y >= top + halfW && y <= bottom - halfW) return Math.abs(x - cx) <= halfW;
  return inCircle(x, y, cx, top + halfW, halfW) || inCircle(x, y, cx, bottom - halfW, halfW);
}
function inRoundedSquare(x, y, radius) {
  const dx = Math.max(Math.abs(x - 0.5) - (0.5 - radius), 0);
  const dy = Math.max(Math.abs(y - 0.5) - (0.5 - radius), 0);
  return dx * dx + dy * dy <= radius * radius;
}

const R = 0.34; // button radius
const CY = 0.47; // button face center
const DEPTH = 0.06;
const BORDER = 0.022;

/** Returns 'bang' | 'shine' | 'face' | 'base' | 'outline' | null for a point in motif space. */
function motif(u, v) {
  if (inCapsule(u, v, 0.5, CY - 0.2, CY + 0.07, 0.042) || inCircle(u, v, 0.5, CY + 0.15, 0.045)) return 'bang';
  if (inEllipse(u, v, 0.34, CY - 0.19, 0.11, 0.055)) return 'shine';
  if (inCircle(u, v, 0.5, CY, R)) return 'face';
  if (inCircle(u, v, 0.5, CY + DEPTH, R)) return 'base';
  if (inCircle(u, v, 0.5, CY, R + BORDER) || inCircle(u, v, 0.5, CY + DEPTH, R + BORDER)) return 'outline';
  return null;
}

function colorFor(part, v) {
  switch (part) {
    case 'bang':
      return WHITE;
    case 'shine':
      return SHINE;
    case 'face':
      return mix(RED_LIGHT, RED, (v - (CY - R)) / (2 * R));
    case 'base':
      return RED_DARK;
    case 'outline':
      return OUTLINE;
    default:
      return null;
  }
}

function render(size, { scale, background = true, monochrome = false, rounded = false }) {
  const buf = Buffer.alloc(size * size * 4);
  const SS = 4;
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const x = (px + (sx + 0.5) / SS) / size;
          const y = (py + (sy + 0.5) / SS) / size;
          if (rounded && !inRoundedSquare(x, y, 0.2)) continue;
          const u = 0.5 + (x - 0.5) / scale;
          const v = 0.5 + (y - 0.5) / scale;
          const part = motif(u, v);
          let c;
          if (monochrome) c = part && part !== 'bang' ? WHITE : null;
          else c = colorFor(part, v) ?? (background ? mix(BG_TOP, BG_BOTTOM, y) : null);
          if (c) {
            r += c[0];
            g += c[1];
            b += c[2];
            a += 1;
          }
        }
      }
      const i = (py * size + px) * 4;
      buf[i] = a ? Math.round(r / a) : 0;
      buf[i + 1] = a ? Math.round(g / a) : 0;
      buf[i + 2] = a ? Math.round(b / a) : 0;
      buf[i + 3] = Math.round((a / (SS * SS)) * 255);
    }
  }
  return buf;
}

function solid(size, top, bottom) {
  const buf = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    const c = mix(top, bottom, y / size);
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      buf[i] = c[0];
      buf[i + 1] = c[1];
      buf[i + 2] = c[2];
      buf[i + 3] = 255;
    }
  }
  return buf;
}

fs.mkdirSync(OUT, { recursive: true });
writePng('icon.png', 1024, render(1024, { scale: 1 }));
// Adaptive icon: Android masks the outer ~third, so the motif is drawn smaller.
writePng('android-icon-foreground.png', 1024, render(1024, { scale: 0.66, background: false }));
writePng('android-icon-background.png', 1024, solid(1024, BG_TOP, BG_BOTTOM));
writePng('android-icon-monochrome.png', 1024, render(1024, { scale: 0.66, background: false, monochrome: true }));
writePng('splash-icon.png', 512, render(512, { scale: 1, background: false }));
writePng('favicon.png', 64, render(64, { scale: 1, rounded: true }));
