import { chromium } from "/Users/simon/dev/saturation/node_modules/playwright/index.mjs";
import { readFileSync } from "node:fs";

const BASE = process.env.BIDBOOK_URL ?? "http://localhost:4600";
const TOKEN = readFileSync("/tmp/northlight_token.txt", "utf8").trim();
const OUT = "/tmp/bidbook-shots";
import { mkdirSync } from "node:fs";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

page.on("console", (m) => {
  if (["error", "warning"].includes(m.type())) console.log(`[${m.type()}]`, m.text());
});
page.on("pageerror", (e) => console.log("[pageerror]", e.message));

await page.goto(BASE, { waitUntil: "networkidle" });
await page.screenshot({ path: `${OUT}/1-connect.png`, fullPage: true });

// Fill the token and connect.
const tokenInput = page.locator('input[type="password"], input[name="token"], input[placeholder*="token" i], input[placeholder*="key" i]').first();
await tokenInput.fill(TOKEN);
await page.screenshot({ path: `${OUT}/2-token-filled.png` });

// Click connect.
const connectBtn = page.locator('button:has-text("Connect"), button:has-text("Continue"), button[type="submit"]').first();
await connectBtn.click();

// Wait for the project picker.
await page.waitForTimeout(2500);
await page.screenshot({ path: `${OUT}/3-projects.png`, fullPage: true });

// Pick Space Ranger.
const proj = page.locator('text=Space Ranger').first();
if (await proj.count()) {
  await proj.click();
  await page.waitForTimeout(4000);
  await page.screenshot({ path: `${OUT}/4-bidbook-cover.png`, fullPage: false });
  // Scroll to the accounts section.
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight * 0.6, behavior: "instant" }));
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/5-bidbook-accounts.png` });
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${OUT}/6-bidbook-bottom.png` });
} else {
  console.log("Space Ranger not found on picker");
}

await browser.close();
console.log("done");
