import type { NextFunction, Request, Response } from "express";
import { env } from "../env";
import { AppError } from "../utils/errors";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitEntry>();

export function rateLimitPlaceholder(req: Request, _res: Response, next: NextFunction) {
  const now = Date.now();
  const key = req.ip || req.socket.remoteAddress || "unknown";
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, {
      count: 1,
      resetAt: now + env.RATE_LIMIT_WINDOW_MS,
    });
    next();
    return;
  }

  existing.count += 1;

  if (existing.count > env.RATE_LIMIT_MAX_REQUESTS) {
    next(
      new AppError(429, "rate_limit_exceeded", "Too many requests. Try again later.", {
        resetAt: new Date(existing.resetAt).toISOString(),
      }),
    );
    return;
  }

  next();
}

// Production note: replace this process-local limiter with Redis or provider-level
// rate limiting before exposing model-backed routes publicly.
