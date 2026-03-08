import { test as teardown } from "@playwright/test"

teardown("cleanup", async () => {
  console.log("E2E teardown complete")
})
