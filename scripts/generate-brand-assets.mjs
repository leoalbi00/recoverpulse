// Rigenera gli asset statici del marchio in public/brand/ dalla geometria
// in src/lib/brand.ts (fonte unica). Da rilanciare solo se il marchio cambia:
//   node scripts/generate-brand-assets.mjs
// Richiede Node >= 23.6 (type stripping nativo per importare il .ts).
import { writeFile } from "node:fs/promises";
import sharp from "sharp";

import { BRAND_NODE_COLOR, BRAND_SURFACE, buildBrandMarkSvg } from "../src/lib/brand.ts";

const OUT = new URL("../public/brand/", import.meta.url);

const svgs = {
  // Marchio trasparente per sfondi scuri / chiari.
  "omnirev-mark.svg": buildBrandMarkSvg({ size: 64 }),
  "omnirev-mark-light.svg": buildBrandMarkSvg({ size: 64, nodeColor: BRAND_NODE_COLOR.light }),
  // App icon con contenitore scuro arrotondato.
  "omnirev-app-icon.svg": buildBrandMarkSvg({ size: 512, background: BRAND_SURFACE }),
};

for (const [name, svg] of Object.entries(svgs)) {
  await writeFile(new URL(name, OUT), svg + "\n");
}

// PNG: le email non possono usare SVG (Gmail e Outlook li rimuovono).
// 56px = 28px a densità 2x.
const pngs = [
  { name: "omnirev-mark-email.png", size: 56, svg: buildBrandMarkSvg({ size: 56, background: BRAND_SURFACE, markScale: 0.78 }) },
  { name: "omnirev-app-icon-512.png", size: 512, svg: svgs["omnirev-app-icon.svg"] },
];

for (const { name, size, svg } of pngs) {
  await sharp(Buffer.from(svg), { density: Math.ceil((72 * size) / 32) })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toFile(new URL(name, OUT).pathname);
}

console.log("Asset del marchio rigenerati in public/brand/");
