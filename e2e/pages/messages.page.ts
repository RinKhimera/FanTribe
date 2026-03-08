import { type Page, expect } from "@playwright/test"
import { BasePage } from "./base.page"

export class MessagesPage extends BasePage {
  constructor(page: Page) {
    super(page)
  }

  async goto() {
    await super.goto("/messages")
  }

  async waitForLoaded() {
    await expect(this.page.locator("#main-content")).toBeVisible({
      timeout: 15_000,
    })
  }

  get conversations() {
    return this.page.locator("[data-testid='conversation-item']")
  }

  async openConversation(index: number) {
    await this.conversations.nth(index).click()
  }

  get messageInput() {
    return this.page.locator("[data-testid='message-input']")
  }

  get sendButton() {
    return this.page.locator("[data-testid='send-message-button']")
  }

  async sendMessage(text: string) {
    await this.messageInput.fill(text)
    await this.sendButton.click()
  }

  async isLockedOverlayVisible() {
    return this.page.getByText("Abonnement messagerie expiré").isVisible()
  }

  async getConversationCount() {
    return this.conversations.count()
  }
}
