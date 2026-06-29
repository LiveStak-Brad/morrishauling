/**
 * In-memory IP rate limiter for public/high-risk API routes.
 * Replace with Redis or Upstash before high-traffic multi-instance production.
 */

import { NextResponse } from "next/server";

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitOptions {
  /** Unique key suffix (usually route id) */
  key: string;
  limit: number;
  windowMs: number;
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

export function checkRateLimit(
  request: Request,
  options: RateLimitOptions
): { allowed: boolean; retryAfterSec: number } {
  const ip = getClientIp(request);
  const bucketKey = `${options.key}:${ip}`;
  const now = Date.now();

  let bucket = buckets.get(bucketKey);
  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + options.windowMs };
    buckets.set(bucketKey, bucket);
  }

  bucket.count += 1;

  if (bucket.count > options.limit) {
    const retryAfterSec = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    return { allowed: false, retryAfterSec };
  }

  return { allowed: true, retryAfterSec: 0 };
}

export function rateLimitResponse(retryAfterSec: number): NextResponse {
  return NextResponse.json(
    { ok: false, error: "Too many requests. Please try again shortly." },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSec) },
    }
  );
}

/** Apply rate limit; returns Response if blocked, null if allowed. */
export function enforceRateLimit(
  request: Request,
  options: RateLimitOptions
): NextResponse | null {
  const result = checkRateLimit(request, options);
  if (!result.allowed) {
    return rateLimitResponse(result.retryAfterSec);
  }
  return null;
}
