type LogLevel = "info" | "warn" | "error";
type LogContext = {
  requestId: string;
  route: string;
  status?: number;
  durationMs?: number;
  errorCode?: string;
};

const REQUEST_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/;

export function requestIdFromHeaders(headers: Headers) {
  const candidate = headers.get("x-request-id") ?? headers.get("x-vercel-id");
  return candidate && REQUEST_ID_PATTERN.test(candidate) ? candidate : globalThis.crypto.randomUUID();
}

export function structuredLog(level: LogLevel, event: string, context: LogContext) {
  const record = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    service: "taskflow-web",
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
    release: process.env.VERCEL_GIT_COMMIT_SHA ?? "local",
    event,
    request_id: context.requestId,
    route: context.route,
    ...(context.status === undefined ? {} : { status: context.status }),
    ...(context.durationMs === undefined ? {} : { duration_ms: context.durationMs }),
    ...(context.errorCode === undefined ? {} : { error_code: context.errorCode }),
  });
  const sink = level === "error" ? console.error : level === "warn" ? console.warn : console.info;
  sink(record);
}
