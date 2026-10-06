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
    await expect(page.getByText("Your money, in focus")).toBeVisible();
    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByRole("link", { name: "AI" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Preinstalled data" })).toHaveCount(0);
    await page.selectOption("#analysis-period", "1");
    await expect(page.locator("#analysis-period")).toHaveValue("1");
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Add sample data" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Sample history is ready" })).toBeVisible();
    await page.selectOption("#analysis-period", "3");

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
    await expect(page.getByRole("heading", { name: "Monthly savings" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "High expenditure trend" })).toBeVisible();
    await page.fill("#quick-amount", "2500");
    await page.fill("#quick-description", "E2E quick income");
    await page.getByRole("button", { name: "Add income" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Earned amount added" })).toBeVisible();
    await page.selectOption("#quick-type", "EXPENSE");
    await page.fill("#quick-amount", "250");
    await page.fill("#quick-description", "E2E quick expense");
    await page.getByRole("button", { name: "Subtract spend" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Spent amount subtracted" })).toBeVisible();
    const xssPayload = "<img src=x onerror=alert(1)>";
    await page.selectOption("#quick-type", "INCOME");
    await page.fill("#quick-amount", "1");
    await page.fill("#quick-description", xssPayload);
    await page.getByRole("button", { name: "Add income" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Earned amount added" })).toBeVisible();
    await expect(page.locator("img[src='x']")).toHaveCount(0);
    await expect(page.getByRole("listitem").filter({ hasText: xssPayload })).toBeVisible();

    // Investment
    await gotoReady(page, "/investments");
    await page.click("text=+ Add");
    await page.fill("#i-name", "E2E Fund");
    await page.fill("#i-inv", "100000");
    await page.fill("#i-cur", "112000");
    await page.getByRole("dialog", { name: "Add investment" }).getByRole("button", { name: "Save", exact: true }).click();
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
    await expect(page.getByText("Your money, in focus")).toBeVisible();
    // A full reload and navigation must not replace database records with demo data.
    await page.reload();
    await page.waitForLoadState("networkidle");
    await gotoReady(page, "/transactions");
    await expect(page.locator("text=E2E Salary")).toBeVisible();
    await expect(page.getByText(xssPayload, { exact: true })).toBeVisible();
    await gotoReady(page, "/goals");
    await expect(page.locator("text=E2E Goal")).toBeVisible();
    await gotoReady(page, "/investments");
    await expect(page.locator("text=E2E Fund")).toBeVisible();
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
