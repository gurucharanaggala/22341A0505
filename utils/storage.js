import { v4 as uuidv4 } from "uuid";

let urlStore = {}; // { shortcode: { originalUrl, createdAt, expiresAt, clicks: [] } }

export function generateShortcode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let code;
  do {
    code = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  } while (urlStore[code]);
  return code;
}

export function saveUrl(mapping) {
  urlStore[mapping.shortcode] = mapping;
}

export function getUrl(shortcode) {
  return urlStore[shortcode];
}

export function addClick(shortcode, click) {
  if (!urlStore[shortcode]) return false;
  urlStore[shortcode].clicks.push(click);
  return true;
}

export function getStats(shortcode) {
  return urlStore[shortcode];
}
