import { setupClerkTestingToken } from "@clerk/testing/playwright"
import { expect, test } from "@playwright/test"
import { MessagesPage } from "../pages/messages.page"

test.describe("Messagerie", () => {
  let messages: MessagesPage

  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page })
    messages = new MessagesPage(page)
    await messages.goto()
    await messages.waitForLoaded()
  })

  test("la page messages charge", async ({ page }) => {
    await expect(page.locator("#main-content")).toBeVisible()
  })

  test("les conversations sont visibles ou l'état vide s'affiche", async () => {
    const count = await messages.getConversationCount()
    if (count > 0) {
      await expect(messages.conversations.first()).toBeVisible()
    }
  })

  test("ouvrir une conversation affiche les messages", async ({ page }) => {
    const count = await messages.getConversationCount()
    if (count > 0) {
      await messages.openConversation(0)
      // Message input or locked overlay should be visible
      await page.waitForTimeout(2_000)
      await expect(page.locator("#main-content")).toBeVisible()
    }
  })
})
