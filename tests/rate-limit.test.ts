import { afterEach, describe, expect, it, vi } from "vitest";

import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

let keyCounter = 0;
const uniqueKey = () => `test:${Date.now()}:${keyCounter++}`;

describe("checkRateLimit", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("consente fino al limite e poi blocca", () => {
    const key = uniqueKey();
    const results = Array.from({ length: 4 }, () => checkRateLimit(key, 3, 60).allowed);
    expect(results).toEqual([true, true, true, false]);
  });

  it("indica quanti secondi attendere quando blocca", () => {
    const key = uniqueKey();
    checkRateLimit(key, 1, 60);
    const blocked = checkRateLimit(key, 1, 60);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    expect(blocked.retryAfterSeconds).toBeLessThanOrEqual(60);
  });

  it("riapre dopo la fine della finestra", () => {
    vi.useFakeTimers();
    const key = uniqueKey();
    checkRateLimit(key, 1, 60);
    expect(checkRateLimit(key, 1, 60).allowed).toBe(false);
    vi.advanceTimersByTime(60_001);
    expect(checkRateLimit(key, 1, 60).allowed).toBe(true);
  });

  it("tiene separate chiavi diverse", () => {
    const a = uniqueKey();
    const b = uniqueKey();
    checkRateLimit(a, 1, 60);
    expect(checkRateLimit(a, 1, 60).allowed).toBe(false);
    expect(checkRateLimit(b, 1, 60).allowed).toBe(true);
  });
});

describe("getClientIp", () => {
  const request = (headers: Record<string, string>) => new Request("https://example.test", { headers });

  it("preferisce l'header di Vercel, non falsificabile dal client", () => {
    expect(
      getClientIp(request({ "x-vercel-forwarded-for": "1.1.1.1", "x-real-ip": "2.2.2.2", "x-forwarded-for": "3.3.3.3" }))
    ).toBe("1.1.1.1");
  });

  it("usa x-real-ip se manca l'header di Vercel", () => {
    expect(getClientIp(request({ "x-real-ip": "2.2.2.2", "x-forwarded-for": "3.3.3.3" }))).toBe("2.2.2.2");
  });

  it("da x-forwarded-for prende l'ULTIMO elemento (il primo è scelto dal client)", () => {
    expect(getClientIp(request({ "x-forwarded-for": "6.6.6.6, 10.0.0.1, 4.4.4.4" }))).toBe("4.4.4.4");
  });

  it("ricade su 'unknown' senza header", () => {
    expect(getClientIp(request({}))).toBe("unknown");
  });
});
