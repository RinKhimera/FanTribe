import { setupClerkTestingToken } from "@clerk/testing/playwright"
import { expect, test } from "@playwright/test"
import { DashboardPage } from "../pages/dashboard.page"

test.describe("Dashboard créateur", () => {
  let dashboard: DashboardPage

  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page })
    dashboard = new DashboardPage(page)
    await dashboard.goto()
    await dashboard.waitForLoaded()
  })

  test("le dashboard charge avec le heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible()
  })

  test("les KPIs sont visibles", async () => {
    const count = await dashboard.kpiCards.count()
    expect(count).toBeGreaterThan(0)
  })

  test("l'onglet Revenus charge", async ({ page }) => {
    await dashboard.clickTab("Revenus")
    await expect(page).toHaveURL(/\/dashboard\/revenue/)
    await expect(page.locator("#main-content")).toBeVisible()
  })

  test("l'onglet Contenu charge", async ({ page }) => {
    await dashboard.clickTab("Contenu")
    await expect(page).toHaveURL(/\/dashboard\/content/)
    await expect(page.locator("#main-content")).toBeVisible()
  })

  test("l'onglet Abonnés charge", async ({ page }) => {
    await dashboard.clickTab("Abonnés")
    await expect(page).toHaveURL(/\/dashboard\/audience/)
    await expect(page.locator("#main-content")).toBeVisible()
  })
})
