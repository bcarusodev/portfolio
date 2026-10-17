import type { NextApiRequest } from "next";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getClientIp, hashIp } from "@/lib/ai/clientIp";

/**
 * Spec R1 (trust boundary) + R6: both IP-trust paths must be covered, or
 * coverage silently collapses onto `127.0.0.1`.
 */

function createReq(
  xff: string | string[] | undefined,
  remoteAddress?: string
): NextApiRequest {
  const headers: Record<string, string | string[]> = {};
  if (xff !== undefined) headers["x-forwarded-for"] = xff;
  return {
    headers,
    socket: { remoteAddress },
  } as unknown as NextApiRequest;
}

describe("getClientIp", () => {
  let savedVercel: string | undefined;

  beforeEach(() => {
    savedVercel = process.env.VERCEL;
    delete process.env.VERCEL;
  });

  afterEach(() => {
    if (savedVercel === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = savedVercel;
  });

  it("ignores a forged XFF header off-Vercel and uses the socket address", () => {
    const req = createReq("203.0.113.9", "198.51.100.1");
    expect(getClientIp(req)).toBe("198.51.100.1");
  });

  it("ignores a multi-entry forged XFF header off-Vercel", () => {
    const req = createReq("203.0.113.9, 10.0.0.1", "198.51.100.1");
    expect(getClientIp(req)).toBe("198.51.100.1");
  });

  it("trusts the leftmost XFF entry when VERCEL=1", () => {
    process.env.VERCEL = "1";
    const req = createReq("203.0.113.9, 10.0.0.1", "127.0.0.1");
    expect(getClientIp(req)).toBe("203.0.113.9");
  });

  it("reads the leftmost entry of an array-valued XFF header when VERCEL=1", () => {
    process.env.VERCEL = "1";
    const req = createReq(["203.0.113.9, 10.0.0.1", "10.0.0.2"], "127.0.0.1");
    expect(getClientIp(req)).toBe("203.0.113.9");
  });

  it("trims the trusted entry when VERCEL=1", () => {
    process.env.VERCEL = "1";
    const req = createReq(" 203.0.113.9 , 10.0.0.1", "127.0.0.1");
    expect(getClientIp(req)).toBe("203.0.113.9");
  });

  it("falls back to the socket address when VERCEL=1 has no XFF header", () => {
    process.env.VERCEL = "1";
    const req = createReq(undefined, "127.0.0.1");
    expect(getClientIp(req)).toBe("127.0.0.1");
  });

  it("returns 'unknown' when no trusted IP and no socket address exist", () => {
    process.env.VERCEL = "1";
    const req = createReq(" , ", undefined);
    expect(getClientIp(req)).toBe("unknown");
  });
});

describe("hashIp", () => {
  it("returns 16 lowercase hex characters", () => {
    expect(hashIp("203.0.113.9")).toMatch(/^[0-9a-f]{16}$/);
  });

  it("is stable for the same IP", () => {
    expect(hashIp("203.0.113.9")).toBe(hashIp("203.0.113.9"));
  });

  it("never contains the raw IP and differs across IPs", () => {
    const hash = hashIp("203.0.113.9");
    expect(hash).not.toContain("203.0.113.9");
    expect(hash).not.toBe(hashIp("198.51.100.1"));
  });
});
