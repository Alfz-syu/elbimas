// Verifikasi visual: screenshot halaman kunci di 3 viewport + cek SW & console error.
// Jalankan: node scripts/visual-check.mjs  (server produksi harus jalan di :3000)
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const BASE = "http://localhost:3000";
const OUT = "screenshots";
await mkdir(OUT, { recursive: true });

const viewports = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1366, height: 900 },
];

const browser = await chromium.launch();
const errors = [];

// ---- Halaman publik (tanpa login) ----
for (const vp of viewports) {
  const ctx = await browser.newContext({ viewport: vp });
  const page = await ctx.newPage();
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`[landing/${vp.name}] ${msg.text()}`);
  });
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.screenshot({ path: `${OUT}/landing-${vp.name}.png`, fullPage: true });
  await ctx.close();
}

// ---- Login + dashboard ----
const ctx = await browser.newContext({ viewport: viewports[2] });
const page = await ctx.newPage();
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(`[app] ${msg.text()}`);
});
await page.goto(`${BASE}/login`);
await page.fill("#email", "tester-debts@elbimas.test");
await page.fill("#password", "RahasiaKuat123");
await page.click('button[type="submit"]');
await page.waitForURL("**/dashboard**", { timeout: 20000 });
await page.waitForLoadState("networkidle");
await page.screenshot({ path: `${OUT}/dashboard-desktop.png`, fullPage: true });

// Cek registrasi service worker (production build)
const swState = await page.evaluate(async () => {
  if (!("serviceWorker" in navigator)) return "unsupported";
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return "not-registered";
  return reg.active ? "active" : reg.installing ? "installing" : "waiting";
});
console.log("service-worker:", swState);

// Dashboard mobile
await page.setViewportSize({ width: 375, height: 812 });
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/dashboard-mobile.png`, fullPage: true });

// Halaman recurring & settings (desktop)
await page.setViewportSize({ width: 1366, height: 900 });
for (const p of ["recurring", "debts", "settings"]) {
  await page.goto(`${BASE}/${p}`, { waitUntil: "networkidle" });
  await page.screenshot({ path: `${OUT}/${p}-desktop.png`, fullPage: true });
}

await browser.close();

console.log("console-errors:", errors.length === 0 ? "none" : "");
for (const e of errors) console.log("  -", e);
console.log("done — screenshots di ./screenshots/");
