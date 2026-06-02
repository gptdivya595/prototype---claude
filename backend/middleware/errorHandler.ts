import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { sendError } from "../utils/apiResponse";
import { AppError } from "../utils/errors";

export function notFound(req: Request, _res: Response, next: NextFunction) {
  next(new AppError(404, "not_found", `Route not found: ${req.method} ${req.path}`));
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof AppError) {
    return sendError(res, error.statusCode, error.code, error.message, error.details);
  }

  if (error instanceof ZodError) {
    return sendError(res, 400, "validation_error", "Request validation failed.", error.flatten());
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    "type" in error &&
    error.status === 413 &&
    error.type === "entity.too.large"
  ) {
    return sendError(res, 413, "payload_too_large", "Request body exceeds the 1mb limit.");
  }

  console.error("[work-mode-api] unexpected error", {
    requestId: res.locals.requestId,
    error,
  });

  return sendError(res, 500, "internal_server_error", "Unexpected server error.");
}
