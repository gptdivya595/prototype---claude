import type { Response } from "express";

export type ApiSuccess<T> = {
  ok: true;
  data: T;
  requestId: string;
};

export type ApiError = {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  requestId: string;
};

export function sendSuccess<T>(res: Response, data: T, statusCode = 200) {
  const requestId = res.locals.requestId as string;
  const body: ApiSuccess<T> = {
    ok: true,
    data,
    requestId,
  };

  return res.status(statusCode).json(body);
}

export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: unknown,
) {
  const requestId = res.locals.requestId as string;
  const body: ApiError = {
    ok: false,
    error: {
      code,
      message,
      ...(details === undefined ? {} : { details }),
    },
    requestId,
  };

  return res.status(statusCode).json(body);
}
