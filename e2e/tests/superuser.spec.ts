import { setupClerkTestingToken } from "@clerk/testing/playwright"
import { expect, test } from "@playwright/test"
import { SuperuserPage } from "../pages/superuser.page"

test.describe("Panel superuser", () => {
  let admin: SuperuserPage

  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page })
    admin = new SuperuserPage(page)
    await admin.goto()
    await admin.waitForLoaded()
  })

  test("le panel admin charge les stats", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Administration" }),
    ).toBeVisible()
  })

  test("l'onglet Candidatures charge", async ({ page }) => {
    await admin.clickTab("Candidatures")
    await expect(page).toHaveURL(/\/superuser\/creator-applications/)
    await expect(page.locator("#main-content")).toBeVisible()
  })

  test("l'onglet Signalements charge", async ({ page }) => {
    await admin.clickTab("Signalements")
    await expect(page).toHaveURL(/\/superuser\/reports/)
    await expect(page.locator("#main-content")).toBeVisible()
  })

  test("l'onglet Transactions charge", async ({ page }) => {
    await admin.clickTab("Transactions")
    await expect(page).toHaveURL(/\/superuser\/transactions/)
    await expect(page.locator("#main-content")).toBeVisible()
  })
})
