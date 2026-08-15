// Upstash REST is shared across serverless instances (production-safe,
// unlike an in-memory limiter, which resets per instance and doesn't
// coordinate across them).

import { Ratelimit, type Duration } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const hasUpstashCredentials =
  !!process.env.UPSTASH_REDIS_REST_URL &&
  !!process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = hasUpstashCredentials ? Redis.fromEnv() : null;

let devWarningLogged = false;

const limiters = new Map<string, Ratelimit>();

function makeRateLimiter(limit: number, window: Duration) {
  const cacheKey = `${limit}:${window}`;
  const existing = limiters.get(cacheKey);
  if (existing) return existing;

  const limiter = new Ratelimit({
    redis: redis as Redis,
    limiter: Ratelimit.slidingWindow(limit, window),
    prefix: "agroditari",
  });
  limiters.set(cacheKey, limiter);
  return limiter;
}

export type RateLimitResult = { success: boolean; remaining: number };

export async function checkRateLimit(
  key: string,
  limit = 10,
  window: Duration = "60 s"
): Promise<RateLimitResult> {
  if (!hasUpstashCredentials) {
    if (!devWarningLogged) {
      console.log("[DEV] Rate limiting disabled (no Upstash credentials)");
      devWarningLogged = true;
    }
    return { success: true, remaining: 999 };
  }

  const limiter = makeRateLimiter(limit, window);
  const result = await limiter.limit(key);
  return { success: result.success, remaining: result.remaining };
}

export function getClientKey(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim();
  return ip || "anonymous";
}