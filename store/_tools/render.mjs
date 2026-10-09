/**
 * Renders all store images from the raw emulator captures (see capture-all.sh):
 *   store/raw/phone/  1080×1920 → Google Play      store/raw/tall/  1080×2346 → App Store (iPhone proportions)
 *   play-store/graphics/icon-512.png               512 × 512
 *   play-store/graphics/feature-graphic.png        1024 × 500 (no alpha)
 *   play-store/screenshots/phone/NN.png            1080 × 1920
 *   app-store/screenshots/iphone-6.9/NN.png        1320 × 2868 (+ 6.5" 1284 × 2778, 6.3" 1206 × 2622)
 * Uses headless Microsoft Edge for layout and ffmpeg for exact sizing.
 * Usage: node store/_tools/render.mjs
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { CAPTIONS } from './content.mjs';

const STORE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ROOT = path.resolve(STORE, '..');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'dtt-store-'));
const font = (pkg, file) => pathToFileURL(path.join(ROOT, 'node_modules', '@expo-google-fonts', pkg, file)).href;
const ICON = pathToFileURL(path.join(ROOT, 'assets', 'icon.png')).href;
// Android status bar / gesture bar in the raw captures (1080×1920 at density 400).
const STATUS_BAR = 100;
const NAV_BAR = 56;

function findFont(pkg, name) {
  const dir = path.join(ROOT, 'node_modules', '@expo-google-fonts', pkg);
  const hit = fs.readdirSync(dir, { recursive: true }).find((f) => String(f).endsWith(name));
  if (!hit) throw new Error(`font ${name} not found in ${pkg}`);
  return font(pkg, String(hit));
}

const CSS = `
@font-face { font-family: Lilita; src: url('${findFont('lilita-one', 'LilitaOne_400Regular.ttf')}'); }
@font-face { font-family: Nunito; src: url('${findFont('nunito', 'Nunito_900Black.ttf')}'); font-weight: 900; }
* { margin: 0; box-sizing: border-box; }
html, body { width: 100%; height: 100%; overflow: hidden; }
body { position: relative; color: #2B1B4A; font-family: Nunito, sans-serif; font-weight: 900;
  background: radial-gradient(70% 45% at 85% 4%, rgba(123, 92, 255, .22) 0%, transparent 70%),
              radial-gradient(60% 40% at 0% 100%, rgba(255, 77, 94, .22) 0%, transparent 70%),
              linear-gradient(175deg, #FFF4E0 0%, #FFD3E3 100%); }
.dots { position: absolute; inset: 0; background-image: radial-gradient(rgba(43, 27, 74, .9) 2.2px, transparent 3px); background-size: 64px 64px; opacity: .06; }
h1 { font-family: Lilita, sans-serif; font-weight: 400; line-height: 1.02; text-shadow: 0 6px 0 rgba(43,27,74,.12); }
.sub { color: #FF4D5E; }
.frame { position: absolute; left: 50%; transform: translateX(-50%); background: #2B1B4A; box-shadow: 0 50px 100px rgba(43, 27, 74, .35); }
.frame img { display: block; width: 100%; }
.deco { position: absolute; font-size: 90px; opacity: .9; }
`;

function render(html, width, height, out, scale = 1) {
  const name = path.basename(out, '.png') + '-' + path.basename(path.dirname(out));
  const file = path.join(TMP, `${name}.html`);
  const raw = path.join(TMP, `${name}.raw.png`);
  fs.writeFileSync(file, html);
  for (let attempt = 1; ; attempt++) {
    try {
      execFileSync(EDGE, [
        '--headless=new', `--user-data-dir=${path.join(TMP, `profile-${name}-${attempt}`)}`, '--no-first-run', '--disable-gpu',
        '--hide-scrollbars', `--force-device-scale-factor=${scale}`, `--window-size=${Math.ceil(width / scale)},${Math.ceil(height / scale)}`,
        `--screenshot=${raw}`, pathToFileURL(file).href,
      ], { stdio: 'ignore', timeout: 90000 });
      break;
    } catch (error) {
      if (attempt >= 3) throw error;
    }
  }
  fs.mkdirSync(path.dirname(out), { recursive: true });
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', raw, '-vf', `scale=${width}:${height}:force_original_aspect_ratio=increase:flags=lanczos,crop=${width}:${height}:0:0`, '-pix_fmt', 'rgb24', out]);
}

/** Crops the Android status + gesture bars; returns the file URL and the cropped aspect (h / w). */
function cropBars(src, set, rawH) {
  const out = path.join(TMP, `crop-${set}-${path.basename(src)}`);
  const h = rawH - STATUS_BAR - NAV_BAR;
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', src, '-vf', `crop=1080:${h}:0:${STATUS_BAR}`, out]);
  return { url: pathToFileURL(out).href, aspect: h / 1080 };
}

