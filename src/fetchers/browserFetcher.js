const { chromium } = require("playwright");

async function browserFetcher(url) {
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(1000);
    return await page.content();
  } catch (error) {
    const reason = error && error.message ? `: ${error.message}` : "";
    const wrapped = new Error(`Browser fetch failed for ${url}${reason}`);
    wrapped.cause = error;
    wrapped.kind = "fetch";
    throw wrapped;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

module.exports = { browserFetcher };
