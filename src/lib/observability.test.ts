import { afterEach, describe, expect, it, vi } from "vitest";

import { requestIdFromHeaders, structuredLog } from "./observability";

describe("observability", () => {
  afterEach(() => vi.restoreAllMocks());

  it("keeps a safe correlation id and rejects unsafe input", () => {
    expect(requestIdFromHeaders(new Headers({ "x-request-id": "req-12345678" }))).toBe("req-12345678");
    expect(requestIdFromHeaders(new Headers({ "x-request-id": "bad value" }))).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("emits a minimal structured JSON record", () => {
    const sink = vi.spyOn(console, "info").mockImplementation(() => undefined);
    structuredLog("info", "health.check", { requestId: "req-12345678", route: "/api/health", status: 200, durationMs: 12 });
    const record = JSON.parse(String(sink.mock.calls[0][0]));
    expect(record).toMatchObject({ level: "info", service: "taskflow-web", event: "health.check", request_id: "req-12345678", route: "/api/health", status: 200, duration_ms: 12 });
    expect(JSON.stringify(record)).not.toContain("password");
  });
});