/** Caption on top, the game screen in a rounded device frame below. Sizes are in output pixels. */
function screenshot({ url: img, aspect }, [title, sub], w, h) {
  const u = w / 1080;
  const top = Math.round(h * 0.2);
  const pad = Math.round(16 * u);
  // As large as fits between the caption and the bottom margin, at most 84% of the width.
  const frameW = Math.round(Math.min(w * 0.84, (h - top - h * 0.035 - 2 * pad) / aspect + 2 * pad));
  return `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}
  .cap { position: absolute; left: 0; right: 0; top: ${Math.round(h * 0.045)}px; text-align: center; padding: 0 ${Math.round(60 * u)}px; }
  h1 { font-size: ${Math.round(96 * u)}px; } .sub { font-size: ${Math.round(46 * u)}px; margin-top: ${Math.round(14 * u)}px; }
  .frame { top: ${top}px; width: ${frameW}px; padding: ${pad}px; border-radius: ${Math.round(72 * u)}px; }
  .frame img { border-radius: ${Math.round(58 * u)}px; }
  </style></head><body><div class="dots"></div>
  <div class="cap"><h1>${title}</h1><div class="sub">${sub}</div></div>
  <div class="frame"><img src="${img}"></div></body></html>`;
}

function featureGraphic(shot) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}
  .row { position: absolute; inset: 0; display: flex; align-items: center; padding: 0 0 0 64px; gap: 40px; }
  .icon { width: 150px; border-radius: 34px; box-shadow: 0 16px 36px rgba(43,27,74,.3); }
  h1 { font-size: 86px; margin-top: 14px; } .sub { font-size: 30px; margin-top: 8px; }
  .copy { flex: 1; }
  .ph { position: relative; width: 300px; height: 500px; overflow: hidden; }
  .ph .frame { top: 40px; width: 270px; padding: 9px; border-radius: 38px; transform: translateX(-50%) rotate(6deg); }
  .ph .frame img { border-radius: 30px; }
  </style></head><body><div class="dots"></div><div class="row">
  <div class="copy"><img class="icon" src="${ICON}"><h1>Don't Touch That!</h1><div class="sub">100 levels. One rule. You will break it.</div></div>
  <div class="ph"><div class="frame"><img src="${shot.url}"></div></div></div></body></html>`;
}

// ---------- Run ----------
const rawDir = (set) => path.join(STORE, 'raw', set);
const shots = fs.readdirSync(rawDir('phone')).filter((f) => /^\d\d-.*\.png$/.test(f)).sort();
if (shots.length !== CAPTIONS.length) throw new Error(`expected ${CAPTIONS.length} raw shots, found ${shots.length}`);

const cropped = shots.map((f) => cropBars(path.join(rawDir('phone'), f), 'phone', 1920));
const tall = shots.map((f) => cropBars(path.join(rawDir('tall'), f), 'tall', 2346));
shots.forEach((file, i) => {
  const name = `${String(i + 1).padStart(2, '0')}.png`;
  render(screenshot(cropped[i], CAPTIONS[i], 1080, 1920), 1080, 1920, path.join(STORE, 'play-store', 'screenshots', 'phone', name));
  render(screenshot(tall[i], CAPTIONS[i], 1320, 2868), 1320, 2868, path.join(STORE, 'app-store', 'screenshots', 'iphone-6.9', name));
  for (const [dir, w, h] of [['iphone-6.5', 1284, 2778], ['iphone-6.3', 1206, 2622]]) {
    const out = path.join(STORE, 'app-store', 'screenshots', dir, name);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', path.join(STORE, 'app-store', 'screenshots', 'iphone-6.9', name), '-vf', `scale=${w}:${h}:flags=lanczos`, '-pix_fmt', 'rgb24', out]);
  }
  console.log('rendered', name, CAPTIONS[i][0]);
});

render(featureGraphic(cropped[1]), 1024, 500, path.join(STORE, 'play-store', 'graphics', 'feature-graphic.png'));
fs.mkdirSync(path.join(STORE, 'play-store', 'graphics'), { recursive: true });
execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', path.join(ROOT, 'assets', 'icon.png'), '-vf', 'scale=512:512:flags=lanczos', path.join(STORE, 'play-store', 'graphics', 'icon-512.png')]);
console.log('rendered feature graphic + icon');
fs.rmSync(TMP, { recursive: true, force: true });
