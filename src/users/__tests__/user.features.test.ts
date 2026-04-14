import { describe, it, expect, beforeEach } from "vitest";
import { getUser, createUser } from "../user.features";
import { createInMemoryUserRepository } from "./in-memory-user-repository";
import type { User } from "../user.domain";

// ---------------------------------------------------------------------------
// getUser
// ---------------------------------------------------------------------------

const ALICE: User = { id: "550e8400-e29b-41d4-a716-446655440000", name: "Alice", email: "alice@example.com" };

describe("getUser", () => {
  let repo: ReturnType<typeof createInMemoryUserRepository>;

  beforeEach(() => {
    repo = createInMemoryUserRepository([ALICE]);
  });

  const deps = () => ({ userRepo: () => repo });

  it("returns the user when found", async () => {
    const [user, error] = await getUser({ id: ALICE.id }, deps());
    expect(error).toBeNull();
    expect(user).toEqual(ALICE);
  });

  it("returns UserNotFoundError when user does not exist", async () => {
    const [user, error] = await getUser({ id: "550e8400-e29b-41d4-a716-446655440001" }, deps());
    expect(user).toBeNull();
    expect(error?.kind).toBe("UserNotFoundError");
  });

  it("returns UserValidationError when id is not a UUID", async () => {
    const [user, error] = await getUser({ id: "not-a-uuid" }, deps());
    expect(user).toBeNull();
    expect(error?.kind).toBe("UserValidationError");
  });

  it("returns UserValidationError when id is missing", async () => {
    const [user, error] = await getUser({}, deps());
    expect(user).toBeNull();
    expect(error?.kind).toBe("UserValidationError");
  });
});

// ---------------------------------------------------------------------------
// createUser
// ---------------------------------------------------------------------------

describe("createUser", () => {
  let repo: ReturnType<typeof createInMemoryUserRepository>;

  beforeEach(() => {
    repo = createInMemoryUserRepository();
  });

  const deps = () => ({ userRepo: () => repo });

  it("creates and returns a new user", async () => {
    const [user, error] = await createUser({ name: "Bob", email: "bob@example.com" }, deps());
    expect(error).toBeNull();
    expect(user).toMatchObject({ name: "Bob", email: "bob@example.com" });
    expect(user?.id).toBeDefined();
  });

  it("returns UserAlreadyExistsError when a user with the same name exists", async () => {
    repo.seed([ALICE]);
    const [user, error] = await createUser({ name: "Alice", email: "alice2@example.com" }, deps());
    expect(user).toBeNull();
    expect(error?.kind).toBe("UserAlreadyExistsError");
  });

  it("returns UserValidationError for an invalid email", async () => {
    const [user, error] = await createUser({ name: "Bob", email: "not-an-email" }, deps());
    expect(user).toBeNull();
    expect(error?.kind).toBe("UserValidationError");
  });

  it("returns UserValidationError when name is empty", async () => {
    const [user, error] = await createUser({ name: "", email: "bob@example.com" }, deps());
    expect(user).toBeNull();
    expect(error?.kind).toBe("UserValidationError");
  });

  it("returns UserValidationError when input is missing required fields", async () => {
    const [user, error] = await createUser({}, deps());
    expect(user).toBeNull();
    expect(error?.kind).toBe("UserValidationError");
  });
});
