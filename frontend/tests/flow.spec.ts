import { expect, test } from "@playwright/test"

test("Production Dashboard and Alert Center navigation", async ({ page }) => {
  // 1. Visit root. The auth.setup.ts should have already handled authentication
  // and stored the state in playwright/.auth/user.json
  await page.goto("/")

  // 2. Dashboard
  // Navigate to Production Dashboard using sidebar
  await page.getByRole("link", { name: "Production" }).click()

  // Verify URL and Heading
  await expect(page).toHaveURL(/\/dashboard/)
  await expect(
    page.getByRole("heading", { name: "Production Overview" }),
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
  // Using getByRole 'columnheader' is more precise than 'cell' for headers, but 'cell' or text often works too.
  // Instructions suggested getByRole('cell', { name: 'Status' })
  await expect(page.getByRole("cell", { name: "Status" })).toBeVisible()
  await expect(page.getByRole("cell", { name: "Severity" })).toBeVisible()
})
