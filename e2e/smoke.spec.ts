import { expect, test } from "@playwright/test";

test("application responds on the home page", async ({ page }) => {
  const response = await page.goto("/");

  expect(response?.ok()).toBe(true);
  await expect(page).toHaveTitle("Create Next App");
});
