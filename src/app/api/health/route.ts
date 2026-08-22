import { checkHealth } from "@/lib/health";
import { requestIdFromHeaders, structuredLog } from "@/lib/observability";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const startedAt = performance.now();
  const requestId = requestIdFromHeaders(request.headers);
  const health = await checkHealth();
  const status = health.status === "ok" ? 200 : 503;
  structuredLog(status === 200 ? "info" : "error", "health.check", {
    requestId,
    route: "/api/health",
    status,
    durationMs: Math.round(performance.now() - startedAt),
    ...(status === 200 ? {} : { errorCode: "DEPENDENCY_UNAVAILABLE" }),
  });

  return Response.json({
    ...health,
    service: "taskflow-web",
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
    release: process.env.VERCEL_GIT_COMMIT_SHA ?? "local",
    requestId,
  }, { status, headers: { "cache-control": "no-store", "x-request-id": requestId } });
}
