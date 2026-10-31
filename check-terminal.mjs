import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto("http://127.0.0.1:4399/terminal", { waitUntil: "load", timeout: 20000 });
await page.waitForTimeout(1500);

await page.click(".xterm");
await page.keyboard.type("sleep 30 && echo DONE-SHOULD-NOT-APPEAR");
await page.keyboard.press("Enter");
await page.waitForTimeout(800);
await page.click("#term-sigint");
await page.waitForTimeout(800);
await page.keyboard.type("echo AFTER-CTRLC");
await page.keyboard.press("Enter");
await page.waitForTimeout(800);
await page.screenshot({ path: "/tmp/claude-1001/-home-ubuntu-dev/b880d317-e08f-4b3b-ab1d-86e08bea4108/scratchpad/terminal-3.png" });

await browser.close();
