import { describe, it, expect, beforeEach } from "vitest";
import { createUser } from "../../../../src/core/features/user/create-user";
import { createInMemoryUserRepository } from "../../../helpers/in-memory-user-repository";
import type { User } from "../../../../src/core/domain/user";

const ALICE: User = { id: "1", name: "Alice", email: "alice@example.com" };

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
