import { expect, test } from "@playwright/test";

test("application responds on the home page", async ({ page }) => {
  const response = await page.goto("/");

  expect(response?.ok()).toBe(true);
  await expect(page).toHaveTitle("TaskFlow");
  await expect(page.getByRole("heading", { name: "Tableau de pilotage" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Voir dashboard" })).toHaveAttribute("href", "/dashboard");
});

test("visitor can move through the public authentication screens", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Connexion" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Connexion" })).toBeVisible();

  await page.getByRole("link", { name: "Créer un compte" }).click();
  await expect(page).toHaveURL(/\/register$/);
  await expect(page.getByRole("heading", { name: "Créer un compte" })).toBeVisible();
});

test("health endpoint reports the application and Supabase Auth ready", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.status()).toBe(200);
  expect(response.headers()["cache-control"]).toContain("no-store");
  expect(response.headers()["x-request-id"]).toBeTruthy();
  await expect(response.json()).resolves.toMatchObject({
    status: "ok",
    service: "taskflow-web",
    checks: { configuration: true, supabaseAuth: true },
  });
});

test("protected routes redirect visitors to login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login\?next=%2Fdashboard$/);

  await page.goto("/projects/10000000-0000-0000-0000-000000000001");
  await expect(page).toHaveURL(/\/login\?next=%2Fprojects%2F10000000-0000-0000-0000-000000000001$/);
});
