function timestamp() {
  const now = new Date();
  const y = String(now.getFullYear());
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const h = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  const s = String(now.getSeconds()).padStart(2, "0");
  return `${y}${m}${d}-${h}${min}${s}`;
}

function sanitizeBaseName(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

function buildBaseName(url, customBaseName) {
  if (customBaseName) {
    return sanitizeBaseName(customBaseName) || `extract-${timestamp()}`;
  }

  let hostname = "page";
  try {
    const parsed = new URL(url);
    hostname = parsed.hostname || "page";
  } catch (_error) {
    hostname = "page";
  }

  return `${sanitizeBaseName(hostname)}-${timestamp()}`;
}

module.exports = { buildBaseName };
