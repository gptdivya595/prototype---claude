import type { NextFunction, Request, Response } from "express";
import { env } from "../env";
import { AppError } from "../utils/errors";

export function demoTokenGuard(req: Request, _res: Response, next: NextFunction) {
  if (!env.DEMO_API_TOKEN) {
    next();
    return;
  }

  const demoToken = req.header("x-demo-token");
  if (demoToken === env.DEMO_API_TOKEN) {
    next();
    return;
  }

  next(new AppError(401, "demo_token_required", "A valid X-Demo-Token header is required."));
}
