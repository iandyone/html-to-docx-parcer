if (typeof globalThis.File === "undefined") {
  globalThis.File = class File {};
}

const { Command } = require("commander");
const readline = require("readline");
const { staticFetcher } = require("./fetchers/staticFetcher");
const { browserFetcher } = require("./fetchers/browserFetcher");
const {
  SelectorNotFoundError,
  extractBySelector,
} = require("./extract/selectorExtractor");
const { saveHtml } = require("./output/saveHtml");
const { saveDocx } = require("./output/saveDocx");
const { buildBaseName } = require("./utils/fileNames");

const EXIT_CODES = {
  OK: 0,
  VALIDATION: 1,
  NETWORK: 2,
  SELECTOR_NOT_FOUND: 3,
  OUTPUT: 4,
};
const DEFAULT_SELECTOR = ".document-content__text";

function parseArgs() {
  const program = new Command();
  program
    .name("docx-from-html")
    .description("Extract HTML node by selector and export text to DOCX")
    .option("--url <url>", "Page URL")
    .option("--selector <selector>", "CSS selector")
    .option("--base-name <name>", "Custom output filename base");

  program.parse(process.argv);
  return program.opts();
}

function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

function validateUrl(urlValue) {
  if (!urlValue || !urlValue.trim()) {
    const error = new Error("URL is required.");
    error.kind = "validation";
    throw error;
  }

  try {
    const parsed = new URL(urlValue);
    if (!parsed.protocol.startsWith("http")) {
      throw new Error("Only http/https protocols are supported.");
    }
  } catch (_error) {
    const error = new Error(`Invalid URL: ${urlValue}`);
    error.kind = "validation";
    throw error;
  }
}

async function resolveInput(options) {
  let url = options.url;
  let selector = options.selector;

  if (!url) {
    const answer = await prompt("URL: ");
    url = answer.trim();
  }

  if (!selector) {
    const answer = await prompt(
      `CSS selector (${DEFAULT_SELECTOR}): `
    );
    selector = answer.trim() || DEFAULT_SELECTOR;
  } else {
    selector = selector.trim() || DEFAULT_SELECTOR;
  }

  validateUrl(url);

  if (!selector) {
    const error = new Error("Selector is required.");
    error.kind = "validation";
    throw error;
  }

  return { url, selector, customBaseName: options.baseName };
}

function isLikelyHtml(html) {
  if (typeof html !== "string") {
    return false;
  }

  const trimmed = html.trim().toLowerCase();
  return (
    trimmed.startsWith("<!doctype html") ||
    trimmed.includes("<html") ||
    trimmed.includes("<body") ||
    trimmed.startsWith("<")
  );
}

function withContext(error, source) {
  error.source = source;
  return error;
}

async function resolveExtraction(url, selector) {
  let staticError;
  let staticSelectorMiss;

  try {
    const staticHtml = await staticFetcher(url);
    if (isLikelyHtml(staticHtml)) {
      try {
        const extracted = extractBySelector(staticHtml, selector);
        return { ...extracted, source: "static" };
      } catch (error) {
        if (error instanceof SelectorNotFoundError) {
          staticSelectorMiss = error;
        } else {
          throw error;
        }
      }
    }
  } catch (error) {
    staticError = withContext(error, "static");
  }

  try {
    const browserHtml = await browserFetcher(url);
    const extracted = extractBySelector(browserHtml, selector);
    return { ...extracted, source: "browser" };
  } catch (error) {
    if (error instanceof SelectorNotFoundError) {
      throw error;
    }

    if (staticSelectorMiss) {
      const wrapped = new Error(
        "Selector was not found in static HTML and browser fallback did not complete"
      );
      wrapped.kind = "fetch";
      wrapped.staticSelectorMiss = staticSelectorMiss;
      wrapped.browserError = withContext(error, "browser");
      throw wrapped;
    }

    if (staticError) {
      const wrapped = new Error("Unable to fetch page with static and browser modes");
      wrapped.kind = "fetch";
      wrapped.staticError = staticError;
      wrapped.browserError = withContext(error, "browser");
      throw wrapped;
    }

    throw withContext(error, "browser");
  }
}

async function main() {
  try {
    const options = parseArgs();
    const { url, selector, customBaseName } = await resolveInput(options);
    const baseName = buildBaseName(url, customBaseName);

    const { outerHtml, text, source } = await resolveExtraction(url, selector);
    const htmlPath = await saveHtml(baseName, outerHtml);
    const docxPath = await saveDocx(baseName, text);

    console.log(`Completed using ${source} mode.`);
    console.log(`HTML saved to: ${htmlPath}`);
    console.log(`DOCX saved to: ${docxPath}`);
    process.exit(EXIT_CODES.OK);
  } catch (error) {
    if (error instanceof SelectorNotFoundError) {
      console.error(error.message);
      process.exit(EXIT_CODES.SELECTOR_NOT_FOUND);
    }

    if (error.kind === "fetch") {
      console.error("Network/fetch failure while loading page.");
      if (error.staticError || error.browserError) {
        if (error.staticError) {
          console.error(`- static: ${error.staticError.message}`);
        }
        if (error.staticSelectorMiss) {
          console.error(`- static: ${error.staticSelectorMiss.message}`);
        }
        if (error.browserError) {
          console.error(`- browser: ${error.browserError.message}`);
        }
      } else {
        console.error(error.message);
      }
      process.exit(EXIT_CODES.NETWORK);
    }

    if (error.kind === "validation") {
      console.error(`Validation error: ${error.message}`);
      process.exit(EXIT_CODES.VALIDATION);
    }

    if (error.code === "ENOENT" || error.code === "EACCES") {
      console.error(`Output error: ${error.message}`);
      process.exit(EXIT_CODES.OUTPUT);
    }

    if (error.name === "CommanderError") {
      process.exit(EXIT_CODES.VALIDATION);
    }

    console.error(`Unexpected error: ${error.message}`);
    process.exit(EXIT_CODES.OUTPUT);
  }
}

main();
