const cheerio = require("cheerio");

class SelectorNotFoundError extends Error {
  constructor(selector) {
    super(`Selector not found: ${selector}`);
    this.name = "SelectorNotFoundError";
    this.kind = "selector_not_found";
  }
}

function normalizeText(rawText) {
  return rawText
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

function extractBySelector(html, selector) {
  const $ = cheerio.load(html);
  const element = $(selector).first();

  if (!element || element.length === 0) {
    throw new SelectorNotFoundError(selector);
  }

  return {
    outerHtml: $.html(element),
    text: normalizeText(element.text()),
  };
}

module.exports = {
  SelectorNotFoundError,
  extractBySelector,
};
