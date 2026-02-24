/**
 * Shared fixtures for Convex tests.
 * Used with ctx.db.insert("users", createUserFixture(...))
 */

export const createUserFixture = (
  overrides: Record<string, unknown> = {}
) => ({
  name: "Test User",
  tokenIdentifier: "test_user_id",
  accountType: "USER" as const,
  email: "user@test.com",
  image: "https://test.com/image.png",
  isOnline: true,
  ...overrides,
})

export const createCreatorFixture = (
  overrides: Record<string, unknown> = {}
) => ({
  name: "Test Creator",
  tokenIdentifier: "test_creator_id",
  accountType: "CREATOR" as const,
  email: "creator@test.com",
  image: "https://test.com/image.png",
  isOnline: true,
  ...overrides,
})

export const createSuperuserFixture = (
  overrides: Record<string, unknown> = {}
) => ({
  name: "Test Admin",
  tokenIdentifier: "test_admin_id",
  accountType: "SUPERUSER" as const,
  email: "admin@test.com",
  image: "https://test.com/image.png",
  isOnline: true,
  ...overrides,
})
