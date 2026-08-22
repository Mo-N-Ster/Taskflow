export type HealthResult = {
  status: "ok" | "degraded";
  checks: { configuration: boolean; supabaseAuth: boolean };
};

export async function checkHealth(fetcher: typeof fetch = fetch): Promise<HealthResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const configuration = Boolean(url && key);
  if (!url || !key) return { status: "degraded", checks: { configuration, supabaseAuth: false } };

  try {
    const response = await fetcher(`${url}/auth/v1/health`, {
      headers: { apikey: key },
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    const supabaseAuth = response.ok;
    return { status: supabaseAuth ? "ok" : "degraded", checks: { configuration, supabaseAuth } };
  } catch {
    return { status: "degraded", checks: { configuration, supabaseAuth: false } };
  }
}
