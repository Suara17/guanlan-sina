import { test as setup } from "@playwright/test"
import { firstSuperuser, firstSuperuserPassword } from "./config.ts"

const authFile = "playwright/.auth/user.json"

setup("authenticate", async ({ page }) => {
  await page.goto("/login")

  // Wait for React to load and render
  await page.waitForSelector('[data-testid="username-input"]', {
    timeout: 30000,
  })

  await page.getByTestId("username-input").fill(firstSuperuser)
  await page.getByTestId("password-input").fill(firstSuperuserPassword)
  await page.getByRole("button", { name: "Log In" }).click()
  await page.waitForURL("/")
  await page.context().storageState({ path: authFile })
})
