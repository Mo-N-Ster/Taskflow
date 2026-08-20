import { expect, test } from "@playwright/test";

test("application responds on the home page", async ({ page }) => {
  const response = await page.goto("/");

  expect(response?.ok()).toBe(true);
  await expect(page).toHaveTitle("TaskFlow");
  await expect(page.getByRole("heading", { name: "Tableau de pilotage" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Voir dashboard" })).toHaveAttribute("href", "/dashboard");
});

test("visitor can move through the public entry screens", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Voir dashboard" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

  await page.getByRole("link", { name: "+ Nouveau projet" }).click();
  await expect(page).toHaveURL(/\/projects\/new$/);
  await expect(page.getByRole("heading", { name: "Nouveau projet" })).toBeVisible();
});

test("project dashboard links to a task detail and confirmation screen is reachable", async ({ page }) => {
  await page.goto("/dashboard");
  await page.getByRole("link", { name: "TaskFlow MVP" }).click();
  await expect(page).toHaveURL(/\/projects\/taskflow-mvp$/);
  await expect(page.getByRole("heading", { name: "TaskFlow MVP" })).toBeVisible();

  await page.getByRole("link", { name: /Créer le shell dashboard/ }).first().click();
  await expect(page).toHaveURL(/\/projects\/taskflow-mvp\/tasks\/T-103$/);
  await expect(page.getByRole("heading", { name: "Créer le shell dashboard" })).toBeVisible();

  await page.goto("/confirm-email");
  await expect(page.getByRole("heading", { name: "Vérifiez votre email" })).toBeVisible();
});
