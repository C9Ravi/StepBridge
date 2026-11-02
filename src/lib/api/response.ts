import { NextResponse } from "next/server";

export interface ApiResponseMeta {
  requestId: string;
  timestamp: string;
}

export interface ApiSuccessResponse<T> {
  data: T;
  meta: ApiResponseMeta;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string[]>;
  };
  meta: ApiResponseMeta;
}

export function createRequestId(): string {
  return "req_" + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

export function apiSuccess<T>(data: T, status = 200) {
  const payload: ApiSuccessResponse<T> = {
    data,
    meta: {
      requestId: createRequestId(),
      timestamp: new Date().toISOString(),
    },
  };
  return NextResponse.json(payload, { status });
}

export function apiError(
  message: string,
  code = "BAD_REQUEST",
  status = 400,
  fields?: Record<string, string[]>
) {
  const payload: ApiErrorResponse = {
    error: {
      code,
      message,
      ...(fields ? { fields } : {}),
    },
    meta: {
      requestId: createRequestId(),
      timestamp: new Date().toISOString(),
    },
  };
  return NextResponse.json(payload, { status });
}
