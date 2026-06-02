import type { NextFunction, Request, Response } from "express";

function randomSuffix() {
  return Math.random().toString(36).slice(2, 10);
}

export function requestId(req: Request, res: Response, next: NextFunction) {
  const incomingRequestId = req.header("x-request-id");
  const id = incomingRequestId?.trim() || `req_${Date.now()}_${randomSuffix()}`;

  res.locals.requestId = id;
  res.setHeader("X-Request-Id", id);
  next();
}
