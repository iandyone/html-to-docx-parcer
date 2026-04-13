const axios = require("axios");

async function staticFetcher(url) {
  try {
    const response = await axios.get(url, {
      timeout: 15000,
      responseType: "text",
      headers: {
        "User-Agent": "docx-from-html/1.0",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    return response.data;
  } catch (error) {
    const reason = error && error.message ? `: ${error.message}` : "";
    const wrapped = new Error(`Static fetch failed for ${url}${reason}`);
    wrapped.cause = error;
    wrapped.kind = "fetch";
    throw wrapped;
  }
}

module.exports = { staticFetcher };
