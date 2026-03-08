import { type Page, expect } from "@playwright/test"
import { NEW_POST } from "../helpers/selectors"
import { BasePage } from "./base.page"

export class NewPostPage extends BasePage {
  constructor(page: Page) {
    super(page)
  }

  async goto() {
    await super.goto("/new-post")
  }

  async waitForEditorLoaded() {
    await expect(this.contentInput).toBeVisible({ timeout: 15_000 })
  }

  get contentInput() {
    return this.page.getByPlaceholder(NEW_POST.PLACEHOLDER)
  }

  async fillContent(text: string) {
    await this.contentInput.fill(text)
  }

  async selectVisibility(mode: "public" | "subscribers_only") {
    const label =
      mode === "public"
        ? NEW_POST.VISIBILITY_PUBLIC
        : NEW_POST.VISIBILITY_SUBSCRIBERS
    // Open popover then select
    await this.page
      .getByRole("button", { name: /Tout le monde|Fans uniquement/ })
      .click()
    await this.page.getByText(label).click()
  }

  get submitButton() {
    return this.page
      .locator("#main-content")
      .getByRole("button", { name: NEW_POST.SUBMIT })
  }

  async submit() {
    await this.submitButton.click()
  }

  async waitForRedirectToHome() {
    await this.page.waitForURL("/", { timeout: 15_000 })
  }
}
