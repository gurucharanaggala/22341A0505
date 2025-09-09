import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import Log, { initLogger } from "./logging/logMiddleware.js";
import { isValidUrl, isValidShortcode } from "./utils/validation.js";
import { generateShortcode, saveUrl, getUrl, addClick, getStats } from "./utils/storage.js";

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

initLogger({ authToken: "Bearer YOUR_CLIENT_TOKEN" }); // replace with your token

// Create Short URL
app.post("/shorturls", async (req, res) => {
  try {
    const { url, validity, shortcode } = req.body;

    if (!url || !isValidUrl(url)) {
      await Log("backend", "error", "handler", `Invalid URL: ${url}`);
      return res.status(400).json({ error: "Invalid URL format" });
    }

    let code = shortcode ? shortcode.trim() : generateShortcode();
    if (shortcode) {
      if (!isValidShortcode(shortcode)) {
        await Log("backend", "warn", "handler", `Invalid shortcode: ${shortcode}`);
        return res.status(400).json({ error: "Invalid shortcode" });
      }
      if (getUrl(code)) {
        await Log("backend", "warn", "handler", `Shortcode already exists: ${shortcode}`);
        return res.status(409).json({ error: "Shortcode already exists" });
      }
    }

    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + ((validity || 30) * 60000));

    const mapping = { originalUrl: url, shortcode: code, createdAt, expiresAt, clicks: [] };
    saveUrl(mapping);
    await Log("backend", "info", "service", `Created shortcode: ${code} for URL: ${url}`);

    return res.status(201).json({
      shortLink: `${req.protocol}://${req.get("host")}/${code}`,
      expiry: expiresAt.toISOString()
    });
  } catch (err) {
    await Log("backend", "fatal", "service", `Unexpected error: ${err.message}`);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Retrieve Stats
app.get("/shorturls/:shortcode", async (req, res) => {
  const { shortcode } = req.params;
  const mapping = getStats(shortcode);

  if (!mapping) {
    await Log("backend", "warn", "handler", `Shortcode not found: ${shortcode}`);
    return res.status(404).json({ error: "Shortcode not found" });
  }

  return res.json({
    originalUrl: mapping.originalUrl,
    createdAt: mapping.createdAt,
    expiresAt: mapping.expiresAt,
    totalClicks: mapping.clicks.length,
    clicks: mapping.clicks
  });
});

// Redirect to original URL
app.get("/:shortcode", async (req, res) => {
  const { shortcode } = req.params;
  const mapping = getUrl(shortcode);

  if (!mapping) {
    await Log("backend", "warn", "handler", `Redirect failed: shortcode ${shortcode} not found`);
    return res.status(404).json({ error: "Shortcode not found" });
  }

  const now = new Date();
  if (new Date(mapping.expiresAt) < now) {
    await Log("backend", "warn", "handler", `Redirect failed: shortcode ${shortcode} expired`);
    return res.status(410).json({ error: "Shortcode expired" });
  }

  addClick(shortcode, {
    timestamp: now.toISOString(),
    source: req.headers.referer || "direct",
    location: "unknown"
  });
  await Log("backend", "info", "handler", `Redirecting shortcode ${shortcode} -> ${mapping.originalUrl}`);
  res.redirect(mapping.originalUrl);
});

app.listen(PORT, () => {
  console.log(`URL Shortener backend running on http://localhost:${PORT}`);
});
