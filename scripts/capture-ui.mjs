import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.MOONSHOT_URL ?? "http://127.0.0.1:5175";
const outputDir = resolve("visual-review");
const viewports = [
  ["desktop", 1440, 1000],
  ["tablet", 1024, 768],
  ["mobile", 390, 844],
];

await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
try {
  for (const [name, width, height] of viewports) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    await page.goto(`${baseUrl}/app`, { waitUntil: "networkidle" });

    if (await page.getByLabel("Email").isVisible().catch(() => false)) {
      await page.getByLabel("Email").fill("design@moonshot.test");
      await page.getByLabel("Password").fill("moonshot");
      await page.locator("form").getByRole("button", { name: /sign in/i }).click();
      await page.waitForURL(/\/app$/, { timeout: 10_000 });
    }

    await page.waitForTimeout(500);
    await page.screenshot({ path: resolve(outputDir, `dashboard-${name}.png`), fullPage: true });
    await page.close();
  }
} finally {
  await browser.close();
}

console.log(`Visual review screenshots written to ${outputDir}`);
