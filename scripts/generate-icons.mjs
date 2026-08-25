// Generates the PWA icon PNGs in public/icons/ from scratch (no image deps).
// Re-run with `node scripts/generate-icons.mjs` if the brand color/mark changes.
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'public', 'icons');
mkdirSync(OUT_DIR, { recursive: true });

const ACCENT = [37, 99, 235]; // --color-accent
const WHITE = [255, 255, 255];

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePNG(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (width * 4 + 1);
    raw[rowStart] = 0; // filter: none
    rgba.copy(raw, rowStart + 1, y * width * 4, (y + 1) * width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const idat = deflateSync(raw, { level: 9 });
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([signature, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

// --- shape helpers, all operating on a supersampled float canvas ---

function sdRoundRect(px, py, cx, cy, halfW, halfH, radius) {
  const qx = Math.abs(px - cx) - halfW + radius;
  const qy = Math.abs(py - cy) - halfH + radius;
  const outsideX = Math.max(qx, 0);
  const outsideY = Math.max(qy, 0);
  return Math.sqrt(outsideX * outsideX + outsideY * outsideY) + Math.min(Math.max(qx, qy), 0) - radius;
}

function coverage(dist) {
  // ~1px antialiasing band around the shape edge, in supersampled units
  return Math.max(0, Math.min(1, 0.5 - dist));
}

function makeIcon({ size, maskable }) {
  const SS = 4; // supersample factor
  const S = size * SS;
  const px = new Float64Array(S * S * 4); // premultiplied-ish accumulation buffer (0..1 per channel+alpha)

  const bg = maskable ? ACCENT : null;
  const cx = S / 2;
  const cy = S / 2;

  // background
  const bgRadius = maskable ? 0 : S * 0.22;
  const bgHalf = maskable ? S / 2 : S * 0.46;
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const i = (y * S + x) * 4;
      if (bg) {
        px[i] = bg[0];
        px[i + 1] = bg[1];
        px[i + 2] = bg[2];
        px[i + 3] = 255;
      } else {
        const d = sdRoundRect(x + 0.5, y + 0.5, cx, cy, bgHalf, bgHalf, bgRadius);
        const a = coverage(d);
        px[i] = ACCENT[0];
        px[i + 1] = ACCENT[1];
        px[i + 2] = ACCENT[2];
        px[i + 3] = a * 255;
      }
    }
  }

  // "card stack" glyph: two overlapping rounded rectangles in white, safe zone
  // for maskable = inner 80% circle; for plain icon, generous padding.
  const glyphScale = maskable ? 0.30 : 0.30;
  const cardW = S * glyphScale;
  const cardH = cardW * 1.32;
  const cardRadius = cardW * 0.14;
  const offset = S * 0.065;

  function blendRoundRect(offX, offY, alphaMul) {
    const rcx = cx + offX;
    const rcy = cy + offY;
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        const d = sdRoundRect(x + 0.5, y + 0.5, rcx, rcy, cardW / 2, cardH / 2, cardRadius);
        const a = coverage(d) * alphaMul;
        if (a <= 0) continue;
        const i = (y * S + x) * 4;
        // simple source-over blend of white onto existing buffer
        px[i] = WHITE[0] * a + px[i] * (1 - a);
        px[i + 1] = WHITE[1] * a + px[i + 1] * (1 - a);
        px[i + 2] = WHITE[2] * a + px[i + 2] * (1 - a);
        px[i + 3] = 255 * a + px[i + 3] * (1 - a);
      }
    }
  }

  blendRoundRect(-offset, offset, 0.55);
  blendRoundRect(offset, -offset, 1);

  // downsample SS x SS -> size x size (box filter)
  const out = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const i = ((y * SS + sy) * S + (x * SS + sx)) * 4;
          r += px[i];
          g += px[i + 1];
          b += px[i + 2];
          a += px[i + 3];
        }
      }
      const n = SS * SS;
      const o = (y * size + x) * 4;
      out[o] = Math.round(r / n);
      out[o + 1] = Math.round(g / n);
      out[o + 2] = Math.round(b / n);
      out[o + 3] = Math.round(a / n);
    }
  }
  return out;
}

for (const { name, size, maskable } of [
  { name: 'icon-192.png', size: 192, maskable: false },
  { name: 'icon-512.png', size: 512, maskable: false },
  { name: 'icon-512-maskable.png', size: 512, maskable: true },
]) {
  const rgba = makeIcon({ size, maskable });
  const png = encodePNG(size, size, rgba);
  writeFileSync(join(OUT_DIR, name), png);
  console.log(`wrote ${name} (${png.length} bytes)`);
}
