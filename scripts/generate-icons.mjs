// Generate ikon PWA (PNG) dari SVG brand — jalankan: node scripts/generate-icons.mjs
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

// Ikon brand: dompet di atas rounded square hijau emerald (token --primary ≈ oklch(0.51 0.1 168) ≈ #0f8a6d)
function brandSvg({ padded }) {
  // padded=true utk maskable (safe zone 80%)
  const inset = padded ? 108 : 0;
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
  <rect width="512" height="512" rx="${padded ? 0 : 96}" fill="#0f8a6d"/>
  <g transform="translate(${inset}, ${inset}) scale(${padded ? (512 - inset * 2) / 512 : 1})">
    <g transform="translate(96, 128)">
      <rect x="0" y="24" width="320" height="232" rx="36" fill="#ffffff"/>
      <path d="M36 24 L236 -34 a24 24 0 0 1 30 15 L272 24 Z" fill="#e9f6f1"/>
      <rect x="216" y="104" width="104" height="72" rx="20" fill="#0f8a6d"/>
      <circle cx="256" cy="140" r="16" fill="#f4b942"/>
    </g>
  </g>
</svg>`);
}

const OUT = "public/icons";
await mkdir(OUT, { recursive: true });

const jobs = [
  { file: `${OUT}/icon-192.png`, size: 192, padded: false },
  { file: `${OUT}/icon-512.png`, size: 512, padded: false },
  { file: `${OUT}/icon-maskable-192.png`, size: 192, padded: true },
  { file: `${OUT}/icon-maskable-512.png`, size: 512, padded: true },
  { file: `${OUT}/apple-touch-icon.png`, size: 180, padded: true },
];

for (const job of jobs) {
  await sharp(brandSvg({ padded: job.padded }))
    .resize(job.size, job.size)
    .png()
    .toFile(job.file);
  console.log("ok:", job.file);
}
