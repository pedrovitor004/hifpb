const { chromium } = require("@playwright/test");
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on("pageerror", (e) => console.log("PAGE ERROR:", e.message));
  page.on("console", (m) => {
    if (m.type() === "error") console.log("CONSOLE:", m.text());
  });
  await page.goto("http://127.0.0.1:5173/");
  await page.waitForTimeout(2500);
  console.log((await page.locator("body").innerText()).slice(0, 4000));
  await browser.close();
})();
