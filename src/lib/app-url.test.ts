import { describe, expect, it } from "vitest";

import { getAppUrl } from "./app-url";

describe("getAppUrl", () => {
  it("uses the configured canonical URL and removes trailing slashes", () => {
    expect(getAppUrl({ NEXT_PUBLIC_APP_URL: "https://taskflow.example/" })).toBe(
      "https://taskflow.example",
    );
  });

  it("uses the deployment-specific Vercel URL for previews", () => {
    expect(getAppUrl({ VERCEL_URL: "taskflow-preview.vercel.app" })).toBe(
      "https://taskflow-preview.vercel.app",
    );
  });

  it("falls back to local development", () => {
    expect(getAppUrl({})).toBe("http://localhost:3000");
  });
});
