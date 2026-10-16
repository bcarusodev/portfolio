import { createHash } from "node:crypto";
import type { NextApiRequest } from "next";

/**
 * Trustworthy client-IP resolution (spec R1).
 *
 * The `x-forwarded-for` header is client-controlled, so trusting it
 * unconditionally lets an abuser rotate forged entries and hop between
 * rate-limit buckets. Vercel's edge rewrites the header for every request,
 * so the leftmost entry is trusted ONLY when the `VERCEL` env marker is
 * set; everywhere else (local dev, bare Node) the header is ignored and
 * the socket peer address is used.
 */
export function getClientIp(req: NextApiRequest): string {
  if (process.env.VERCEL === "1") {
    const forwarded = req.headers["x-forwarded-for"];
    const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    const first = raw
      ?.split(",")
      .map((entry) => entry.trim())
      .find((entry) => entry.length > 0);
    if (first) return first;
  }
  return req.socket.remoteAddress || "unknown";
}

/**
 * sha256(ip) → first 16 hex chars for structured logs.
 *
 * Unsalted on purpose: the same IP must hash identically across serverless
 * instances so abuse patterns can be correlated. Never log the raw IP.
 */
export function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}
