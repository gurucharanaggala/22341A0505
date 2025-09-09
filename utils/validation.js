export function isValidUrl(url) {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch { return false; }
}

export function isValidShortcode(code) {
  return /^[A-Za-z0-9]{3,12}$/.test(code);
}
