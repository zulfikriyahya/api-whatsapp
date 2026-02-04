import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test("should redirect unauthenticated user to login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("should display login page correctly", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("Sign in to continue")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Sign in with Google/i }),
    ).toBeVisible();
  });
});
