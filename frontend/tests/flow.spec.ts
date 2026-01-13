import { expect, test } from "@playwright/test"

test("Production Dashboard and Alert Center navigation", async ({ page }) => {
  // 1. Visit root. The auth.setup.ts should have already handled authentication
  // and stored the state in playwright/.auth/user.json
  await page.goto("/")

  // 2. Since user is authenticated, click "进入仪表板" to go to dashboard
  await page.getByRole("link", { name: "进入仪表板" }).click()

  // 3. Now we should be on dashboard with sidebar
  // Navigate to Production Dashboard using sidebar
  await page.getByRole("link", { name: "Production" }).click()

  // Verify URL and Heading
  await expect(page).toHaveURL(/\/dashboard/)
  await expect(
    page.getByRole("heading", { name: "生产概览 (观澜)" }),
  ).toBeVisible()

  // Check for presence of key metric cards (Yield Cards)
  // "Total Target" is likely one of the labels in the cards
  await expect(page.getByText("Total Target")).toBeVisible()

  // 3. Alerts
  // Navigate to Alert Center using sidebar
  await page.getByRole("link", { name: "Alerts" }).click()

  // Verify URL and Heading
  await expect(page).toHaveURL(/\/alerts/)
  await expect(
    page.getByRole("heading", { name: "Alert Center" }),
  ).toBeVisible()

  // Check for Table Headers to confirm the alerts table is rendered
  // Using getByRole 'columnheader' for table headers is more appropriate
  await expect(page.getByRole("columnheader", { name: "Status" })).toBeVisible()
  await expect(
    page.getByRole("columnheader", { name: "Severity" }),
  ).toBeVisible()
})
