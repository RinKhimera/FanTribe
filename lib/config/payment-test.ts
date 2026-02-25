/**
 * Payment test mode helpers
 *
 * NEXT_PUBLIC_PAYMENT_TEST_MODE=true  → simulates payments without calling providers
 * NEXT_PUBLIC_PAYMENT_TEST_FORCE_FAIL=true → forces simulated payment to fail
 */

export const isPaymentTestMode = () =>
  process.env.NEXT_PUBLIC_PAYMENT_TEST_MODE === "true"

export const isPaymentTestForceFail = () =>
  process.env.NEXT_PUBLIC_PAYMENT_TEST_FORCE_FAIL === "true"
