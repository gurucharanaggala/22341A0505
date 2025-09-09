import fetch from "node-fetch";

let config = { endpoint: "http://20.244.56.144/evaluation-service/logs", authToken: null };

export function initLogger(cfg = {}) {
  config = { ...config, ...cfg };
}

export async function Log(stack, level, packageName, message) {
  const stacks = ["backend", "frontend"];
  const levels = ["debug", "info", "warn", "error", "fatal"];
  const backendPackages = ["cache", "controller", "cron_job", "db", "domain", "handler", "repository", "route", "service"];
  const shared = ["auth", "config", "middleware", "utils"];
  const allowedPackages = [...backendPackages, ...shared];

  const s = (stack || "").toLowerCase();
  const l = (level || "").toLowerCase();
  const p = (packageName || "").toLowerCase();

  if (!stacks.includes(s) || !levels.includes(l) || !allowedPackages.includes(p)) return;

  const body = { stack: s, level: l, package: p, message: String(message || "") };

  try {
    await fetch(config.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(config.authToken ? { Authorization: config.authToken } : {})
      },
      body: JSON.stringify(body)
    });
  } catch (err) {
    console.error("Logging failed:", err.message);
  }
}

export default Log;
