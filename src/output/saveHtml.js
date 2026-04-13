const path = require("path");
const fs = require("fs-extra");

async function saveHtml(baseName, outerHtml) {
  const htmlDir = path.resolve(process.cwd(), "html");
  const htmlPath = path.join(htmlDir, `${baseName}.html`);
  await fs.ensureDir(htmlDir);
  await fs.writeFile(htmlPath, outerHtml, "utf8");
  return htmlPath;
}

module.exports = { saveHtml };
