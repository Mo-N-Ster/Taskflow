import { afterEach, describe, expect, it, vi } from "vitest";

import { checkHealth } from "./health";

describe("checkHealth", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("reports missing configuration without making a request", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    const fetcher = vi.fn();
    await expect(checkHealth(fetcher as unknown as typeof fetch)).resolves.toEqual({ status: "degraded", checks: { configuration: false, supabaseAuth: false } });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("reports an available Supabase Auth dependency", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "public-key");
    const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    await expect(checkHealth(fetcher as unknown as typeof fetch)).resolves.toEqual({ status: "ok", checks: { configuration: true, supabaseAuth: true } });
    expect(fetcher).toHaveBeenCalledWith("https://example.supabase.co/auth/v1/health", expect.objectContaining({ cache: "no-store" }));
  });
});
