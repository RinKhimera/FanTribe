import { type Page, expect } from "@playwright/test"
import { TIP } from "../helpers/selectors"

export class TipDialog {
  readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  get dialog() {
    return this.page.getByRole("dialog")
  }

  async waitForOpen() {
    await expect(this.dialog.getByText(TIP.TITLE)).toBeVisible({
      timeout: 5_000,
    })
  }

  async selectPreset(amount: number) {
    const formatted = amount.toLocaleString("fr-FR")
    await this.dialog
      .getByRole("button", { name: formatted, exact: true })
      .click()
  }

  async selectCustom() {
    await this.dialog.getByRole("button", { name: TIP.CUSTOM }).click()
  }

  async fillCustomAmount(amount: string) {
    await this.dialog.locator("input[inputmode='numeric']").fill(amount)
  }

  async fillMessage(message: string) {
    await this.dialog.getByPlaceholder(TIP.MESSAGE_PLACEHOLDER).fill(message)
  }

  get payMobileButton() {
    return this.dialog.getByRole("button", { name: TIP.PAY_MOBILE })
  }

  get payCardButton() {
    return this.dialog.getByRole("button", { name: TIP.PAY_CARD })
  }

  async clickPayMobile() {
    await this.payMobileButton.click()
  }

  async close() {
    await this.page.keyboard.press("Escape")
  }
}
