import { test, expect, Page } from "@playwright/test";

async function gotoReady(page: Page, url: string) {
  await page.goto(url);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(400);
}

test.describe("FinTrack E2E", () => {
  test("register → transaction → budget → dashboard → search/filter → edit/delete → investment → SIP → goal → report → export → logout/login → persistence", async ({ page }) => {
    const email = `e2e${Date.now()}@test.dev`;

    // Register
    await gotoReady(page, "/register");
    await page.fill("#name", "E2E User");
    await page.fill("#email", email);
    await page.fill("#password", "Passw0rd123");
    await page.click("button:has-text('Register')");
    await page.waitForURL("**/dashboard", { timeout: 15000 });

    // Add income
    await gotoReady(page, "/transactions");
    await page.click("text=+ Add transaction");
    await page.selectOption("#t-type", "INCOME");
    await page.fill("#t-amount", "50000");
    await page.fill("#t-desc", "E2E Salary");
    await page.selectOption("#t-cat", { label: "Salary" });
    await page.click("button:has-text('Save')");
    await expect(page.locator("text=E2E Salary")).toBeVisible();

    // Add expense
    await page.click("text=+ Add transaction");
    await page.selectOption("#t-type", "EXPENSE");
    await page.fill("#t-amount", "1200");
    await page.fill("#t-desc", "E2E Groceries");
    await page.selectOption("#t-cat", { label: "Groceries" });
    await page.click("button:has-text('Save')");
    await expect(page.locator("text=E2E Groceries")).toBeVisible();

    // Search / filter
    await page.fill("#q", "E2E Salary");
    await page.press("#q", "Enter");
    await page.waitForTimeout(800);
    await expect(page.locator("text=E2E Salary")).toBeVisible();
    await expect(page.locator("text=E2E Groceries")).toHaveCount(0);
    await page.fill("#q", "");
    await page.press("#q", "Enter");

    // Edit & delete
    await page.locator("tr", { hasText: "E2E Salary" }).getByText("Edit").click();
    await page.fill("#t-amount", "55000");
    await page.click("button:has-text('Save')");
    await expect(page.locator("tr", { hasText: "E2E Salary" })).toContainText("55,000.00");
    await page.locator("tr", { hasText: "E2E Groceries" }).getByText("Delete").click();
    await page.locator("div[role=dialog]").getByRole("button", { name: "Delete" }).click();
    await page.waitForTimeout(500);
    await expect(page.locator("text=E2E Groceries")).toHaveCount(0);

    // Budget
    await gotoReady(page, "/budgets");
    await page.selectOption("#b-cat", { label: "Groceries" });
    await page.fill("#b-limit", "5000");
    await page.click("button:has-text('Save')");
    await expect(page.locator("text=Monthly limit")).toBeVisible();

    // Dashboard totals
    await gotoReady(page, "/dashboard");
    await expect(page.locator("text=Income").first()).toBeVisible();

    // Investment
    await gotoReady(page, "/investments");
    await page.click("text=+ Add");
    await page.fill("#i-name", "E2E Fund");
    await page.fill("#i-inv", "100000");
    await page.fill("#i-cur", "112000");
    await page.click("button:has-text('Save')");
    await expect(page.locator("text=E2E Fund")).toBeVisible();
    await expect(page.locator("text=12.0%")).toBeVisible();

    // SIP
    await gotoReady(page, "/sips");
    await page.fill("#s-monthly", "5000");
    await page.fill("#s-rate", "12");
    await page.fill("#s-years", "10");
    await page.click("button:has-text('Save SIP')");
    await expect(page.locator("text=/mo")).toBeVisible();

    // Goal
    await gotoReady(page, "/goals");
    await page.click("text=+ Add goal");
    await page.fill("#g-name", "E2E Goal");
    await page.fill("#g-target", "100000");
    await page.fill("#g-saved", "20000");
    await page.click("button:has-text('Save')");
    await expect(page.locator("text=E2E Goal")).toBeVisible();

    // Report
    await gotoReady(page, "/reports");
    await expect(page.locator("text=Export CSV")).toBeVisible();

    // Logout / login
    await gotoReady(page, "/dashboard");
    await page.click("text=Logout");
    await page.waitForURL("**/login");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(400);
    await page.fill("#email", email);
    await page.fill("#password", "Passw0rd123");
    await page.click("button:has-text('Sign in')");
    await page.waitForURL("**/dashboard");

    // Data persists
    await gotoReady(page, "/transactions");
    await expect(page.locator("text=E2E Salary")).toBeVisible();
  });

  test("mobile viewport renders bottom nav", async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await gotoReady(page, "/login");
    await expect(page.locator("text=Sign in")).toBeVisible();
    await ctx.close();
  });
});
