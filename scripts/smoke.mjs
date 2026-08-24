const baseUrl = (process.env.TASKFLOW_BASE_URL ?? process.argv[2] ?? "").replace(/\/$/, "");
if (!baseUrl || !/^https?:\/\//.test(baseUrl)) {
  console.error("Usage: TASKFLOW_BASE_URL=https://taskflow.example pnpm smoke");
  process.exit(2);
}

async function assertResponse(path, validate) {
  const response = await fetch(`${baseUrl}${path}`, { signal: AbortSignal.timeout(10_000), redirect: "follow" });
  if (!response.ok) throw new Error(`${path} returned ${response.status}`);
  await validate(response);
}

try {
  await assertResponse("/", async (response) => {
    const body = await response.text();
    if (!body.includes("TaskFlow")) throw new Error("home page marker missing");
  });
  await assertResponse("/api/health", async (response) => {
    const body = await response.json();
    if (body.status !== "ok" || body.checks?.supabaseAuth !== true) throw new Error("dependency health check degraded");
  });
  console.info(JSON.stringify({ event: "smoke.success", base_url: new URL(baseUrl).origin }));
} catch (error) {
  console.error(JSON.stringify({ event: "smoke.failure", message: error instanceof Error ? error.message : "unknown error" }));
  process.exit(1);
}
