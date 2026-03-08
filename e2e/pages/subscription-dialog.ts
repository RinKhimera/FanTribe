import { type Page, expect } from "@playwright/test"
import { SUBSCRIPTION } from "../helpers/selectors"

export class SubscriptionDialog {
  readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  get dialog() {
    return this.page.getByRole("dialog")
  }

  async waitForOpen() {
    await expect(this.dialog.getByText(SUBSCRIPTION.TITLE_PREFIX)).toBeVisible({
      timeout: 5_000,
    })
  }

  get payMobileButton() {
    return this.dialog.getByRole("button", {
      name: SUBSCRIPTION.PAY_MOBILE,
    })
  }

  get payCardButton() {
    return this.dialog.getByRole("button", { name: SUBSCRIPTION.PAY_CARD })
  }

  get unsubscribeButton() {
    return this.dialog.getByRole("button", {
      name: SUBSCRIPTION.UNSUBSCRIBE,
    })
  }

  async clickPayMobile() {
    await this.payMobileButton.click()
  }

  async clickPayCard() {
    await this.payCardButton.click()
  }

  async waitForUnsubscribeOpen() {
    await expect(this.dialog.getByText("Se désabonner de")).toBeVisible({
      timeout: 5_000,
    })
  }

  async clickUnsubscribe() {
    await this.unsubscribeButton.click()
  }

  async close() {
    await this.page.keyboard.press("Escape")
  }

  async expectPriceVisible() {
    await expect(this.dialog.getByText(SUBSCRIPTION.PRICE)).toBeVisible()
  }

  async expectFeaturesVisible() {
    await expect(
      this.dialog.getByText(SUBSCRIPTION.FEATURE_CONTENT),
    ).toBeVisible()
    await expect(
      this.dialog.getByText(SUBSCRIPTION.FEATURE_NO_COMMITMENT),
    ).toBeVisible()
  }
}
