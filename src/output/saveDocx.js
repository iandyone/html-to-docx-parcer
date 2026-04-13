const path = require("path");
const fs = require("fs-extra");
const { Document, Packer, Paragraph } = require("docx");

async function saveDocx(baseName, textContent) {
  const docsDir = path.resolve(process.cwd(), "docs");
  const docxPath = path.join(docsDir, `${baseName}.docx`);
  await fs.ensureDir(docsDir);

  const lines = textContent ? textContent.split("\n") : [];
  const paragraphs =
    lines.length > 0
      ? lines.map((line) => new Paragraph({ text: line }))
      : [new Paragraph({ text: "" })];

  const doc = new Document({
    sections: [{ children: paragraphs }],
  });

  const buffer = await Packer.toBuffer(doc);
  await fs.writeFile(docxPath, buffer);
  return docxPath;
}

module.exports = { saveDocx };
