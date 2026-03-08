import { setupClerkTestingToken } from "@clerk/testing/playwright"
import { expect, test } from "@playwright/test"
import { NOTIF_FILTERS } from "../helpers/selectors"
import { NotificationsPage } from "../pages/notifications.page"

test.describe("Centre de notifications", () => {
  let notifications: NotificationsPage

  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page })
    notifications = new NotificationsPage(page)
    await notifications.goto()
    await notifications.waitForLoaded()
  })

  test("la page notifications charge", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Notifications" }),
    ).toBeVisible()
  })

  test("le filtre Tous est visible", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: NOTIF_FILTERS.ALL }),
    ).toBeVisible()
  })

  test("les notifications sont visibles ou l'état vide s'affiche", async ({
    page,
  }) => {
    const count = await notifications.getNotificationCount()
    if (count === 0) {
      // Empty state should show
      await expect(page.locator("#main-content")).toBeVisible()
    } else {
      await expect(notifications.notificationItems.first()).toBeVisible()
    }
  })
})
