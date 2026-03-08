import { type Page, expect } from "@playwright/test"
import { BasePage } from "./base.page"

export class SuperuserPage extends BasePage {
  constructor(page: Page) {
    super(page)
  }

  async goto() {
    await super.goto("/superuser")
  }

  async waitForLoaded() {
    await expect(
      this.page.getByRole("heading", { name: "Administration" }),
    ).toBeVisible({ timeout: 15_000 })
  }

  async clickTab(label: string) {
    await this.page.getByRole("link", { name: label }).click()
    await this.page.waitForLoadState("domcontentloaded")
  }
}
